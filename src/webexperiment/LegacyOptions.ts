/*!
Copyright 2013-2020 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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

import { ArchiveType, AccountInfo, AccountSettings, AccountSettingsArray, Settings } from "../sharedAll/interfaces";

const iteratorUtils: IteratorUtils = Components.utils.import("resource:///modules/iteratorUtils.jsm");
const mailservices: MailServicesExport = Components.utils.import("resource:///modules/MailServices.jsm");

export class LegacyOptions
{
	public askForLegacyPreferences(accounts: AccountInfo[]): Settings | null
	{
		const legacySettings = this.getLegacyOptions(accounts);
		this.markLegacySettingsAsMigrated();
		return legacySettings;
	}

	// returns null if already migrated or no settings!
	private getLegacyOptions(accounts: AccountInfo[]): Settings | null
	{
		const prefBranch = this.getInternalLegacyPrefBranch();

		if (prefBranch.getBoolPref("preferencesAlreadyMigrated", false))
		{
			return null;
		}

		const accountSettings: AccountSettingsArray = this.getLegacyAccountSettings(accounts);

		//no account and no global settings?
		const aChildArray: string[] = prefBranch.getChildList("", {});
		if ((aChildArray.length === 0) && Object.keys(accountSettings).length === 0)
		{
			return null;
		}

		//in an old profile the default values were not stored and we get undefined instead
		//nevertheless we read everything with default value undefined now and the deepMerge later on will merge it with current default values
		const legacySettings: Settings = {
			globalSettings: {
				archiveType: prefBranch.getCharPref("archiveType", undefined) as ArchiveType,
				enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging", undefined),
			},
			accountSettings: accountSettings,
		};

		return legacySettings;
	}

	private markLegacySettingsAsMigrated(): void
	{
		this.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
	}

	private getLegacyAccountSettings(accountInfos: AccountInfo[]): AccountSettingsArray
	{
		const accountSettings: AccountSettingsArray = {};

		for (const accountInfo of accountInfos)
		{
			const accounts: Ci.nsIMsgAccount[] = iteratorUtils.fixIterator(mailservices.MailServices.accounts.accounts, Ci.nsIMsgAccount);
			let account;
			for (const currentAccount of accounts)
			{
				if (currentAccount.key === accountInfo.accountId)
				{
					account = currentAccount;
					break;
				}
			}

			if (account == null)
			{
				continue;
			}

			const server: Ci.nsIMsgIncomingServer = account.incomingServer;
			const settingOfAccount: AccountSettings = {
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
			if (settingOfAccount.bArchiveOther || settingOfAccount.bArchiveMarked || settingOfAccount.bArchiveTagged || settingOfAccount.bArchiveUnread)
			{
				accountSettings[account.key] = settingOfAccount;
			}
		}

		return accountSettings;
	}

	private getInternalLegacyPrefBranch(): Ci.nsIPrefBranch
	{
		const prefs: Ci.nsIPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return prefs.getBranch("extensions.AutoarchiveReloaded.");
	}
}