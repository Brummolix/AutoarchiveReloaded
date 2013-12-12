"use strict";

Components.utils.import("resource://gre/modules/AddonManager.jsm");

//singleton class for getting string resources
var AutoarchiveReloadedStringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
    .createBundle("chrome://autoarchiveReloaded/locale/autoarchive.properties");

//-----------------------------------------------------------------------------------------------------	
//singleton class for logging
var AutoarchiveLogger = new function ()
    {
        this.logToConsole = function (str)
        {
            Application.console.log("AutoarchiveReloaded: " + str);
        };
    };

//-------------------------------------------------------------------------------------

//singleton with global helper
var AutoarchiveReloadedHelper = new function ()
    {
        this.getMail3Pane = function ()
        {
            return Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator)
                .getMostRecentWindow("mail:3pane");
        };
    };

//------------------------------------------------------------------------------

//for managing the activities in activity view
function AutoarchiveActivityManager(folder, description)
{
    this.folder = folder;
    this.description = description;
    this.startProcess = null;
};

AutoarchiveActivityManager.prototype.start = function ()
{
    var activityManager = this.getActivityManager();
    this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

    this.startProcess.init(AutoarchiveReloadedStringBundle.formatStringFromName("activityStart", [this.folder.prettiestName, this.description], 2), null);
    this.startProcess.contextType = "account"; // group this activity by account
    this.startProcess.contextObj = this.folder.server; // account in question

    activityManager.addActivity(this.startProcess);
};

AutoarchiveActivityManager.prototype.stopAndSetFinal = function (actual)
{
    var activityManager = this.getActivityManager();
    this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
    activityManager.removeActivity(this.startProcess.id);

    if (typeof actual == "string" || actual > 0)
    {
        var event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
        event.init(AutoarchiveReloadedStringBundle.formatStringFromName("activityDone", [this.folder.prettiestName, this.description], 2),
            null,
            AutoarchiveReloadedStringBundle.formatStringFromName("activityMessagesToArchive", [actual], 1),
            this.startProcess.startTime, // start time
            Date.now() // completion time
        );
        event.contextType = this.startProcess.contextType; // optional
        event.contextObj = this.startProcess.contextObj; // optional
        activityManager.addActivity(event);
    }
};

AutoarchiveActivityManager.prototype.getActivityManager = function ()
{
    return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
};

//-------------------------------------------------------------------------------------

//for collecting the searched mails and start real archiving
function SearchListener(folder, activity)
{
    this.messages = [];
    this.folder = folder;
    this.activity = activity;
}

SearchListener.prototype.archiveMessages = function ()
{
    var mail3PaneWindow = AutoarchiveReloadedHelper.getMail3Pane();
    var batchMover = new mail3PaneWindow.BatchMessageMover();

    try
    {
        batchMover.archiveMessages(this.messages);
        return this.messages.length;
    }
    catch (e)
    {
        //if no Mail3Pane?
        Components.utils.reportError("Error during archive messages in folder " + this.folder.name + ". Error: " + e + ". mail3PaneWindow = " + mail3PaneWindow);
        return "? (error occured)";
    }
};

//collect all messages
SearchListener.prototype.onSearchHit = function (dbHdr, folder)
{
    try
    {
        var mail3PaneWindow = AutoarchiveReloadedHelper.getMail3Pane();

        //TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
        if (mail3PaneWindow.getIdentityForHeader(dbHdr)
            .archiveEnabled)
        {
            this.messages.push(dbHdr);
        }
    }
    catch (e)
    {
        //Mail3Pane?
        Components.utils.reportError("Error during checking for archive messages in folder " + folder.name + ". Error: " + e);
    }
};

//after the search was done, archive all messages
SearchListener.prototype.onSearchDone = function (status)
{
    var result = 0;
    if (this.messages.length > 0)
        result = this.archiveMessages();
    this.activity.stopAndSetFinal(result);
};

SearchListener.prototype.onNewSearch = function () {};

//-------------------------------------------------------------------------------------
//main class
function AutoarchiveReloaded()
{
    //properties:
    this.accounts = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
}

//determine all folders (recursive, starting with param folder), which we want to archive
//write output to inboxFolders array
AutoarchiveReloaded.prototype.getFolders = function (folder, outInboxFolders)
{
    try
    {
        //attention do not try to get the folderURL for IMAP account (it crashes or may crash)

        //Do not archive some special folders (and also no subfolders in there)
        //Inbox - yes
        //SentMail - yes, sure
        //Drafts - no, because you want to send them?
        //Trash - no, trash is trash
        //Templates - no, because you want to use it
        //Junk - no junk is junk
        //Archive - no, we do archive
        //Queue - no, must be sent?
        if (folder.getFlag(Ci.nsMsgFolderFlags.Trash) || folder.getFlag(Ci.nsMsgFolderFlags.Junk) || folder.getFlag(Ci.nsMsgFolderFlags.Queue) || folder.getFlag(Ci.nsMsgFolderFlags.Drafts) || folder.getFlag(Ci.nsMsgFolderFlags.Templates) || folder.getFlag(Ci.nsMsgFolderFlags.Archive))
            return;

        //a Feed account (RSS Feeds) will be listed here, but it is kicked out later because it does not have archive options...

        outInboxFolders.push(folder);

        if (folder.hasSubFolders)
        {
            for each(var subFolder in fixIterator(folder.subFolders, Ci.nsIMsgFolder))
            {
                this.getFolders(subFolder, outInboxFolders);
            }
        }
    }
    catch (e)
    {
        Components.utils.reportError("Error check folder: " + folder.name + e);
    }
};

AutoarchiveReloaded.archiveTypeOther = 0;
AutoarchiveReloaded.archiveTypeMarked = 1;
AutoarchiveReloaded.archiveTypeTagged = 2;

