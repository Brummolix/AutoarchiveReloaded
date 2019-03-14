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
namespace AutoarchiveReloaded
{
	//todo: rename to Archiver
	export class Autoarchiver
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

				let result = 0;
				if (messages.length > 0)
				{
					loggerWebExtension.info("start real archiving of '" + folder.name + "' (" + messages.length + " messages)");
					result = await this.archiveMessages(messages);
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

		private async archiveMessages(messages: MessageHeader[]): Promise<number>
		{
			try
			{
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
}