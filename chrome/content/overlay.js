/*
Copyright 2013-2014 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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
Cu.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("chrome://autoarchiveReloaded/content/thunderbird-stdlib/msgHdrUtils.js");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
Cu.import("resource:///modules/iteratorUtils.jsm");
Cu.import("resource:///modules/mailServices.js");

var AutoarchiveReloadedOverlay = AutoarchiveReloadedOverlay || {};

//singleton class for getting string resources
AutoarchiveReloadedOverlay.StringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
    .createBundle("chrome://autoarchiveReloaded/locale/autoarchive.properties");

//-------------------------------------------------------------------------------------

//singleton with global helper
//(must be defined BEFORE the logger because of the Preferences function)
AutoarchiveReloadedOverlay.Helper = new function ()
    {
        this.getMail3Pane = function ()
        {
            return Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator)
                .getMostRecentWindow("mail:3pane");
        };
		
		//don't call this getPromptService because Mozillas automatic extension checker warns (wrong) about it
		this.getThePromptService = function()
		{
			return Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		};
		
		this.messageHasTags = function (msgDbHeader)
		{
			var tags = msgHdrGetTags(msgDbHeader);
			return (tags && tags.length>0);
		};
		
		this.messageGetAgeInDays = function (msgDbHeader)
		{
			var now = new Date();
			var ageInSeconds = (now.getTime()/1000) - msgDbHeader.dateInSeconds;
			var ageInDays = ageInSeconds/(60*60*24);
			return ageInDays;
		};

		this.getPreferences = function()
		{
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
			return prefs.getBranch("extensions.AutoarchiveReloaded.");
		};
    };

//-----------------------------------------------------------------------------------------------------	

//singleton class for logging
AutoarchiveReloadedOverlay.Logger = new function ()
    {
		//private
		this.LEVEL_INFO = 0;
		this.LEVEL_ERROR = 1;
		this.consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		this.getLogLevelFromPref = function()
		{
			if (AutoarchiveReloadedOverlay.Helper.getPreferences().getBoolPref("enableInfoLogging"))				
				return this.LEVEL_INFO;
			
			return this.LEVEL_ERROR;
		};
		
		//public
		this.level = this.getLogLevelFromPref();
		
		//------------------------------------------
		//Preference Listener
		//see https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/Handling_Preferences#Preference_listeners
		this.observe = function(aSubject, aTopic, aData)
		{
			this.level = this.getLogLevelFromPref();
			this.info("Logging changed");
		};

		var _prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		//_prefService.QueryInterface(Ci.nsIPrefBranch2);
		_prefService.addObserver("extensions.AutoarchiveReloaded.enableInfoLogging", this, false);
		_prefService.QueryInterface(Ci.nsIPrefBranch);
		
		//------------------------------------------
					
		this.info = function(str)
		{
			this.log(this.LEVEL_INFO,str);
		};
		
		this.error = function(str)
		{
			this.log(this.LEVEL_ERROR,str);
		};

		this.errorException = function(e)
		{
			this.error(this.getExceptionInfo(e));
		};
		
		this.getExceptionInfo= function(e)
		{
			return e + "; Source: '" + e.fileName + "'; Line: " + e.lineNumber + "; code: " + e.toSource() + "; stack: " + e.stack;
		};
		
		//private
		this.log = function(levelToLog,str)
		{
			if (levelToLog < this.level)
				return;
			
			this.DoLog(levelToLog,str);
		};
		
        this.DoLog = function (levelToLog,str)
        {
			var date = new Date();
			var strToLog = date. toLocaleString() + " - AutoarchiveReloaded - ";
			if (levelToLog==this.LEVEL_INFO)
				strToLog += "INFO";
			else
				strToLog += "ERROR";
			strToLog += ": " + str

			this.consoleService.logStringMessage(strToLog);
			this.writeToFile(strToLog);
        };
		
		this.writeToFile = function (str)
		{
			try
			{
				//see https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O
			
				// get file in the profile directory ("ProfD")
				var file = FileUtils.getFile("ProfD", ["AutoarchiveReloadedLog.txt"]);

				var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
				foStream.init(file, 0x02 | 0x08 | 0x10, -1, 0); //-1 = default 0664, but 0664 does not work, maybe 664...

				var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
				converter.init(foStream, "UTF-8", 0, 0);
				converter.writeString(str + "\r\n");
				converter.close(); // this closes foStream
			}
			catch (e)
			{
				Application.console.log("error writing to log file " + this.getExceptionInfo(e));
				//trotzdem weitermachen, ist ja nur logging...
			}
		};
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
	try
	{
		var activityManager = this.getActivityManager();
		this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

		this.startProcess.init(AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityStart", [this.folder.name], 1), null);
		this.startProcess.contextType = "account"; // group this activity by account
		this.startProcess.contextObj = this.folder.server; // account in question

		activityManager.addActivity(this.startProcess);
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

AutoarchiveReloadedOverlay.ActivityManager.prototype.stopAndSetFinal = function (actual)
{
	try
	{
		var activityManager = this.getActivityManager();
		this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
		activityManager.removeActivity(this.startProcess.id);

		if (typeof actual == "string" || actual > 0)
		{
			var event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
			event.init(AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityDone", [this.folder.name], 1),
				null,
				AutoarchiveReloadedOverlay.StringBundle.formatStringFromName("activityMessagesToArchive", [actual], 1),
				this.startProcess.startTime, // start time
				Date.now() // completion time
			);
			event.contextType = this.startProcess.contextType; // optional
			event.contextObj = this.startProcess.contextObj; // optional
			activityManager.addActivity(event);
		}
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

AutoarchiveReloadedOverlay.ActivityManager.prototype.getActivityManager = function ()
{
    return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
};

//-------------------------------------------------------------------------------------

//for collecting the searched mails and start real archiving
AutoarchiveReloadedOverlay.SearchListener = function(folder, activity,settings,onFolderArchivedEvent)
{
    this.messages = [];
    this.folder = folder;
    this.activity = activity;
	this.settings = settings;
	this.onFolderArchivedEvent = onFolderArchivedEvent;
}

AutoarchiveReloadedOverlay.SearchListener.prototype.archiveMessages = function ()
{
	try
	{
		AutoarchiveReloadedOverlay.Logger.info("start real archiving of '" + this.folder.name + "' (" + this.messages.length + " messages)");
		var mail3PaneWindow = AutoarchiveReloadedOverlay.Helper.getMail3Pane();
		
		//TB jumps to the end (after finishing the archiving) if no message is selected 
		//> select the first message (unfortunately it will become unread...)
		//(but only select the first message if the messages being archived are from the current folder)
		if (this.messages.length>0)
		{
			if (this.messages[0].folder == mail3PaneWindow.gFolderDisplay.displayedFolder)
			{
				if (mail3PaneWindow.gFolderDisplay.selectedCount <= 0)
				{
					mail3PaneWindow.gFolderDisplay.navigate(Components.interfaces.nsMsgNavigationType.firstMessage);
				}
			}
		}
		
		var batchMover = new mail3PaneWindow.BatchMessageMover();
	
		//There are several issues with "this.view.dbView is null" inside "chrome://messenger/content/folderDisplay.js", 1359
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/1
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/5
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/7
		//something is wrong inside the TB stuff at this moment
		//the null pointer exception is described here: https://bugzilla.mozilla.org/show_bug.cgi?id=978559 but the Mozilla guys have not done anything about it until now
		//
		//one reason is, if no folder is selected (for example if the account is selected only)
		//therefore we try to select some folder if we find the dbView is null
		if (mail3PaneWindow.gFolderDisplay)
		{
			if (mail3PaneWindow.gFolderDisplay.view)
			{
				if (!mail3PaneWindow.gFolderDisplay.view.dbView)
				{
					AutoarchiveReloadedOverlay.Logger.info("mail3PaneWindow.gFolderDisplay.dbView is null > batchMessageMover will not work");
					var folderToSelect = this.folder;
					if (folderToSelect)
					{
						AutoarchiveReloadedOverlay.Logger.info("> try to select folder " + folderToSelect.name + " " + folderToSelect.URI);
						//When extension TorBirdy was installed gFolderTreeView.selectFolder did not work.
						//gFolderDisplay.show worked with and without TorBirdy.
						mail3PaneWindow.gFolderDisplay.show(folderToSelect);
					}
				}
			}
		}
		
		//TODO: do not archive if a imap server is offline (otherwise the archive is done locally but not on the server, if you start next time (and you are online) it may be archived again
		//-> problem: how to detect imap server problems/problems with i-net connection? (we do not talk about online/offline mode here which you can handle with  MailOfflineMgr!)
		//I have also reported the real bug to TB: see https://bugzilla.mozilla.org/show_bug.cgi?id=956598

        batchMover.archiveMessages(this.messages);
        return this.messages.length;
    }
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
        return "? (error occured)";
    }
};

//collect all messages
AutoarchiveReloadedOverlay.SearchListener.prototype.onSearchHit = function (dbHdr, folder)
{
    try
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
		if (AutoarchiveReloadedOverlay.Helper.messageHasTags(dbHdr))
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
		
		//check if archive is possible for this message/in this account
        //TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
        var mail3PaneWindow = AutoarchiveReloadedOverlay.Helper.getMail3Pane();
        if (mail3PaneWindow.getIdentityForHeader(dbHdr).archiveEnabled)
        {
            this.messages.push(dbHdr);
        }
    }
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

//after the search was done, archive all messages
AutoarchiveReloadedOverlay.SearchListener.prototype.onSearchDone = function (status)
{
	AutoarchiveReloadedOverlay.Logger.info("message search done for '" + this.folder.name + "' in account '" + this.folder.server.prettyName + "' -> " + this.messages.length + " messages found to archive");
    var result = 0;
    if (this.messages.length > 0)
        result = this.archiveMessages();
    this.activity.stopAndSetFinal(result);
	this.onFolderArchivedEvent();
};

AutoarchiveReloadedOverlay.SearchListener.prototype.onNewSearch = function () {};

//-------------------------------------------------------------------------------------
//main class
AutoarchiveReloadedOverlay.Autoarchiver = function(onDoneEvent)
{
    //properties:
    this.accounts = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
	this.foldersToArchive = 0;
	this.foldersArchived = 0;
	this.onDoneEvent = onDoneEvent;
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
		{
			AutoarchiveReloadedOverlay.Logger.info("ignore folder '" + folder.name + "'");
            return;
		}

        //a Feed account (RSS Feeds) will be listed here, but it is kicked out later because it does not have archive options...

        outInboxFolders.push(folder);

        if (folder.hasSubFolders)
        {
            for (var subFolder of fixIterator(folder.subFolders, Ci.nsIMsgFolder))
            {
                this.getFolders(subFolder, outInboxFolders);
            }
        }
    }
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

AutoarchiveReloadedOverlay.Autoarchiver.prototype.archiveFolder = function (folder, settings)
{
	try
	{
		AutoarchiveReloadedOverlay.Logger.info("start searching messages to archive in folder '" + folder.name + "' in account '" + folder.server.prettyName + "'");
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
		termNoDeleted.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
		termNoDeleted.op = Ci.nsMsgSearchOp.Isnt;
		termNoDeleted.booleanAnd = true;
		searchSession.appendTerm(termNoDeleted);
		
		//the other search parameters will be done in the listener itself, we can not create such a search
		//also the real archiving is done on the SearchListener...
		var activity = new AutoarchiveReloadedOverlay.ActivityManager(folder);
		activity.start();
		
		var thisForEvent = this;
		searchSession.registerListener(new AutoarchiveReloadedOverlay.SearchListener(folder, activity,settings,function ()
		{
			thisForEvent.foldersArchived++;
		}));
		searchSession.search(null);
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

//archive messages for all accounts
//(depending on the autoarchive options of the account)
AutoarchiveReloadedOverlay.Autoarchiver.prototype.archiveAccounts = function ()
{
	try
	{
		this.foldersArchived = 0;
		
		var foldersToArchive = 0;
		
		for (var account of this.accounts)
		{
			AutoarchiveReloadedOverlay.Logger.info("check account '" + account.incomingServer.prettyName + "'");
			//ignore IRC accounts
			if (account.incomingServer.localStoreType == "mailbox" || account.incomingServer.localStoreType == "imap" || account.incomingServer.localStoreType == "news")
			{
				var settings = new AutoarchiveReloadedOverlay.Settings(account);
				if (settings.isArchivingSomething())
				{
					var inboxFolders = [];
					AutoarchiveReloadedOverlay.Logger.info("getting folders to archive in account '" + account.incomingServer.prettyName + "'");
					this.getFolders(account.incomingServer.rootFolder, inboxFolders);
					foldersToArchive += inboxFolders.length;
					for (var folder of inboxFolders)
						this.archiveFolder(folder,settings);
				}
				else
					AutoarchiveReloadedOverlay.Logger.info("autoarchive disabled, ignore account '" + account.incomingServer.prettyName + "'");
			}
			else
				AutoarchiveReloadedOverlay.Logger.info("ignore account '" + account.incomingServer.prettyName + "'");
		}

		this.checkForArchiveDone(foldersToArchive);
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
};

AutoarchiveReloadedOverlay.Autoarchiver.prototype.checkForArchiveDone = function (foldersToArchive)
{
	//wait until all accounts are ready
	if (this.foldersArchived == foldersToArchive)
	{
		//fire event
		this.onDoneEvent();
	}
	else
	{
		setTimeout(this.checkForArchiveDone.bind(this,foldersToArchive), 500);
	}
}


//-------------------------------------------------------------------------------------

//singleton with global status/startup/ui functions
AutoarchiveReloadedOverlay.Global = new function ()
    {
		this.UNINITIALZED = 0; //also if you use the old autoarchive plugin
		this.READY_FOR_WORK = 1;
		this.IN_PROGRESS = 2;
		this.status = this.UNINITIALZED;

		this.startup = function ()
		{
			AutoarchiveReloadedOverlay.Logger.info("start...");
			var appInfoLogger = new AutoarchiveReloadedOverlay.AppInfoLogger();
			appInfoLogger.log();

			//wait a second before starting, because otherwise the check message from startupIfValid is *behind* Thunderbird
			setTimeout(function ()
			{
				AutoarchiveReloadedOverlay.Global.startupIfValid();
			}, 1000);
		};
		
		//we do not start if you have the original version of Autoarchiver installed
		this.startupIfValid = function ()
		{
			try
			{
				var thisForEvent = this;
				AddonManager.getAddonByID("{b3a22f77-26b5-43d1-bd2f-9337488eacef}", function (addon)
				{
					if (addon != null)
					{
						//inform user about plugins
						AutoarchiveReloadedOverlay.Logger.info("invalid because of old autoarchiver");
						AutoarchiveReloadedOverlay.Helper.getThePromptService().alert(null, AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("warningOldAutoarchiverTitle"), AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("warningOldAutoarchiver"));
						return;
					}
					thisForEvent.internalstartup();
				});
			}
			catch (e)
			{
				AutoarchiveReloadedOverlay.Logger.errorException(e);
				throw e;
			}
		};
		
		//real startup
		this.internalstartup = function ()
		{
			this.status = this.READY_FOR_WORK;
			AutoarchiveReloadedOverlay.Logger.info("ready for work");

			if (AutoarchiveReloadedOverlay.Helper.getPreferences().getCharPref("archiveType")=="startup")
			{
				AutoarchiveReloadedOverlay.Logger.info("archive type at startup");
				
				//wait some time to give TB time to connect and everything
				setTimeout(this.onDoArchiveAutomatic.bind(this), 9000);
				
				//repeat after one day (if someone has open Thunderbird all the time)
				setInterval(this.onDoArchiveAutomatic.bind(this), 86400000);
			}
			else
				AutoarchiveReloadedOverlay.Logger.info("archive type manually");
		};
		
		this.onDoArchiveAutomatic = function ()
		{
			AutoarchiveReloadedOverlay.Logger.info("try automatic archive");
			if (this.status != this.READY_FOR_WORK)
			{
				AutoarchiveReloadedOverlay.Logger.info("automatic archive busy, wait");
				//busy: wait 5 seconds
				setTimeout(this.onDoArchiveAutomatic.bind(this), 5000);
			}
			else
				this.onDoArchive();
		}
		
		this.onDoArchive = function ()
		{
			AutoarchiveReloadedOverlay.Logger.info("start archiving");
			this.status = this.IN_PROGRESS;
			var autoarchiveReloaded = new AutoarchiveReloadedOverlay.Autoarchiver(this.onArchiveDone.bind(this));
			autoarchiveReloaded.archiveAccounts();
		}
		
		this.onArchiveDone = function ()
		{
			AutoarchiveReloadedOverlay.Logger.info("archive (searching messages to archive) done");
			this.status = this.READY_FOR_WORK;
		}
		
		this.onArchiveManually = function ()
		{
			AutoarchiveReloadedOverlay.Logger.info("try manual archive");
			if (this.status == this.UNINITIALZED)
			{
				AutoarchiveReloadedOverlay.Logger.info("not initialized, cancel");
				alert(AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("waitForInit"));
				return;
			}
			
			if (AutoarchiveReloadedOverlay.Helper.getThePromptService().confirm(null, AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("dialogTitle"),  AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("dialogStartManualText")))
			{
				if (this.status == this.IN_PROGRESS)
				{
					AutoarchiveReloadedOverlay.Logger.info("busy with other archive..., cancel");
					alert(AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("waitForArchive"));
					return;
				}
				this.onDoArchive();
			}
			else
				AutoarchiveReloadedOverlay.Logger.info("manual archive canceled by user");
		};
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
		this.log();
	};

AutoarchiveReloadedOverlay.Settings.prototype.read = function()
{
	try
	{
		var server = this.account.incomingServer;
		//we take the same option names as the original extension
		this.bArchiveOther = server.getBoolValue("archiveMessages");
		this.daysOther = server.getIntValue("archiveMessagesDays");
		this.bArchiveMarked = server.getBoolValue("archiveStarred");
		this.daysMarked = server.getIntValue("archiveStarredDays");
		this.bArchiveTagged = server.getBoolValue("archiveTagged");
		this.daysTagged = server.getIntValue("archiveTaggedDays");
		this.bArchiveUnread = server.getBoolValue("archiveUnread");
		this.daysUnread = server.getIntValue("archiveUnreadDays");
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		throw e;
    }
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

AutoarchiveReloadedOverlay.Settings.prototype.log = function()
{
	AutoarchiveReloadedOverlay.Logger.info("Settings for '" + this.account.incomingServer.prettyName + "':");
	AutoarchiveReloadedOverlay.Logger.info("- archive other " + this.bArchiveOther);
	AutoarchiveReloadedOverlay.Logger.info("- days other " + this.daysOther);
	AutoarchiveReloadedOverlay.Logger.info("- archive marked " + this.bArchiveMarked);
	AutoarchiveReloadedOverlay.Logger.info("- days marked " + this.daysMarked);
	AutoarchiveReloadedOverlay.Logger.info("- archive tagged " + this.bArchiveTagged);
	AutoarchiveReloadedOverlay.Logger.info("- days tagged " + this.daysTagged);
	AutoarchiveReloadedOverlay.Logger.info("- archive unread " + this.bArchiveUnread);
	AutoarchiveReloadedOverlay.Logger.info("- days unread " + this.daysUnread);
};

//-----------------------------------------------------------------------------------------------------	
//-----------------------------------------------------------------------------------------------------	
AutoarchiveReloadedOverlay.AppInfoLogger = function()
	{
	};

AutoarchiveReloadedOverlay.AppInfoLogger.prototype.log = function()
{
	this.logAppInfo();
	this.logAddonInfo();
	this.logAccountInfo();
}

AutoarchiveReloadedOverlay.AppInfoLogger.prototype.logAppInfo = function()
{
	try
	{
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
		AutoarchiveReloadedOverlay.Logger.info("ApplicationInfo ID:" + appInfo.ID + "; Version:" + appInfo.version + "; BuildID:" + appInfo.appBuildID + "; PlatformVersion:" + appInfo.platformVersion + "; PlatformBuildID:" + appInfo.platformBuildID + "; language: " + window.navigator.language);
		
		AutoarchiveReloadedOverlay.Logger.info("SystemInfo " + window.navigator.oscpu + "| " + window.navigator.platform + "| " + window.navigator.userAgent);
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
};

AutoarchiveReloadedOverlay.AppInfoLogger.prototype.logAddonInfo = function()
{
	try
	{
		AddonManager.getAllAddons(function(addons){
			for (var n=0;n<addons.length;n++)
			{
				var addon = addons[n];
				AutoarchiveReloadedOverlay.Logger.info("Installed Addon-Info: " + addon.name + " (" + addon.id + ") version " + addon.version + "; active: " + addon.isActive);
			}
		});
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
};

AutoarchiveReloadedOverlay.AppInfoLogger.prototype.logAccountInfo = function()
{
	try
	{
		var accounts = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
		for (var account of accounts)
		{
			AutoarchiveReloadedOverlay.Logger.info("Account Info: '" + account.incomingServer.prettyName + "'; type: " + 
				account.incomingServer.type + "; localStoreType: " + account.incomingServer.localStoreType + "; " + account.incomingServer.serverURI);
		}
	}
    catch (e)
    {
		AutoarchiveReloadedOverlay.Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
};
