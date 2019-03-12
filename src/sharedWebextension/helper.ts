/*!
Copyright 2018 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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
AutoarchiveReloaded.loggerWebExtension.info("Hello world helper.ts");

namespace AutoarchiveReloaded
{
	export class AccountIterator
	{
		public static async forEachAccount(forEachDo: (account: MailAccount, isAccountArchivable: boolean) => void): Promise<void>
		{
			const accounts: MailAccount[] = await browser.accounts.list();
			for (const account of accounts)
			{
				await forEachDo(account, this.isAccountArchivable(account));
			}
		}

		private static isAccountArchivable(account: MailAccount): boolean
		{
			//TODO: are the types still the same? Is there still an exquilla type?

			//ignore IRC accounts
			return (account.type === "mailbox" || account.type === "imap" || account.type === "news" || account.type === "exquilla");
			//return (account.incomingServer.localStoreType === "mailbox" || account.incomingServer.localStoreType === "imap" || account.incomingServer.localStoreType === "news" || account.incomingServer.localStoreType === "exquilla");
		}
  }

	export class AccountInfo
  {
		public static isMailType(account: MailAccount): boolean
		{
			//TODO: are the types still the same? Is there still an exquilla type?
			return (account.type === "pop3" || account.type === "imap" || account.type === "exquilla");
			//return (account.incomingServer.type === "pop3" || account.incomingServer.type === "imap" || account.incomingServer.type === "exquilla");
		}
  }

	export let settings: ISettings;
}