/*
Copyright 2013-2018 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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

var EXPORTED_SYMBOLS = [
	'AutoarchiveReloadedOverlay'
]

"use strict";
Cu.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("chrome://autoarchiveReloaded/content/thunderbird-stdlib/msgHdrUtils.js");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
Cu.import("resource:///modules/iteratorUtils.jsm");
Cu.import("resource:///modules/MailServices.jsm");
Components.utils.import("chrome://autoarchiveReloaded/content/options.js");

namespace AutoarchiveReloadedOverlay
{

	//singleton class for getting string resources
	export const StringBundle:nsIStringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
    	.createBundle("chrome://autoarchiveReloaded/locale/autoarchive.properties");

	//-------------------------------------------------------------------------------------

	//singleton with global helper
	class Helper
    {
        static getMail3Pane():Mail3Pane
        {
            return Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator)
                .getMostRecentWindow("mail:3pane");
        }
		
		//don't call this getPromptService because Mozillas automatic extension checker warns (wrong) about it
		static getThePromptService():nsIPromptService
		{
			return Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		}
		
		static messageHasTags(msgDbHeader:nsIMsgDBHdr):boolean
		{
			let tags = msgHdrGetTags(msgDbHeader);
			return (tags && tags.length>0);
		}
		
		static messageGetAgeInDays (msgDbHeader:nsIMsgDBHdr):number
		{
			let now = new Date();
			let ageInSeconds = (now.getTime()/1000) - msgDbHeader.dateInSeconds;
			let ageInDays = ageInSeconds/(60*60*24);
			return ageInDays;
		}
    }

	//-----------------------------------------------------------------------------------------------------	

	//singleton class for logging
	enum LogLevel
	{
		LEVEL_INFO,LEVEL_ERROR
	}

	class Logger
    {
		//private
		private static consoleService:nsIConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		static getLogLevelFromPref():LogLevel
		{
			if (AutoarchiveReloaded.settings.globalSettings.enableInfoLogging)				
				return LogLevel.LEVEL_INFO;
			
			return LogLevel.LEVEL_ERROR;
		}
		
		static info (str:string):void
		{
			this.log(LogLevel.LEVEL_INFO,str);
		}
		
		static error (str:string):void
		{
			this.log(LogLevel.LEVEL_ERROR,str);
		}

		static errorException(e:any):void
		{
			this.error(this.getExceptionInfo(e));
		}
		
		static getExceptionInfo(e:any):string
		{
			return e + "; Source: '" + e.fileName + "'; Line: " + e.lineNumber + "; code: " + e.toSource() + "; stack: " + e.stack;
		}
		
		private static log(levelToLog:LogLevel,str:string):void
		{
			if (levelToLog < this.getLogLevelFromPref())
				return;
			
			this.DoLog(levelToLog,str);
		}
		
        private static DoLog (levelToLog:LogLevel,str:string):void
        {
			let date = new Date();
			let strToLog = date. toLocaleString() + " - AutoarchiveReloaded - ";
			if (levelToLog==LogLevel.LEVEL_INFO)
				strToLog += "INFO";
			else
				strToLog += "ERROR";
			strToLog += ": " + str

			this.consoleService.logStringMessage(strToLog);
			this.writeToFile(strToLog);
        }
		
		static writeToFile (str:string):void
		{
			try
			{
				//see https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O
			
				// get file in the profile directory ("ProfD")
				let file = FileUtils.getFile("ProfD", ["AutoarchiveReloadedLog.txt"]);

				let foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
				foStream.init(file, 0x02 | 0x08 | 0x10, -1, 0); //-1 = default 0664, but 0664 does not work, maybe 664...

				let converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
				converter.init(foStream, "UTF-8", 0, 0);
				converter.writeString(str + "\r\n");
				converter.close(); // this closes foStream
			}
			catch (e)
			{
				Application.console.log("error writing to log file " + this.getExceptionInfo(e));
				//trotzdem weitermachen, ist ja nur logging...
			}
		}
    }

//------------------------------------------------------------------------------

//for managing the activities in activity view
class ActivityManager
{
	folder:nsIMsgFolder;
	startProcess:nsIActivityProcess;

	constructor (folder:nsIMsgFolder)
	{
		this.folder = folder;
	}

	start():void
	{
		try
		{
			let activityManager = this.getActivityManager();
			this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

			this.startProcess.init(StringBundle.formatStringFromName("activityStart", [this.folder.name], 1), null);
			this.startProcess.contextType = "account"; // group this activity by account
			this.startProcess.contextObj = this.folder.server; // account in question

			activityManager.addActivity(this.startProcess);
		}
		catch (e)
		{
			Logger.errorException(e);
			throw e;
		}
	}

	stopAndSetFinal (actual:number):void
	{
		try
		{
			let activityManager = this.getActivityManager();
			this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
			activityManager.removeActivity(this.startProcess.id);

			let msgNumber:string;
			if (actual < 0)
				msgNumber = "? (error occured)";
			else
				msgNumber = actual.toString();

			let event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
			event.init(StringBundle.formatStringFromName("activityDone", [this.folder.name], 1),
				null,
				StringBundle.formatStringFromName("activityMessagesToArchive", [msgNumber], 1),
				this.startProcess.startTime, // start time
				Date.now() // completion time
			);
			event.contextType = this.startProcess.contextType; // optional
			event.contextObj = this.startProcess.contextObj; // optional
			activityManager.addActivity(event);
		}
		catch (e)
		{
			Logger.errorException(e);
			throw e;
		}
	}

	getActivityManager():nsIActivityManager
	{
		return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
	}
}

//-------------------------------------------------------------------------------------

//for collecting the searched mails and start real archiving
class SearchListener
{
    messages:nsIMsgDBHdr[] = [];
    folder:nsIMsgFolder;
    activity:ActivityManager;
	settings:Settings;
	onFolderArchivedEvent:() => void;

	constructor(folder:nsIMsgFolder, activity:ActivityManager,settings:Settings,onFolderArchivedEvent:()=> void)
	{
		this.folder = folder;
		this.activity = activity;
		this.settings = settings;
		this.onFolderArchivedEvent = onFolderArchivedEvent;
	}

	archiveMessages():number
	{
		try
		{
			Logger.info("start real archiving of '" + this.folder.name + "' (" + this.messages.length + " messages)");
			let mail3PaneWindow:Mail3Pane = Helper.getMail3Pane();
			
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
			
			let batchMover:BatchMessageMover = new mail3PaneWindow.BatchMessageMover();
		
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
						Logger.info("mail3PaneWindow.gFolderDisplay.dbView is null > batchMessageMover will not work");
						let folderToSelect = this.folder;
						if (folderToSelect)
						{
							Logger.info("> try to select folder " + folderToSelect.name + " " + folderToSelect.URI);
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
			Logger.errorException(e);
			return -1;;
		}
	}

	//collect all messages
	onSearchHit(dbHdr:nsIMsgDBHdr, folder:nsIMsgFolder):void
	{
		try
		{
			//determine ageInDays
			let ageInDays = 0;
			let other = true;
			
			//unread
			if (!dbHdr.isRead)
			{
				if (!this.settings.accountSettings.bArchiveUnread)
					return;
					
				other = false;
				ageInDays = Math.max(ageInDays,this.settings.accountSettings.daysUnread);
			}

			//marked (starred)
			if (dbHdr.isFlagged)
			{
				if (!this.settings.accountSettings.bArchiveMarked)
					return;
					
				other = false;
				ageInDays = Math.max(ageInDays,this.settings.accountSettings.daysMarked);
			}
				
			//tagged
			if (Helper.messageHasTags(dbHdr))
			{
				if (!this.settings.accountSettings.bArchiveTagged)
					return;
					
				other = false;
				ageInDays = Math.max(ageInDays,this.settings.accountSettings.daysTagged);
			}
			
			if (other)
			{
				if (!this.settings.accountSettings.bArchiveOther)
					return;
				
				ageInDays = Math.max(ageInDays,this.settings.accountSettings.daysOther);
			}
			
			if (Helper.messageGetAgeInDays(dbHdr) <= ageInDays)
				return;
			
			//check if archive is possible for this message/in this account
			//TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
			let mail3PaneWindow:Mail3Pane = Helper.getMail3Pane();
			if (mail3PaneWindow.getIdentityForHeader(dbHdr).archiveEnabled)
			{
				this.messages.push(dbHdr);
			}
		}
		catch (e)
		{
			Logger.errorException(e);
			throw e;
		}
	}

	//after the search was done, archive all messages
	onSearchDone (status:any):void
	{
		Logger.info("message search done for '" + this.folder.name + "' in account '" + this.folder.server.prettyName + "' -> " + this.messages.length + " messages found to archive");
		let result = 0;
		if (this.messages.length > 0)
			result = this.archiveMessages();
		this.activity.stopAndSetFinal(result);
		this.onFolderArchivedEvent();
	}

	onNewSearch():void
	{

	}
}

//-------------------------------------------------------------------------------------
//main class
class Autoarchiver
{
	//properties:
	accounts:nsIMsgAccount[];
	foldersToArchive:number = 0;
	foldersArchived:number = 0;
	onDoneEvent:()=>void;

	constructor(onDoneEvent:()=>void)
	{
		this.accounts = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
		this.onDoneEvent = onDoneEvent;
	}

//determine all folders (recursive, starting with param folder), which we want to archive
//write output to inboxFolders array
getFolders (folder:nsIMsgFolder, outInboxFolders:nsIMsgFolder[]):void
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
			Logger.info("ignore folder '" + folder.name + "'");
            return;
		}

        //a Feed account (RSS Feeds) will be listed here, but it is kicked out later because it does not have archive options...

        outInboxFolders.push(folder);

        if (folder.hasSubFolders)
        {
            for (let subFolder of fixIterator(folder.subFolders, Ci.nsIMsgFolder))
            {
                this.getFolders(subFolder, outInboxFolders);
            }
        }
    }
    catch (e)
    {
		Logger.errorException(e);
		throw e;
    }
}

archiveFolder(folder:nsIMsgFolder, settings:Settings):void
{
	try
	{
		Logger.info("start searching messages to archive in folder '" + folder.name + "' in account '" + folder.server.prettyName + "'");
		//build a search for the messages to archive
		let searchSession = Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession);
		searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

		//attention: the strange value copy syntax is needed!

		//find only messages with interesting age
		//AgeInDays > age
		let searchByAge = searchSession.createTerm();
		searchByAge.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
		let value = searchByAge.value;
		value.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
		value.age = settings.getMinAge();
		searchByAge.value = value;
		searchByAge.op = Ci.nsMsgSearchOp.IsGreaterThan;
		searchByAge.booleanAnd = true;
		searchSession.appendTerm(searchByAge);

		//do not search for (marked as) deleted messages
		let termNoDeleted = searchSession.createTerm();
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
		let activity = new ActivityManager(folder);
		activity.start();
		
		//TODO: durch => Ausdruck ersetzen, dann kann thisforEvent weg...
		let thisForEvent = this;
		searchSession.registerListener(new SearchListener(folder, activity,settings,function ()
		{
			thisForEvent.foldersArchived++;
		}));
		searchSession.search(null);
	}
    catch (e)
    {
		Logger.errorException(e);
		throw e;
    }
};

//archive messages for all accounts
//(depending on the autoarchive options of the account)
archiveAccounts():void
{
	try
	{
		this.foldersArchived = 0;
		
		let foldersToArchive = 0;
		
		for (let account of this.accounts)
		{
			Logger.info("check account '" + account.incomingServer.prettyName + "'");
			if (AutoarchiveReloaded.isAccountArchivable(account))
			{
				let accountSettings = AutoarchiveReloaded.settings.accountSettings[account.key];
				if (accountSettings != undefined)
				{
					let settings = new Settings(accountSettings,account.incomingServer.prettyName);
					if (settings.isArchivingSomething())
					{
						let inboxFolders:nsIMsgFolder[] = [];
						Logger.info("getting folders to archive in account '" + account.incomingServer.prettyName + "'");
						this.getFolders(account.incomingServer.rootFolder, inboxFolders);
						foldersToArchive += inboxFolders.length;
						for (let folder of inboxFolders)
							this.archiveFolder(folder,settings);
					}
					else
						Logger.info("autoarchive disabled, ignore account '" + account.incomingServer.prettyName + "'");
				}
				else
					Logger.info("autoarchive disabled, ignore account '" + account.incomingServer.prettyName + "' because of missing settings");
			}
			else
				Logger.info("ignore account '" + account.incomingServer.prettyName + "'");
		}

		this.checkForArchiveDone(foldersToArchive);
	}
    catch (e)
    {
		Logger.errorException(e);
		throw e;
    }
}

checkForArchiveDone(foldersToArchive:number):void
{
	//wait until all accounts are ready
	if (this.foldersArchived == foldersToArchive)
	{
		//fire event
		this.onDoneEvent();
	}
	else
	{
		//TODO: bind?
		setTimeout(this.checkForArchiveDone.bind(this,foldersToArchive), 500);
	}
}
}

//-------------------------------------------------------------------------------------

enum States
{
	UNINITIALZED, //also if you use the old autoarchive plugin
	READY_FOR_WORK,
	IN_PROGRESS
}

	//singleton with global /startup/ui functions
	export class Global
    {
		static status:States = States.UNINITIALZED;

		static startup ():void
		{
			Logger.info("start...");
			let appInfoLogger = new AppInfoLogger();
			appInfoLogger.log();

			this.status = States.READY_FOR_WORK;
			Logger.info("ready for work");

			if (AutoarchiveReloaded.settings.globalSettings.archiveType=="startup")
			{
				Logger.info("archive type at startup");
				
				//wait some time to give TB time to connect and everything
				//TODO: bind?
				setTimeout(this.onDoArchiveAutomatic.bind(this), 9000);
				
				//repeat after one day (if someone has open Thunderbird all the time)
				//TODO: bind?
				setInterval(this.onDoArchiveAutomatic.bind(this), 86400000);
			}
			else
				Logger.info("archive type manually");
		}
		
		static onDoArchiveAutomatic():void
		{
			Logger.info("try automatic archive");
			if (this.status != States.READY_FOR_WORK)
			{
				Logger.info("automatic archive busy, wait");
				//busy: wait 5 seconds
				//TODO: bind?
				setTimeout(this.onDoArchiveAutomatic.bind(this), 5000);
			}
			else
				this.onDoArchive();
		}
		
		static onDoArchive():void
		{
			Logger.info("start archiving");
			this.status = States.IN_PROGRESS;
			//TODO: bind?
			let autoarchiveReloaded = new Autoarchiver(this.onArchiveDone.bind(this));
			autoarchiveReloaded.archiveAccounts();
		}
		
		static onArchiveDone():void
		{
			Logger.info("archive (searching messages to archive) done");
			this.status = States.READY_FOR_WORK;
		}
		
		static onArchiveManually ():void
		{
			Logger.info("try manual archive");
			if (this.status == States.UNINITIALZED)
			{
				Logger.info("not initialized, cancel");
				Helper.getThePromptService().alert(null, StringBundle.GetStringFromName("dialogTitle"), StringBundle.GetStringFromName("waitForInit"));
				return;
			}
			
			if (Helper.getThePromptService().confirm(null, StringBundle.GetStringFromName("dialogTitle"),  StringBundle.GetStringFromName("dialogStartManualText")))
			{
				if (this.status == States.IN_PROGRESS)
				{
					Logger.info("busy with other archive..., cancel");
					Helper.getThePromptService().alert(null, StringBundle.GetStringFromName("dialogTitle"), StringBundle.GetStringFromName("waitForArchive"));
					return;
				}
				this.onDoArchive();
			}
			else
				Logger.info("manual archive canceled by user");
		};
	};

//-----------------------------------------------------------------------------------------------------	
class Settings
{
	readonly accountSettings:IAccountSettings;

	constructor(accountSettings:IAccountSettings,accountName:string)
	{
		this.accountSettings = accountSettings;
		this.log(accountName);
	}

	isArchivingSomething ():boolean
	{
		return (this.accountSettings.bArchiveOther || this.accountSettings.bArchiveMarked || this.accountSettings.bArchiveTagged || this.accountSettings.bArchiveUnread);
	}

	getMinAge():number
	{
		let minAge = Number.MAX_VALUE;
		if (this.accountSettings.bArchiveOther)
			minAge = Math.min(this.accountSettings.daysOther,minAge);
		if (this.accountSettings.bArchiveMarked)
			minAge = Math.min(this.accountSettings.daysMarked,minAge);
		if (this.accountSettings.bArchiveTagged)
			minAge = Math.min(this.accountSettings.daysTagged,minAge);
		if (this.accountSettings.bArchiveUnread)
			minAge = Math.min(this.accountSettings.daysUnread,minAge);
			
		return minAge;
	}

	private log(accountName:string)
	{
		Logger.info("Settings for '" + accountName + "':");
		Logger.info(JSON.stringify(this.accountSettings));
	};
}

//-----------------------------------------------------------------------------------------------------	
//-----------------------------------------------------------------------------------------------------	
class AppInfoLogger
{
log ():void
{
	this.logAppInfo();
	this.logAddonInfo();
	this.logAccountInfo();
}

logAppInfo():void
{
	try
	{
		let appInfo:nsIXULAppInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
		
		//the new extension system does not provide a window > use mail3pane instead
		let window = Helper.getMail3Pane();
		Logger.info("ApplicationInfo ID:" + appInfo.ID + "; Version:" + appInfo.version + "; BuildID:" + appInfo.appBuildID + "; PlatformVersion:" + appInfo.platformVersion + "; PlatformBuildID:" + appInfo.platformBuildID + "; language: " + window.navigator.language);
		
		Logger.info("SystemInfo " + window.navigator.oscpu + "| " + window.navigator.platform + "| " + window.navigator.userAgent);
	}
    catch (e)
    {
		Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
}

logAddonInfo():void
{
	try
	{
		AddonManager.getAllAddons(function(addons:any[]){
			for (let n=0;n<addons.length;n++)
			{
				let addon = addons[n];
				Logger.info("Installed Addon-Info: " + addon.name + " (" + addon.id + ") version " + addon.version + "; active: " + addon.isActive);
			}
		});
	}
    catch (e)
    {
		Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
}

logAccountInfo():void
{
	try
	{
		let accounts:nsIMsgAccount[] = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
		for (let account of accounts)
		{
			Logger.info("Account Info: '" + account.incomingServer.prettyName + "'; type: " + 
				account.incomingServer.type + "; localStoreType: " + account.incomingServer.localStoreType + "; " + account.incomingServer.serverURI);
		}
	}
    catch (e)
    {
		Logger.errorException(e);
		//don't throw... this method is only info logging...
    }
}
}

}