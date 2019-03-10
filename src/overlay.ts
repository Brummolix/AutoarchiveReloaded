/*!
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

//TODO: remove
AutoarchiveReloaded.loggerWebExtension.info("Hello world overlay.ts");

namespace AutoarchiveReloaded
{
	//-----------------------------------------------------------------------------------------------------

	//TODO: LegacyExtensionLoggerHelper supported filelogging? is it still possible? Maybe as webapi experiment?
	//TODO: getEnableInfoLogging came from settings?

	/*
	class LegacyExtensionLoggerHelper implements ILoggerHelper
	{
		private readonly consoleService: Ci.nsIConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

		public log(msgToLog: string): void
		{
			this.consoleService.logStringMessage(msgToLog);
			this.writeToFile(msgToLog);
		}

		public getEnableInfoLogging(): boolean
		{
			if (settings && settings.globalSettings && settings.globalSettings !== undefined)
			{
				return settings.globalSettings.enableInfoLogging;
			}

			return false;
		}

		private writeToFile(str: string): void
		{
			try
			{
				//see https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O

				// get file in the profile directory ("ProfD")
				const file = FileUtils.getFile("ProfD", ["AutoarchiveReloadedLog.txt"]);

				const foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

				// tslint:disable-next-line:no-bitwise
				foStream.init(file, 0x02 | 0x08 | 0x10, -1, 0); //-1 = default 0664, but 0664 does not work, maybe 664...

				const converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
				converter.init(foStream, "UTF-8", 0, 0);
				converter.writeString(str + "\r\n");
				converter.close(); // this closes foStream
			}
			catch (e)
			{
				Application.console.log("error writing to log file " + Logger.getExceptionInfo(e));
				//trotzdem weitermachen, ist ja nur logging...
			}
		}
	}
	*/

	//------------------------------------------------------------------------------

	//for managing the activities in activity view
	class ActivityManager
	{
		private folder: Ci.nsIMsgFolder;
		private startProcess: Ci.nsIActivityProcess;

		constructor(folder: Ci.nsIMsgFolder)
		{
			try
			{
				this.folder = folder;
				this.startProcess = undefined as unknown as Ci.nsIActivityProcess;
				/*
				//TODO: what about the whole Activity manager?
				this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

				this.startProcess.init(browser.i18n.getMessage("activityStart", this.folder.name), null);
				this.startProcess.contextType = "account"; // group this activity by account
				this.startProcess.contextObj = this.folder.server; // account in question

				const activityManager = this.getActivityManager();
				activityManager.addActivity(this.startProcess);
				*/
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		public stopAndSetFinal(actual: number): void
		{
			try
			{
				this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
				const activityManager = this.getActivityManager();
				activityManager.removeActivity(this.startProcess.id);

				let msgNumber: string;
				if (actual < 0)
				{
					msgNumber = "? (error occured)";
				}
				else
				{
					msgNumber = actual.toString();
				}

				const event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
				event.init(browser.i18n.getMessage("activityDone", this.folder.name),
					null,
					browser.i18n.getMessage("activityMessagesToArchive", msgNumber),
					this.startProcess.startTime, // start time
					Date.now(), // completion time
				);
				event.contextType = this.startProcess.contextType; // optional
				event.contextObj = this.startProcess.contextObj; // optional
				activityManager.addActivity(event);
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		private getActivityManager(): Ci.nsIActivityManager
		{
			return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
		}
	}

	//-------------------------------------------------------------------------------------

	//TODO: rename/move
	//for start of real archiving
	class SearchListener
	{
		private folder: MailFolder;
		//private activity: ActivityManager;

		constructor(folder: MailFolder /*,activity: ActivityManager*/)
		{
			this.folder = folder;
			//this.activity = activity;
		}

		public async archiveMessages(messages: MessageHeader[]): Promise<number>
		{
			try
			{
				loggerWebExtension.info("start real archiving of '" + this.folder.name + "' (" + messages.length + " messages)");

				const messageIds: number[] = [];
				for (const message of messages) {
					messageIds.push(message.id);
				}
				return await browser.autoarchive.startToArchiveMessages(messageIds);
			}
			catch (e)
			{
				//TODO: Exceptions from experiment can't be logged???
				console.log(e);
				//loggerWebExtension.errorException(e);
				return -1;
			}
		}
	}

	//-------------------------------------------------------------------------------------
	//main class
	class Autoarchiver
	{
		//properties:
		private foldersArchived: number = 0;
		private onDoneEvent: () => void;

		constructor(onDoneEvent: () => void)
		{
			this.onDoneEvent = onDoneEvent;
		}

		//archive messages for all accounts
		//(depending on the autoarchive options of the account)
		public async archiveAccounts(): Promise<void>
		{
			try
			{
				this.foldersArchived = 0;

				let countFoldersToArchive = 0;

				await AccountIterator.forEachAccount(async (account: MailAccount, isAccountArchivable: boolean) =>
				{
					loggerWebExtension.info("check account '" + account.name + "'");
					if (isAccountArchivable)
					{
						const accountSettings = settings.accountSettings[account.id];
						SettingsHelper.log(account.name, accountSettings);
						if (SettingsHelper.isArchivingSomething(accountSettings))
						{
							loggerWebExtension.info("getting folders to archive in account '" + account.name + "'");

							const foldersToArchive = this.getFoldersToArchive(account.folders);

							countFoldersToArchive += foldersToArchive.length;
							for (const folder of foldersToArchive)
							{
								await this.archiveFolder(folder, accountSettings);
							}
						}
						else
						{
							loggerWebExtension.info("autoarchive disabled, ignore account '" + account.name + "'");
						}
					}
					else
					{
						loggerWebExtension.info("ignore account '" + account.name + "'");
					}
				});

				console.log("start checkForArchiveDone");
				this.checkForArchiveDone(countFoldersToArchive);
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		//determine all folders (recursive, starting with param folder), which we want to archive
		//write output to inboxFolders array
		private getFoldersToArchive(folders: MailFolder[]): MailFolder[]
		{
			try
			{
				const foldersToArchive: MailFolder [] = [];

				for (const folder of folders)
				{
					//Do not archive some special folders (and also no subfolders in there)
					//inbox - yes
					//sent - yes, sure
					//drafts - no, because you want to send them?
					//trash - no, trash is trash
					//templates - no, because you want to use it (TODO: does this still exist?)
					//junk - no junk is junk
					//archives - no, we do archive
					//outbox - no, must be sent? (TODO: does this still exist?)

					//TODO: virtual is missing
					//TODO: https://bugzilla.mozilla.org/show_bug.cgi?id=1529791
					//virtual - no, it is virtual :)

					//undefined - yes, normal folder

					//TODO: take type of parent into account!
					let ignore: boolean = false;
					ignore = (folder.type === "trash") || (folder.type === "junk") || (folder.type === "outbox") || (folder.type === "drafts") || (folder.type === "templates") || (folder.type === "archives") || (folder.type === "virtual");
					if (!ignore)
					{
						//TODO: hack
						//TODO: maybe we should catch the exception in folder.list instead?
						if (folder.path.startsWith("/[Gmail]", 0))
						{
							console.log("ignored because virtual Gmail folder");
							ignore = true;
						}
					}
					if ( ignore)
					{
						loggerWebExtension.info("ignore folder '" + folder.path + "' (" + folder.type + ")");
					}
					else
					{
						foldersToArchive.push(folder);
					}
				}

				//TODO: still true?
				//a Feed account (RSS Feeds) will be listed here, but it is kicked out later because it does not have archive options...

				return foldersToArchive;
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		private async shallMessageBeArchived(messageHeader: MessageHeader, settings: IAccountSettings): Promise<boolean>
		{
			//TODO: früher wurden MsgStatus Ci.nsMsgMessageFlags.IMAPDeleted ausgeschlossen, braucht man das noch?

			//determine ageInDays
			let ageInDays: number = 0;
			let other: boolean = true;

			//unread
			if (!messageHeader.read)
			{
				console.log("message is unread");
				if (!settings.bArchiveUnread)
				{
					console.log("message unread, but unread messages shall not be archived");
					return false;
				}

				other = false;
				ageInDays = Math.max(ageInDays, settings.daysUnread);
			}

			//marked (starred)
			if (messageHeader.flagged)
			{
				console.log("message is flagged");
				if (!settings.bArchiveMarked)
				{
					console.log("message flagged, but flagged messages shall not be archived");
					return false;
				}

				other = false;
				ageInDays = Math.max(ageInDays, settings.daysMarked);
			}

			//tagged
			if (messageHeader.tags.length > 0)
			{
				console.log("message is tagged");
				if (!settings.bArchiveTagged)
				{
					console.log("message tagged, but tagged messages shall not be archived");
					return false;
				}

				other = false;
				ageInDays = Math.max(ageInDays, settings.daysTagged);
			}

			if (other)
			{
				console.log("message is other");
				if (!settings.bArchiveOther)
				{
					console.log("other message, but other messages shall not be archived");
					return false;
				}
				ageInDays = Math.max(ageInDays, settings.daysOther);
			}

			console.log("calculated ageInDays " + ageInDays);
			const minDate: Date = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000);
			if (messageHeader.date > minDate)
			{
				console.log("message newer than " + ageInDays);
				return false;
			}

			//TODO: How do we know, that archiving is possible at all?
			//look into the first message of a folder and give it to a webapi experiment?
			//maybe first check, what happens at all if archiving is disabled

			/*
			//check if archive is possible for this message/in this account
			//TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
			const mail3PaneWindow: Mail3Pane = Helper.getMail3Pane();
			if (mail3PaneWindow.getIdentityForHeader(dbHdr).archiveEnabled)
			{
				this.messages.push(dbHdr);
			}
			*/
			return true;
		}

		private async detectMessagesToArchive(messageList: MessageList, settings: IAccountSettings, messages: MessageHeader[]): Promise<void>
		{
			for (const message of messageList.messages)
			{
				console.log(message);
				console.log("check message " + message.id + " " + message.subject);
				if (await this.shallMessageBeArchived(message, settings))
				{
					console.log(message.id + " shall be archived");
					messages.push(message);
				}
			}
		}

		private async archiveFolder(folder: MailFolder, settings: IAccountSettings): Promise<void>
		{
			try
			{
				//TODO: log account name instead of accountId?
				loggerWebExtension.info("start searching messages to archive in folder '" + folder.path + "' (" + folder.type + ") in account '" + folder.accountId + "'");

				const messages: MessageHeader[] = [];
				let messageList: MessageList = await browser.messages.list(folder);
				console.log("messageList " + messageList + " " + messageList.messages.length);
				await this.detectMessagesToArchive(messageList, settings, messages);

				console.log("messageList.id " + messageList.id);
				while (messageList.id) {
					messageList = await browser.messages.continueList(messageList.id);
					console.log("messageList " + messageList + " " + messageList.messages.length);
					await this.detectMessagesToArchive(messageList, settings, messages);
				}

				loggerWebExtension.info("message search done for '" + folder.name + "' in account '" + folder.accountId + "' -> " + messages.length + " messages found to archive");

				//TODO: shall we still support the activity manager?
				//TODO: where shall we show the progress? Does archiving show a progress?
				const activity = new ActivityManager(undefined as unknown as Ci.nsIMsgFolder); //folder
				console.log(activity);

				const archiver = new SearchListener(folder/*, activity*/);

				let result = 0;
				if (messages.length > 0)
				{
					result = await archiver.archiveMessages(messages);
				}
				//activity.stopAndSetFinal(result);
				console.log(result);

				this.foldersArchived++;
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		private checkForArchiveDone(foldersToArchive: number): void
		{
			console.log("checkForArchiveDone");
			//wait until all accounts are ready
			if (this.foldersArchived === foldersToArchive)
			{
				//fire event
				this.onDoneEvent();
			}
			else
			{
				setTimeout(this.checkForArchiveDone.bind(this, foldersToArchive), 500);
			}
		}
	}

	//-------------------------------------------------------------------------------------

	enum States
	{
		UNINITIALZED,
		READY_FOR_WORK,
		IN_PROGRESS,
	}

	//singleton with global /startup/ui functions
	export class Global
	{
		private static status: States = States.UNINITIALZED;

		public static async startup(): Promise<void>
		{
			loggerWebExtension.info("start...");

			const appInfoLogger = new AppInfoLogger();
			await appInfoLogger.log();

			this.status = States.READY_FOR_WORK;
			loggerWebExtension.info("ready for work");

			if (settings.globalSettings.archiveType === "startup")
			{
				loggerWebExtension.info("archive type at startup");

				//wait some time to give TB time to connect and everything
				setTimeout(this.onDoArchiveAutomatic.bind(this), 9000);

				//repeat after one day (if someone has open Thunderbird all the time)
				setInterval(this.onDoArchiveAutomatic.bind(this), 86400000);
			}
			else
			{
				loggerWebExtension.info("archive type manually");
			}
		}

		public static async onDoArchiveAutomatic(): Promise<void>
		{
			loggerWebExtension.info("try automatic archive");
			if (this.status !== States.READY_FOR_WORK)
			{
				loggerWebExtension.info("automatic archive busy, wait");
				//busy: wait 5 seconds
				setTimeout(this.onDoArchiveAutomatic.bind(this), 5000);
			}
			else
			{
				await this.onDoArchive();
			}
		}

		public static async onDoArchive(): Promise<void>
		{
			loggerWebExtension.info("start archiving");
			this.status = States.IN_PROGRESS;
			const autoarchiveReloaded = new Autoarchiver(this.onArchiveDone.bind(this));
			await autoarchiveReloaded.archiveAccounts();
		}

		public static async onArchiveManually(): Promise<void>
		{
			loggerWebExtension.info("try manual archive");
			if (this.status === States.UNINITIALZED)
			{
				loggerWebExtension.info("not initialized, cancel");

				await browser.autoarchive.alert(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("waitForInit"));
				return;
			}

			if (await browser.autoarchive.confirm(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("dialogStartManualText")))
			{
				if (this.status === States.IN_PROGRESS)
				{
					loggerWebExtension.info("busy with other archive..., cancel");
					await browser.autoarchive.alert(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("waitForArchive"));
					return;
				}
				await this.onDoArchive();
			}
			else
			{
				loggerWebExtension.info("manual archive canceled by user");
			}
		}

		private static onArchiveDone(): void
		{
			loggerWebExtension.info("archive (searching messages to archive) done");
			this.status = States.READY_FOR_WORK;
		}
	}

	//-----------------------------------------------------------------------------------------------------
	export class SettingsHelper
	{
		public static isArchivingSomething(accountSettings: IAccountSettings): boolean
		{
			return (accountSettings.bArchiveOther || accountSettings.bArchiveMarked || accountSettings.bArchiveTagged || accountSettings.bArchiveUnread);
		}

		public static getMinAge(accountSettings: IAccountSettings): number
		{
			let minAge = Number.MAX_VALUE;
			if (accountSettings.bArchiveOther)
			{
				minAge = Math.min(accountSettings.daysOther, minAge);
			}
			if (accountSettings.bArchiveMarked)
			{
				minAge = Math.min(accountSettings.daysMarked, minAge);
			}
			if (accountSettings.bArchiveTagged)
			{
				minAge = Math.min(accountSettings.daysTagged, minAge);
			}
			if (accountSettings.bArchiveUnread)
			{
				minAge = Math.min(accountSettings.daysUnread, minAge);
			}

			return minAge;
		}

		public static log(accountName: string, accountSettings: IAccountSettings)
		{
			loggerWebExtension.info("Settings for '" + accountName + "':");
			loggerWebExtension.info(JSON.stringify(accountSettings));
		}
	}

	//-----------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------
	class AppInfoLogger
	{
		public async log(): Promise<void>
		{
			await this.logAppInfo();
			this.logAddonInfo();
			await this.logAccountInfo();
		}

		private async logAppInfo(): Promise<void>
		{
			try
			{
				const window: BrowserWindow = browser.extension.getBackgroundPage();
				const browserInfo: BrowserInfo = await browser.runtime.getBrowserInfo();

				loggerWebExtension.info("Application: " + browserInfo.vendor + " " + browserInfo.name + " version " + browserInfo.version + " (" + browserInfo.buildID + ")");
				loggerWebExtension.info("SystemInfo: " +  window.navigator.userAgent + "| " + window.navigator.platform);
				loggerWebExtension.info("Language: " + window.navigator.language);
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				//don't throw... this method is only info logging...
			}
		}

		private logAddonInfo(): void
		{
			//we could get infos about addons with the browser.management API, but then we would also need the "management" permission
			//seem to be a bit overdosed only for logging of the information
		}

		private async logAccountInfo(): Promise<void>
		{
			try
			{
				await AccountIterator.forEachAccount((account: MailAccount, isAccountArchivable: boolean) =>
				{
					loggerWebExtension.info("Account Info: '" + account.name + "'; type: " +
						account.type + "; id: " + account.id);
				});
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				//don't throw... this method is only info logging...
			}
		}
	}
}