AutoarchiveReloaded.prototype.archiveFolder = function (age, folder, type)
{
    //build a search for the messages to archive
    var searchSession = Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession);
    searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

    //attention: the strange value copy syntax is needed

    //AgeInDays > age
    var searchByAge = searchSession.createTerm();
    searchByAge.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
    var value = searchByAge.value;
    value.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
    value.age = age;
    searchByAge.value = value;
    searchByAge.op = Ci.nsMsgSearchOp.IsGreaterThan;
    searchByAge.booleanAnd = true;
    searchSession.appendTerm(searchByAge);

    var activity;
    if (type == AutoarchiveReloaded.archiveTypeOther)
    {
        activity = new AutoarchiveActivityManager(folder, AutoarchiveReloadedStringBundle.GetStringFromName("unmarkedMessages"));

        //no keywords
        searchSession.appendTerm(this.getKeywordSearchTerm(searchSession, false));

        //MsgStatus not marked
        searchSession.appendTerm(this.getMarkedSearchTerm(searchSession, false));
    }
    else if (type == AutoarchiveReloaded.archiveTypeMarked) //(marked with a star)
    {
        activity = new AutoarchiveActivityManager(folder, AutoarchiveReloadedStringBundle.GetStringFromName("markedMessages"));
        //MsgStatus marked
        searchSession.appendTerm(this.getMarkedSearchTerm(searchSession, true));
    }
    else if (type == AutoarchiveReloaded.archiveTypeTagged)
    {
        activity = new AutoarchiveActivityManager(folder, AutoarchiveReloadedStringBundle.GetStringFromName("taggedMessages"));
        //has keywords
        searchSession.appendTerm(this.getKeywordSearchTerm(searchSession, true));

        //MsgStatus not marked
        searchSession.appendTerm(this.getMarkedSearchTerm(searchSession, false));
    }

    //the real archiving is done on the SearchListener
    activity.start();
    searchSession.registerListener(new SearchListener(folder, activity));
    searchSession.search(null);
};

AutoarchiveReloaded.prototype.getKeywordSearchTerm = function (searchSession, searchForNonEmptyKeywords)
{
    var searchByTags = searchSession.createTerm();
    searchByTags.attrib = Ci.nsMsgSearchAttrib.Keywords;
    var value = searchByTags.value;
    value.attrib = Ci.nsMsgSearchAttrib.Keywords;
    searchByTags.value = value;
    if (searchForNonEmptyKeywords)
        searchByTags.op = Ci.nsMsgSearchOp.IsntEmpty;
    else
        searchByTags.op = Ci.nsMsgSearchOp.IsEmpty;
    searchByTags.booleanAnd = true;
    return searchByTags;
};

AutoarchiveReloaded.prototype.getMarkedSearchTerm = function (searchSession, searchForMarked)
{
    var searchByLabel = searchSession.createTerm();
    searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
    var value = searchByLabel.value;
    value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
    value.status = Ci.nsMsgMessageFlags.Marked;
    searchByLabel.value = value;
    if (searchForMarked)
        searchByLabel.op = Ci.nsMsgSearchOp.Is;
    else
        searchByLabel.op = Ci.nsMsgSearchOp.Isnt;
    searchByLabel.booleanAnd = true;
    return searchByLabel;
};

//archive messages for all accounts
//(depending on the autoarchive options of the account)
AutoarchiveReloaded.prototype.archiveAccounts = function ()
{
    for each(var account in this.accounts)
    {
        //ignore IRC accounts
        if (account.incomingServer.localStoreType == "mailbox" || account.incomingServer.localStoreType == "imap" || account.incomingServer.localStoreType == "news")
        {
            var inboxFolders = [];
            this.getFolders(account.incomingServer.rootFolder, inboxFolders);
            for each(var folder in inboxFolders)
            {
                //we take the same option names as the original extension
                if (account.incomingServer.getBoolValue("archiveMessages"))
                    this.archiveFolder(account.incomingServer.getIntValue("archiveMessagesDays"), folder, AutoarchiveReloaded.archiveTypeOther);
                if (account.incomingServer.getBoolValue("archiveStarred"))
                    this.archiveFolder(account.incomingServer.getIntValue("archiveStarredDays"), folder, AutoarchiveReloaded.archiveTypeMarked);
                if (account.incomingServer.getBoolValue("archiveTagged"))
                    this.archiveFolder(account.incomingServer.getIntValue("archiveTaggedDays"), folder, AutoarchiveReloaded.archiveTypeTagged);
            }
        }
    }
};

//we do not start if you have the original version of Autoarchiver installed
AutoarchiveReloaded.prototype.initIfValid = function ()
{
    var thisForEvent = this;
    AddonManager.getAddonByID("{b3a22f77-26b5-43d1-bd2f-9337488eacef}", function (addon)
    {
        if (addon != null)
        {
            //inform user about plugins
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, AutoarchiveReloadedStringBundle.GetStringFromName("warningOldAutoarchiverTitle"), AutoarchiveReloadedStringBundle.GetStringFromName("warningOldAutoarchiver"));
            return;
        }
        thisForEvent.init();
    });
};

AutoarchiveReloaded.prototype.init = function ()
{
    //AutoarchiveLogger.logToConsole("init");

    window.setTimeout(this.archiveAccounts.bind(this), 9000);
    //repeat after one day (if someone has open Thunderbird all the time)
    window.setInterval(this.archiveAccounts.bind(this), 86400000);
};

//-----------------------------------------------------------------------------------------------------	

//wait a second before starting, because otherwise the check message from initIfValid is *behind* Thunderbird
window.setTimeout(function ()
{
    var autoarchiveReloaded = new AutoarchiveReloaded();
    autoarchiveReloaded.initIfValid();
}, 1000);