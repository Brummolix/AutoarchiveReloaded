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
namespace AutoarchiveReloaded
{
	export class OptionHelper
	{
		//TODO: private?
		public async publishCurrentPreferences(): Promise<void>
		{
			const settings = await this.loadCurrentSettings();
			log.info("loadCurrentSettings done");
			try
			{
				Logger.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);

				log.info("setCurrentPreferences");
			}
			catch (e)
			{
				//TODO: do not log and throw?
				log.errorException(e);
				throw e;
			}
		}

		public async loadCurrentSettings(): Promise<ISettings>
		{
			log.info("start to load current settings");

			const accounts: IAccountInfo[] = await this.askForAccounts();

			try
			{
				log.info("got info about accounts");
				const result: any = await browser.storage.local.get("settings");
				//settings read succesfully...
				log.info("loaded settings from storage");
				const oHandling: OptionHandling = new OptionHandling();
				const settings: ISettings = oHandling.convertPartialSettings(result.settings);

				//every existing account should have a setting
				accounts.forEach((account) =>
				{
					const accountSetting = settings.accountSettings[account.accountId];
					if (accountSetting === undefined)
					{
						settings.accountSettings[account.accountId] = oHandling.getDefaultAccountSettings();
					}
				});

				//no other account should be there
				for (const accountId in settings.accountSettings)
				{
					if (this.findAccountInfo(accounts, accountId) === null)
					{
						delete settings.accountSettings[accountId];
					}
				}

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

		public findAccountInfo(accountSettings: IAccountInfo[], id: string): IAccountInfo | null
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

		//TODO: rename initializePreferences?
		public async convertLegacyPreferences(): Promise<void>
		{
			log.info("start conversion of legacy preferences (if any)");

			const accounts: IAccountInfo[] = await this.askForAccounts();

			const settings: ISettings | null = await browser.autoarchive.askForLegacyPreferences(accounts);
			try
			{
				if (settings)
				{
					log.info("got legacy preferences to convert");
					await this.savePreferencesAndSendToLegacyAddOn(settings);
					log.info("legacy preferences converted");
				}
				else
				{
					log.info("no legacy preferences to convert");
					await this.publishCurrentPreferences();
					log.info("publishCurrentPreferences done");
				}
			}
			catch (e)
			{
				log.errorException(e);
				throw e;
			}
		}

		//TODO: rename savePreferencesAndPublishCurrentPreferences
		public async savePreferencesAndSendToLegacyAddOn(settings: ISettings): Promise<void>
		{
			log.info("going to save settings");

			try
			{
				//TODO: sometimes we get "Error: WebExtension context not found!", why?
				await browser.storage.local.set({ settings: settings });
				log.info("settings saved");
				await this.publishCurrentPreferences();
			}
			catch (e)
			{
				log.errorException(e);
				throw e;
			}
		}

		public async askForAccounts(): Promise<IAccountInfo[]>
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