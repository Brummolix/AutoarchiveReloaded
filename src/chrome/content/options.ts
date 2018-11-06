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

// tslint:disable-next-line:no-var-keyword
var EXPORTED_SYMBOLS = ["AutoarchiveReloadedBootstrap"];

namespace AutoarchiveReloadedBootstrap
{
	Cu.import("chrome://autoarchiveReloaded/content/overlay.js");
	Cu.import("resource:///modules/MailServices.jsm");
	Cu.import("resource:///modules/iteratorUtils.jsm");

	export class LegacyOptions
	{
		// returns null if already migrated or no settings!
		public getLegacyOptions(): ISettings | null
		{
			const prefBranch = this.getInternalLegacyPrefBranch();

			if (prefBranch.getBoolPref("preferencesAlreadyMigrated", false))
			{
				return null;
			}

			const accountSettings: IAccountSettingsArray = this.getLegacyAccountSettings();

			//no account and no global settings?
			const aChildArray: string[] = prefBranch.getChildList("", {});
			if ((aChildArray.length === 0) && Object.keys(accountSettings).length === 0)
			{
				return null;
			}

			//TODO: wieso kommt in meinem Profil als "archiveType" null raus? Das hätte doch ein Wert sein müssen
			//nochmal mit frisch konvertiertem Profil testen!

			const legacySettings: ISettings = {
				globalSettings: {
					archiveType: prefBranch.getCharPref("archiveType", undefined) as ArchiveType,
					enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging", undefined),
				},
				accountSettings: accountSettings,
			};

			return legacySettings;
		}

		public markLegacySettingsAsMigrated(): void
		{
			this.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
		}

		private getLegacyAccountSettings(): IAccountSettingsArray
		{
			const accountSettings: IAccountSettingsArray = {};

			AutoarchiveReloadedBootstrap.AccountIterator.forEachAccount((account: Ci.nsIMsgAccount, isAccountArchivable: boolean) =>
			{
				if (!isAccountArchivable)
				{
					return;
				}

				const server: Ci.nsIMsgIncomingServer = account.incomingServer;
				const settingOfAccount: IAccountSettings = {
					bArchiveOther: server.getBoolValue("archiveMessages"),
					daysOther: server.getIntValue("archiveMessagesDays"),
					bArchiveMarked: server.getBoolValue("archiveStarred"),
					daysMarked: server.getIntValue("archiveStarredDays"),
					bArchiveTagged: server.getBoolValue("archiveTagged"),
					daysTagged: server.getIntValue("archiveTaggedDays"),
					bArchiveUnread: server.getBoolValue("archiveUnread"),
					daysUnread: server.getIntValue("archiveUnreadDays"),
				};

				//if nothing is archived (which was the default) we assume that the AddOn was not installed or at least not used
				//therefore we ignore the settings then and the defaults will be used later on
				if (AutoarchiveReloadedBootstrap.SettingsHelper.isArchivingSomething(settingOfAccount))
				{
					accountSettings[account.key] = settingOfAccount;
				}
			});

			return accountSettings;
		}

		private getInternalLegacyPrefBranch(): Ci.nsIPrefBranch
		{
			const prefs: Ci.nsIPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
			return prefs.getBranch("extensions.AutoarchiveReloaded.");
		}
	}

	//TODO: why is this inside options.ts? Rename file? Or put everything into overlay.js again?
	export class AccountIterator
	{
		public static forEachAccount(forEachDo: (account: Ci.nsIMsgAccount, isAccountArchivable: boolean) => void): void
		{
			const accounts: Ci.nsIMsgAccount[] = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
			for (const account of accounts)
			{
				forEachDo(account, this.isAccountArchivable(account));
			}
		}

		private static isAccountArchivable(account: Ci.nsIMsgAccount): boolean
		{
			//ignore IRC accounts
			return (account.incomingServer.localStoreType === "mailbox" || account.incomingServer.localStoreType === "imap" || account.incomingServer.localStoreType === "news");
		}
	}

	export let settings: ISettings;
}