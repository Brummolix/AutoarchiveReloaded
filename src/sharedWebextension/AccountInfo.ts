/*!
Copyright 2013-2019 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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
/// <reference path="../sharedAll/thunderbird.d.ts" />

namespace AutoarchiveReloaded
{
	export class AccountInfo
  {
		public static isMailType(account: MailAccount): boolean
		{
			//TODO: Is there still an exquilla type?
			return (account.type === "pop3" || account.type === "imap" || account.type === "exquilla");
		}

		public static findAccountInfo(accountSettings: IAccountInfo[], id: string): IAccountInfo | null
		{
			for (const accountSetting of accountSettings)
			{
				if (accountSetting.accountId === id)
				{
					return accountSetting;
				}
			}

			return null;
		}

		public static async askForAccounts(): Promise<IAccountInfo[]>
		{
			try
			{
				const nsAccounts: MailAccount[] = [];
				await AccountIterator.forEachAccount((account: MailAccount, isAccountArchivable: boolean) =>
				{
					if (isAccountArchivable)
					{
						nsAccounts.push(account);
					}
				});

				nsAccounts.sort((a: MailAccount, b: MailAccount) =>
				{
					const mailTypeA: boolean = AccountInfo.isMailType(a);
					const mailTypeB: boolean = AccountInfo.isMailType(b);

					if (mailTypeA === mailTypeB)
					{
						return a.name.localeCompare(b.name);
					}

					if (mailTypeA)
					{
						return -1;
					}

					return 1;
				});

				const accounts: IAccountInfo[] = [];
				let currentOrder = 0;
				nsAccounts.forEach((account) =>
				{
					accounts.push({
						accountId: account.id,
						accountName: account.name,
						order: currentOrder++,
					});
				});

				return accounts;
			}
			catch (e)
			{
				log.errorException(e);
				throw e;
			}
		}
  }
}