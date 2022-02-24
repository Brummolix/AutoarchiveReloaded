/*!
Copyright 2013-2022 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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

import { AccountSettings, Settings } from "../sharedWebextension/interfaces";
import { AccountIterator } from "../sharedWebextension/AccountIterator";
import { log } from "../sharedWebextension/LoggerWebextension";
import { OptionHelper } from "../sharedWebextension/optionHelper";
import { SettingsHelper } from "./SettingsHelper";
import { FolderHelper } from "./FolderHelper";

export class Archiver {
	//archive messages for all accounts
	//(depending on the autoarchive options of the account)
	public async archiveAccounts(): Promise<void> {
		try {
			const optionHelper: OptionHelper = new OptionHelper();
			const settings: Settings = await optionHelper.loadCurrentSettings();

			await AccountIterator.forEachAccount(async (account: MailAccount, isAccountArchivable: boolean): Promise<void> => {
				await this.archiveAccount(account, isAccountArchivable, settings);
			});
		} catch (e) {
			log.errorException(e);
			throw e;
		}
	}

	private async archiveAccount(account: MailAccount, isAccountArchivable: boolean, settings: Settings): Promise<void> {
		log.info("check account '" + account.name + "'");
		if (isAccountArchivable) {
			const accountSettings = settings.accountSettings[account.id];
			SettingsHelper.log(account.name, accountSettings);
			if (SettingsHelper.isArchivingSomething(accountSettings)) {
				log.info("getting folders to archive in account '" + account.name + "'");
				const foldersToArchive = this.getFoldersToArchive(FolderHelper.getFoldersRecursivly(account.folders));
				for (const folder of foldersToArchive) {
					await this.archiveFolder(folder, accountSettings);
				}
			} else {
				log.info("autoarchive disabled, ignore account '" + account.name + "'");
			}
		} else {
			log.info("ignore account '" + account.name + "'");
		}
	}

	//note: virtual folders (like Gmail has) are reported to archive but a later call to folder.list will fail...
	private getFoldersToArchive(folders: MailFolder[]): MailFolder[] {
		try {
			const foldersToArchive: MailFolder[] = [];

			for (const folder of folders) {
				const folderName = folder.name || "";
				const folderType = folder.type || "";
				log.info(`Check folder ${folderName} (${folderType})`);
				if (this.folderShallBeIgnored(folder, folders)) {
					log.info(`ignore folder '${folder.path}' (${folderType})`);
				} else {
					foldersToArchive.push(folder);
				}
			}

			return foldersToArchive;
		} catch (e) {
			log.errorException(e);
			throw e;
		}
	}

	private folderShallBeIgnored(folder: MailFolder, allFoldersOfAccount: MailFolder[]): boolean {
		if (this.folderTypeShallBeIgnored(folder.type)) {
			return true;
		}

		const parent: MailFolder | undefined = this.getFolderParent(folder, allFoldersOfAccount);
		if (parent === undefined) {
			return false;
		}

		return this.folderShallBeIgnored(parent, allFoldersOfAccount);
	}

	private folderTypeShallBeIgnored(folderType?: FolderType): boolean {
		//Do not archive some special folders (and also no subfolders in there)
		//inbox - yes
		//sent - yes, sure
		//drafts - no, because you want to send them?
		//trash - no, trash is trash
		//templates - no, because you want to use it
		//junk - no junk is junk
		//archives - no, we do archive
		//outbox - no, must be sent? (TODO: does this still exist?)

		//TODO: virtual is missing, wait for https://bugzilla.mozilla.org/show_bug.cgi?id=1529791
		//if this bug is solved, we may also remove the strange catch in archiveFolder
		//virtual - no, it is virtual :)

		//undefined - yes, normal folder
		return (
			folderType === "trash" ||
			folderType === "junk" ||
			folderType === "outbox" ||
			folderType === "drafts" ||
			folderType === "templates" ||
			folderType === "archives"
		);
	}

	private getFolderParent(folder: MailFolder, allFoldersOfAccount: MailFolder[]): MailFolder | undefined {
		const nIndex = folder.path.lastIndexOf("/");
		if (nIndex === undefined) {
			return undefined;
		}
		const parentPath = folder.path.substring(0, nIndex);

		for (const currentFolder of allFoldersOfAccount) {
			if (currentFolder.path === parentPath) {
				return currentFolder;
			}
		}

		return undefined;
	}

	private async archiveFolder(folder: MailFolder, settings: AccountSettings): Promise<void> {
		try {
			const mailAccount: MailAccount = await browser.accounts.get(folder.accountId);
			const folderTye = folder.type || "";
			log.info(`start searching messages to archive in folder '${folder.path}' (${folderTye}) in account '${mailAccount.name}'`);
			const messages: MessageHeader[] = await this.searchMessagesToArchive(folder, settings);
			const folderName = folder.name || "";
			log.info(`message search done for '${folderName}' in account '${mailAccount.name}' -> ${messages.length} messages found to archive`);

			if (messages.length > 0) {
				log.info(`start real archiving of '${folderName}' (${messages.length} messages) in account '${mailAccount.name}'`);
				await this.archiveMessages(messages);
			}
		} catch (e) {
			log.errorException(e);
			throw e;
		}
	}

	private async searchMessagesToArchive(folder: MailFolder, settings: AccountSettings): Promise<MessageHeader[]> {
		const messages: MessageHeader[] = [];

		let messageList: MessageList;
		try {
			messageList = await browser.messages.list(folder);
		} catch (e) {
			//as virtual folders crash here, we only log the failure and treat the folder as "archived"...
			log.errorException(e, "The exception might occur because the folder is a virtual folder... See https://bugzilla.mozilla.org/show_bug.cgi?id=1529791");
			return messages;
		}
		this.detectMessagesToArchive(messageList, settings, messages);

		while (messageList.id) {
			messageList = await browser.messages.continueList(messageList.id);
			this.detectMessagesToArchive(messageList, settings, messages);
		}

		return messages;
	}

	private detectMessagesToArchive(messageList: MessageList, settings: AccountSettings, messages: MessageHeader[]): void {
		for (const message of messageList.messages) {
			if (this.shallMessageBeArchived(message, settings)) {
				messages.push(message);
			}
		}
	}

	private shallMessageBeArchived(messageHeader: MessageHeader, settings: AccountSettings): boolean {
		//determine ageInDays
		let ageInDays: number = 0;
		let other: boolean = true;

		//unread
		if (!messageHeader.read) {
			if (!settings.bArchiveUnread) {
				//message unread, but unread messages shall not be archived
				return false;
			}

			other = false;
			ageInDays = Math.max(ageInDays, settings.daysUnread);
		}

		//marked (starred)
		if (messageHeader.flagged) {
			if (!settings.bArchiveMarked) {
				//message flagged, but flagged messages shall not be archived
				return false;
			}

			other = false;
			ageInDays = Math.max(ageInDays, settings.daysMarked);
		}

		//tagged

		//GMail uses the tag "junk" to mark junk mails, but they shall not be classified as normal "tags"
		const tags = messageHeader.tags.filter((tag) => tag !== "junk" && tag !== "nonjunk");

		if (tags.length > 0) {
			if (!settings.bArchiveTagged) {
				//message tagged, but tagged messages shall not be archived
				return false;
			}

			other = false;
			ageInDays = Math.max(ageInDays, settings.daysTagged);
		}

		if (other) {
			if (!settings.bArchiveOther) {
				//other message, but other messages shall not be archived
				return false;
			}
			ageInDays = Math.max(ageInDays, settings.daysOther);
		}

		const minDate: Date = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000);
		if (messageHeader.date > minDate) {
			return false;
		}

		//TODO: How do we know, that archiving is possible at all?
		//look into the first message of a folder and give it to a webapi experiment?
		//(right now simply nothing happens when you archive in such an account)

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

	private async archiveMessages(messages: MessageHeader[]): Promise<void> {
		try {
			const messageIds: number[] = [];
			for (const message of messages) {
				messageIds.push(message.id);
			}

			await browser.messages.archive(messageIds);
		} catch (e) {
			log.errorException(e);
		}
	}
}
