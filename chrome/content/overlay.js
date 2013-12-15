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
		
		this.messageHasKeywords = function (msgDbHeader)
		{
			var keywords = msgDbHeader.getStringProperty("keywords");
			return (keywords && keywords.length>0);
		};
		
		this.messageGetAgeInDays = function (msgDbHeader)
		{
			var now = new Date();
			var ageInSeconds = (now.getTime()/1000) - msgDbHeader.dateInSeconds;
			var ageInDays = ageInSeconds/(60*60*24);
			return ageInDays;
		}
    };

//------------------------------------------------------------------------------

//for managing the activities in activity view
function AutoarchiveActivityManager(folder)
{
    this.folder = folder;
    this.startProcess = null;
};

AutoarchiveActivityManager.prototype.start = function ()
{
    var activityManager = this.getActivityManager();
    this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

    this.startProcess.init(AutoarchiveReloadedStringBundle.formatStringFromName("activityStart", [this.folder.prettiestName], 1), null);
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
        event.init(AutoarchiveReloadedStringBundle.formatStringFromName("activityDone", [this.folder.prettiestName], 1),
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
function SearchListener(folder, activity,settings)
{
    this.messages = [];
    this.folder = folder;
    this.activity = activity;
	this.settings = settings;
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
	//determine ageInDays
	
	var ageInDays = 0;
	var other = true;
	
	//unread
	if (!dbHdr.isRead)
	{
		if (!this.settings.bArchiveUnread)
			return;
			
		other = false;
		ageInDays = Math.max(ageInDays,this.settings.daysUnread);
	}

	//marked (starred)
	if (dbHdr.isFlagged)
	{
		if (!this.settings.bArchiveMarked)
			return;
			
		other = false;
		ageInDays = Math.max(ageInDays,this.settings.daysMarked);
	}
		
	//tagged
	if (AutoarchiveReloadedHelper.messageHasKeywords(dbHdr))
	{
		if (!this.settings.bArchiveTagged)
			return;
			
		other = false;
		ageInDays = Math.max(ageInDays,this.settings.daysTagged);
	}

	if (other)
	{
		if (!this.settings.bArchiveOther)
			return;
		
		ageInDays = Math.max(ageInDays,this.settings.daysOther);
	}
	
	if (AutoarchiveReloadedHelper.messageGetAgeInDays(dbHdr) <= ageInDays)
		return;
		
    try
    {
		//check if archive is possible for this message/in this account
        //TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
        var mail3PaneWindow = AutoarchiveReloadedHelper.getMail3Pane();
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

AutoarchiveReloaded.prototype.archiveFolder = function (folder, settings)
{
    //build a search for the messages to archive
    var searchSession = Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession);
    searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

    //attention: the strange value copy syntax is needed!

	//find only messages with interesting age
    //AgeInDays > age
    var searchByAge = searchSession.createTerm();
    searchByAge.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
    var value = searchByAge.value;
    value.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
    value.age = settings.getMinAge();
    searchByAge.value = value;
    searchByAge.op = Ci.nsMsgSearchOp.IsGreaterThan;
    searchByAge.booleanAnd = true;
    searchSession.appendTerm(searchByAge);

	//the other search parameters will be done in the listener itself, we can not create such a search
    //also the real archiving is done on the SearchListener...
	var activity = new AutoarchiveActivityManager(folder);
    activity.start();
    searchSession.registerListener(new SearchListener(folder, activity,settings));
    searchSession.search(null);
};

/*
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
	return this.getMsgStatusSearchTerm(searchSession,Ci.nsMsgMessageFlags.Marked,searchForMarked);
};

AutoarchiveReloaded.prototype.getMsgStatusSearchTerm = function (searchSession,messageFlag,searchForFlag)
{
    var searchByLabel = searchSession.createTerm();
    searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
    var value = searchByLabel.value;
    value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
    value.status = messageFlag;
    searchByLabel.value = value;
    if (searchForFlag)
        searchByLabel.op = Ci.nsMsgSearchOp.Is;
    else
        searchByLabel.op = Ci.nsMsgSearchOp.Isnt;
    searchByLabel.booleanAnd = true;
    return searchByLabel;
};

AutoarchiveReloaded.prototype.getReadStatusSearchTerm = function (searchSession, searchReaded)
{
	return this.getMsgStatusSearchTerm(searchSession,Ci.nsMsgMessageFlags.Read,searchReaded);
}
*/

//archive messages for all accounts
//(depending on the autoarchive options of the account)
AutoarchiveReloaded.prototype.archiveAccounts = function ()
{
    for each(var account in this.accounts)
    {
        //ignore IRC accounts
        if (account.incomingServer.localStoreType == "mailbox" || account.incomingServer.localStoreType == "imap" || account.incomingServer.localStoreType == "news")
        {
			var settings = new AutoarchiveSettings(account);
			if (settings.isArchivingSomething())
			{
				var inboxFolders = [];
				this.getFolders(account.incomingServer.rootFolder, inboxFolders);
				for each(var folder in inboxFolders)
				{
					//we take the same option names as the original extension
					this.archiveFolder(folder,settings);
				}
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

function AutoarchiveSettings (account)
	{
		this.account = account;
		
		this.bArchiveOther;
		this.daysOther;
		this.bArchiveMarked;
		this.daysMarked;
		this.bArchiveTagged;
		this.daysTagged;
		this.bArchiveUnread;
		this.daysUnread;
		
		this.read();
		//this.logToConsole();
	};

AutoarchiveSettings.prototype.read = function()
{
	var server = this.account.incomingServer;
	this.bArchiveOther = server.getBoolValue("archiveMessages");
	this.daysOther = server.getIntValue("archiveMessagesDays");
	this.bArchiveMarked = server.getBoolValue("archiveStarred");
	this.daysMarked = server.getIntValue("archiveStarredDays");
	this.bArchiveTagged = server.getBoolValue("archiveTagged");
	this.daysTagged = server.getIntValue("archiveTaggedDays");
	this.bArchiveUnread = server.getBoolValue("archiveUnread");
	this.daysUnread = server.getIntValue("archiveUnreadDays");
};

AutoarchiveSettings.prototype.isArchivingSomething = function()
{
	return (this.bArchiveOther || this.bArchiveMarked || this.bArchiveTagged || this.bArchiveUnread);
}

AutoarchiveSettings.prototype.getMinAge = function()
{
	var minAge = Number.MAX_VALUE;
	if (this.bArchiveOther)
		minAge = Math.min(this.daysOther,minAge);
	if (this.bArchiveMarked)
		minAge = Math.min(this.daysMarked,minAge);
	if (this.bArchiveTagged)
		minAge = Math.min(this.daysTagged,minAge);
	if (this.bArchiveUnread)
		minAge = Math.min(this.daysUnread,minAge);
		
	return minAge;
}

AutoarchiveSettings.prototype.logToConsole = function()
{
	AutoarchiveLogger.logToConsole("Settings for " + this.account.incomingServer.constructedPrettyName);
	AutoarchiveLogger.logToConsole("archive other " + this.bArchiveOther);
	AutoarchiveLogger.logToConsole("days other " + this.daysOther);
	AutoarchiveLogger.logToConsole("archive marked " + this.bArchiveMarked);
	AutoarchiveLogger.logToConsole("days marked " + this.daysMarked);
	AutoarchiveLogger.logToConsole("archive tagged " + this.bArchiveTagged);
	AutoarchiveLogger.logToConsole("days taged " + this.daysTagged);
	AutoarchiveLogger.logToConsole("archive unread " + this.bArchiveUnread);
	AutoarchiveLogger.logToConsole("days unread " + this.daysUnread);
}
//-----------------------------------------------------------------------------------------------------	

//wait a second before starting, because otherwise the check message from initIfValid is *behind* Thunderbird
window.setTimeout(function ()
{
    var autoarchiveReloaded = new AutoarchiveReloaded();
    autoarchiveReloaded.initIfValid();
}, 1000);