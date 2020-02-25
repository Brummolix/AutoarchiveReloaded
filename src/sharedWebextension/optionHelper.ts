/*!
Copyright 2018-2019 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

import { IAccountInfo, ISettings } from "../sharedAll/interfaces";
import { AccountInfo } from "./AccountInfo";
import { DefaultSettings } from "./DefaultSettings";
import { log, LogLevelInfo } from "./Logger";

export class OptionHelper
{
	public async loadCurrentSettings(): Promise<ISettings>
	{
		log.info("start to load current settings");

		const accounts: IAccountInfo[] = await AccountInfo.askForAccounts();

		try
		{
			log.info("got info about accounts");
			const result: any = await browser.storage.local.get("settings");
			//settings read succesfully...
			log.info("loaded settings from storage");
			const oHandling: DefaultSettings = new DefaultSettings();
			const settings: ISettings = oHandling.convertPartialSettings(result.settings);

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


	private removeOutdatedAccountsFromSettings(settings: ISettings, accounts: IAccountInfo[]): void
	{
		for (const accountId in settings.accountSettings)
		{
			if (AccountInfo.findAccountInfo(accounts, accountId) === null)
			{
				delete settings.accountSettings[accountId];
			}
		}
	}

	private ensureEveryExistingAccountHaveSettings(accounts: IAccountInfo[], settings: ISettings, oHandling: DefaultSettings): void
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

		const accounts: IAccountInfo[] = await AccountInfo.askForAccounts();

		const settings: ISettings | null = browser.autoarchive.askForLegacyPreferences(accounts);
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

	public async savePreferencesAndPublishForLogging(settings: ISettings): Promise<void>
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
			LogLevelInfo.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);
		}
		catch (e)
		{
			//TODO: do not log and throw?
			log.errorException(e);
			throw e;
		}
	}
}