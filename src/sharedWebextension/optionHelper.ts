/*!
Copyright 2018-2020 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

import { AccountInfo, Settings } from "../sharedAll/interfaces";
import { AccountInfoProvider } from "./AccountInfo";
import { DefaultSettings } from "./DefaultSettings";
import { log, LogLevelInfoWebExtension } from "./Logger";

export class OptionHelper
{
	public async loadCurrentSettings(): Promise<Settings>
	{
		log.info("start to load current settings");

		const accounts: AccountInfo[] = await AccountInfoProvider.askForAccounts();

		try
		{
			log.info("got info about accounts");
			const result: any = await browser.storage.local.get("settings");
			//settings read succesfully...
			log.info("loaded settings from storage");
			const oHandling: DefaultSettings = new DefaultSettings();
			const settings: Settings = oHandling.convertPartialSettings(result.settings);

			this.ensureEveryExistingAccountHaveSettings(accounts, settings, oHandling);
			this.removeOutdatedAccountsFromSettings(settings, accounts);

			log.info("settings mixed with default settings");
			return settings;
		}
		catch (e)
		{
			//TODO: do not log and throw!
			log.errorException(e);
			throw e;
		}
	}


	private removeOutdatedAccountsFromSettings(settings: Settings, accounts: AccountInfo[]): void
	{
		for (const accountId in settings.accountSettings)
		{
			if (AccountInfoProvider.findAccountInfo(accounts, accountId) === null)
			{
				delete settings.accountSettings[accountId];
			}
		}
	}

	private ensureEveryExistingAccountHaveSettings(accounts: AccountInfo[], settings: Settings, oHandling: DefaultSettings): void
	{
		accounts.forEach(account =>
		{
			const accountSetting = settings.accountSettings[account.accountId];
			if (accountSetting === undefined)
			{
				settings.accountSettings[account.accountId] = oHandling.getDefaultAccountSettings();
			}
		});
	}

	public async initializePreferencesAtStartup(): Promise<void>
	{
		log.info("start conversion of legacy preferences (if any)");

		const accounts: AccountInfo[] = await AccountInfoProvider.askForAccounts();

		const settings: Settings | null = browser.autoarchive.askForLegacyPreferences(accounts);
		try
		{
			if (settings)
			{
				log.info("got legacy preferences to convert");
				await this.savePreferencesAndPublishForLogging(settings);
				log.info("legacy preferences converted");
			}
			else
			{
				log.info("no legacy preferences to convert");
				await this.publishCurrentPreferencesForLogging();
				log.info("publishCurrentPreferencesForLogging done");
			}
		}
		catch (e)
		{
			log.errorException(e);
			throw e;
		}
	}

	public async savePreferencesAndPublishForLogging(settings: Settings): Promise<void>
	{
		log.info("going to save settings");

		try
		{
			//TODO: sometimes we get "Error: WebExtension context not found!", why?
			await browser.storage.local.set({ settings: settings });
			log.info("settings saved");
			await this.publishCurrentPreferencesForLogging();
		}
		catch (e)
		{
			log.errorException(e);
			throw e;
		}
	}

	private async publishCurrentPreferencesForLogging(): Promise<void>
	{
		const settings = await this.loadCurrentSettings();
		log.info("loadCurrentSettings done, publish for logging");
		try
		{
			LogLevelInfoWebExtension.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);
		}
		catch (e)
		{
			//TODO: do not log and throw?
			log.errorException(e);
			throw e;
		}
	}
}