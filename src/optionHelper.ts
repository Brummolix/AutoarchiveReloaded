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
var EXPORTED_SYMBOLS = ["AutoarchiveReloadedWeOptionHelper"];

namespace AutoarchiveReloadedWebextension
{
	export class OptionHelper
	{
		public publishCurrentPreferences(onSuccess: () => void): void
		{
			this.loadCurrentSettings((settings: ISettings) =>
			{
				loggerWebExtension.info("loadCurrentSettings done");
				try
				{
					AutoarchiveReloadedWebextension.LoggerHelper.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);

					setCurrentPreferences(settings);
					onSuccess();
				}
				catch (e)
				{
					loggerWebExtension.errorException(e);
					throw e;
				}
			});
		}

		public async loadCurrentSettings(onSuccesfulDone: (settings: ISettings, accounts: IAccountInfo[]) => void)
		{
			loggerWebExtension.info("start to load current settings");

			const accounts: IAccountInfo[] = await askForAccounts();

			try
			{
				loggerWebExtension.info("got info about accounts");
				browser.storage.local.get("settings").then((result: any) =>
				{
					try
					{
						//settings read succesfully...
						loggerWebExtension.info("loaded settings from storage");
						const oHandling: AutoarchiveReloadedShared.OptionHandling = new AutoarchiveReloadedShared.OptionHandling();
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

						loggerWebExtension.info("settings mixed with default settings");
						onSuccesfulDone(settings, accounts);
					}
					catch (e)
					{
						loggerWebExtension.errorException(e);
						throw e;
					}
				}, (error: string) =>
					{
						loggerWebExtension.error("error while reading settings: " + error);
					});
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
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

		public convertLegacyPreferences(): void
		{
			loggerWebExtension.info("start conversion of legacy preferences (if any)");

			//TODO: can we still convert legacy preference or do we have to skip it?
			const settings: ISettings | null = replyToAskForLegacyPreferences();
			try
			{
				if (settings)
				{
					loggerWebExtension.info("got legacy preferences to convert");
					this.savePreferencesAndSendToLegacyAddOn(settings, (): void =>
					{
						initAutoArchiveReloadedOverlay();
					});
				}
				else
				{
					loggerWebExtension.info("no legacy preferences to convert");
					this.publishCurrentPreferences((): void =>
					{
						loggerWebExtension.info("publishCurrentPreferences done");
						initAutoArchiveReloadedOverlay();
					});
				}
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		public savePreferencesAndSendToLegacyAddOn(settings: ISettings, onSuccess: () => void): void
		{
			loggerWebExtension.info("going to save settings");

			//TODO: sometimes we get "Error: WebExtension context not found!", why?
			browser.storage.local.set({ settings: settings }).then(() =>
			{
				try
				{
					loggerWebExtension.info("settings saved");
					this.publishCurrentPreferences(onSuccess);
				}
				catch (e)
				{
					loggerWebExtension.errorException(e);
					throw e;
				}
			}, (error: string) =>
				{
					loggerWebExtension.error("error while saving settings: " + error);
				});
		}
	}
}