/*
Copyright 2013 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
Copyright 2012 Alexey Egorov (original version Autoarchive, http://code.google.com/p/autoarchive/ )

 This file is part of AutoarchiveReloaded.

    AutoarchiveReloaded is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AutoarchiveReloaded is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AutoarchiveReloaded.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";
Components.utils.import("resource://gre/modules/AddonManager.jsm");

var AutoarchiveReloadedOverlay = AutoarchiveReloadedOverlay || {};

//singleton class for getting string resources
AutoarchiveReloadedOverlay.StringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
    .createBundle("chrome://autoarchiveReloaded/locale/autoarchive.properties");

//-----------------------------------------------------------------------------------------------------	
//singleton class for logging
AutoarchiveReloadedOverlay.Logger = new function ()
    {
        this.logToConsole = function (str)
        {
			var date = new Date();
            Application.console.log(date. toLocaleString() + " - AutoarchiveReloaded: " + str);
        };
    };

//-------------------------------------------------------------------------------------

//singleton with global helper
AutoarchiveReloadedOverlay.Helper = new function ()
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
AutoarchiveReloadedOverlay.ActivityManager = function(folder)
{
    this.folder = folder;
    this.startProcess = null;
};

AutoarchiveReloadedOverlay.ActivityManager.prototype.start = function ()
{
    var activityManager = this.getActivityManager();
    this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

    this.startProcess.init(AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityStart", [this.folder.prettiestName], 1), null);
    this.startProcess.contextType = "account"; // group this activity by account
    this.startProcess.contextObj = this.folder.server; // account in question

    activityManager.addActivity(this.startProcess);
};

AutoarchiveReloadedOverlay.ActivityManager.prototype.stopAndSetFinal = function (actual)
{
    var activityManager = this.getActivityManager();
    this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
    activityManager.removeActivity(this.startProcess.id);

    if (typeof actual == "string" || actual > 0)
    {
        var event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
        event.init(AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityDone", [this.folder.prettiestName], 1),
            null,
            AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityMessagesToArchive", [actual], 1),
            this.startProcess.startTime, // start time
            Date.now() // completion time
        );
        event.contextType = this.startProcess.contextType; // optional
        event.contextObj = this.startProcess.contextObj; // optional
        activityManager.addActivity(event);
    }
};

AutoarchiveReloadedOverlay.ActivityManager.prototype.getActivityManager = function ()
{
    return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
};

//-------------------------------------------------------------------------------------

//for collecting the searched mails and start real archiving
AutoarchiveReloadedOverlay.SearchListener = function(folder, activity,settings)
{
    this.messages = [];
    this.folder = folder;
    this.activity = activity;
	this.settings = settings;
}

AutoarchiveReloadedOverlay.SearchListener.prototype.archiveMessages = function ()
{
    var mail3PaneWindow = AutoarchiveReloadedOverlay.Helper.getMail3Pane();
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
AutoarchiveReloadedOverlay.SearchListener.prototype.onSearchHit = function (dbHdr, folder)
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
	if (AutoarchiveReloadedOverlay.Helper.messageHasKeywords(dbHdr))
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
	
	if (AutoarchiveReloadedOverlay.Helper.messageGetAgeInDays(dbHdr) <= ageInDays)
		return;
		
    try
    {
		//check if archive is possible for this message/in this account
        //TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
        var mail3PaneWindow = AutoarchiveReloadedOverlay.Helper.getMail3Pane();
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
AutoarchiveReloadedOverlay.SearchListener.prototype.onSearchDone = function (status)
{
    var result = 0;
    if (this.messages.length > 0)
        result = this.archiveMessages();
    this.activity.stopAndSetFinal(result);
};

AutoarchiveReloadedOverlay.SearchListener.prototype.onNewSearch = function () {};

//-------------------------------------------------------------------------------------
//main class
AutoarchiveReloadedOverlay.Autoarchiver = function()
{
    //properties:
    this.accounts = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
}

//determine all folders (recursive, starting with param folder), which we want to archive
//write output to inboxFolders array
AutoarchiveReloadedOverlay.Autoarchiver.prototype.getFolders = function (folder, outInboxFolders)
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
		//Virtual - no, it is virtual :)
        if (folder.getFlag(Ci.nsMsgFolderFlags.Trash) || folder.getFlag(Ci.nsMsgFolderFlags.Junk) || folder.getFlag(Ci.nsMsgFolderFlags.Queue) || folder.getFlag(Ci.nsMsgFolderFlags.Drafts) || folder.getFlag(Ci.nsMsgFolderFlags.Templates) || folder.getFlag(Ci.nsMsgFolderFlags.Archive) || folder.getFlag(Ci.nsMsgFolderFlags.Virtual) )
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

AutoarchiveReloadedOverlay.Autoarchiver.prototype.archiveFolder = function (folder, settings)
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

	//do not search for (marked as) deleted messages
	var termNoDeleted = searchSession.createTerm();
    value = termNoDeleted.value;
    value.status = Ci.nsMsgMessageFlags.IMAPDeleted;
    value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
    termNoDeleted.value = value;
    termNoDeleted.attrib = nsMsgSearchAttrib.MsgStatus;
    termNoDeleted.op = nsMsgSearchOp.Isnt;
    termNoDeleted.booleanAnd = true;
	searchSession.appendTerm(termNoDeleted);
	
	//the other search parameters will be done in the listener itself, we can not create such a search
    //also the real archiving is done on the SearchListener...
	var activity = new AutoarchiveReloadedOverlay.ActivityManager(folder);
    activity.start();
    searchSession.registerListener(new AutoarchiveReloadedOverlay.SearchListener(folder, activity,settings));
    searchSession.search(null);
};

//archive messages for all accounts
//(depending on the autoarchive options of the account)
AutoarchiveReloadedOverlay.Autoarchiver.prototype.archiveAccounts = function ()
{
    for each(var account in this.accounts)
    {
        //ignore IRC accounts
        if (account.incomingServer.localStoreType == "mailbox" || account.incomingServer.localStoreType == "imap" || account.incomingServer.localStoreType == "news")
        {
			var settings = new AutoarchiveReloadedOverlay.Settings(account);
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
AutoarchiveReloadedOverlay.Autoarchiver.prototype.initIfValid = function ()
{
    var thisForEvent = this;
    AddonManager.getAddonByID("{b3a22f77-26b5-43d1-bd2f-9337488eacef}", function (addon)
    {
        if (addon != null)
        {
            //inform user about plugins
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("warningOldAutoarchiverTitle"), AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("warningOldAutoarchiver"));
            return;
        }
        thisForEvent.init();
    });
};

AutoarchiveReloadedOverlay.Autoarchiver.prototype.init = function ()
{
    //AutoarchiveReloadedOverlay.Logger.logToConsole("init");

    window.setTimeout(this.archiveAccounts.bind(this), 9000);
    //repeat after one day (if someone has open Thunderbird all the time)
    window.setInterval(this.archiveAccounts.bind(this), 86400000);
};

//-----------------------------------------------------------------------------------------------------	
AutoarchiveReloadedOverlay.Settings = function(account)
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

AutoarchiveReloadedOverlay.Settings.prototype.read = function()
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

AutoarchiveReloadedOverlay.Settings.prototype.isArchivingSomething = function()
{
	return (this.bArchiveOther || this.bArchiveMarked || this.bArchiveTagged || this.bArchiveUnread);
};

AutoarchiveReloadedOverlay.Settings.prototype.getMinAge = function()
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
};

AutoarchiveReloadedOverlay.Settings.prototype.logToConsole = function()
{
	AutoarchiveReloadedOverlay.Logger.logToConsole("Settings for " + this.account.incomingServer.constructedPrettyName);
	AutoarchiveReloadedOverlay.Logger.logToConsole("archive other " + this.bArchiveOther);
	AutoarchiveReloadedOverlay.Logger.logToConsole("days other " + this.daysOther);
	AutoarchiveReloadedOverlay.Logger.logToConsole("archive marked " + this.bArchiveMarked);
	AutoarchiveReloadedOverlay.Logger.logToConsole("days marked " + this.daysMarked);
	AutoarchiveReloadedOverlay.Logger.logToConsole("archive tagged " + this.bArchiveTagged);
	AutoarchiveReloadedOverlay.Logger.logToConsole("days tagged " + this.daysTagged);
	AutoarchiveReloadedOverlay.Logger.logToConsole("archive unread " + this.bArchiveUnread);
	AutoarchiveReloadedOverlay.Logger.logToConsole("days unread " + this.daysUnread);
};

//-----------------------------------------------------------------------------------------------------	

//wait a second before starting, because otherwise the check message from initIfValid is *behind* Thunderbird
window.setTimeout(function ()
{
    var autoarchiveReloaded = new AutoarchiveReloadedOverlay.Autoarchiver();
    autoarchiveReloaded.initIfValid();
}, 1000);