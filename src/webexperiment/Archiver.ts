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
class Archiver
{
	public startToArchiveMessages(messageIds: number[]): number
	{
		log.info("startToArchiveMessages");

		const mail3PaneWindow: Mail3Pane = ClassicTBHelper.getMail3Pane();
		console.log(mail3PaneWindow);

		//TODO: how to translate a webapi message into nsIMsgDBHdr (or the folders?)
		//see https://groups.google.com/forum/#!topic/mozilla.dev.apps.thunderbird/zI_3yBYLiCM
		//see https://bugzilla.mozilla.org/show_bug.cgi?id=1530606

		//TODO: or do we have to do *everything* in web experiment :(
		/*
		for (const messageId of messageIds) {
			const msgHdr: any = messageTracker.getMessage(messageId);
			console.log(msgHdr);
		}
		*/

		//https://hg.mozilla.org/comm-central/file/tip/mail/components/extensions/parent/ext-messages.js
		//messageTracker ist in https://hg.mozilla.org/comm-central/file/tip/mail/components/extensions/parent/ext-mail.js
		//TODO: wie kommt man da ran?

		/*
		//TB jumps to the end (after finishing the archiving) if no message is selected
		//> select the first message (unfortunately it will become unread...)
		//(but only select the first message if the messages being archived are from the current folder)
		if (messages.length > 0)
		{
			if (messages[0].folder === mail3PaneWindow.gFolderDisplay.displayedFolder)
			{
				if (mail3PaneWindow.gFolderDisplay.selectedCount <= 0)
				{
					mail3PaneWindow.gFolderDisplay.navigate(Components.interfaces.nsMsgNavigationType.firstMessage);
				}
			}
		}

		const batchMover: Ci.BatchMessageMover = new mail3PaneWindow.BatchMessageMover();

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
					this.info("mail3PaneWindow.gFolderDisplay.dbView is null > batchMessageMover will not work");
					const folderToSelect = this.folder;
					if (folderToSelect)
					{
						this.info("> try to select folder " + folderToSelect.name + " " + folderToSelect.URI);
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

		batchMover.archiveMessages(messages);
		*/

		return messageIds.length;
	}
}