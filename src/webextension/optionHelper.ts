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

class AutoarchiveReloadedWeOptionHelper
{
	public publishCurrentPreferences(onSuccess: () => void): void
	{
		this.loadCurrentSettings((settings: ISettings) =>
		{
			try
			{
				const message: IBrowserMessageSendCurrentSettings = {
					id: "sendCurrentPreferencesToLegacyAddOn",
					data: settings,
				};

				WebExtensionLoggerHelper.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);

				browser.runtime.sendMessage(message).then((reply: any) =>
				{
					try
					{
						onSuccess();
					}
					catch (e)
					{
						logger.errorException(e);
						throw e;
					}
				});
			}
			catch (e)
			{
				logger.errorException(e);
				throw e;
			}
		});
	}

	public loadCurrentSettings(onSuccesfulDone: (settings: ISettings, accounts: IAccountInfo[]) => void)
	{
		logger.info("start to load current settings");

		const message: IBrowserMessage = {
			id: "askForAccounts",
		};

		browser.runtime.sendMessage(message).then((accounts: IAccountInfo[]) =>
		{
			try
			{
				logger.info("got info about accounts");
				browser.storage.local.get("settings").then((result: any) =>
				{
					try
					{
						//settings read succesfully...
						logger.info("loaded settings from storage");
						const oHandling: AutoarchiveReloadedOptionHandling = new AutoarchiveReloadedOptionHandling();
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

						logger.info("settings mixed with default settings");
						onSuccesfulDone(settings, accounts);
					}
					catch (e)
					{
						logger.errorException(e);
						throw e;
					}
				}, (error: string) =>
					{
						logger.error("error while reading settings: " + error);
					});
			}
			catch (e)
			{
				logger.errorException(e);
				throw e;
			}

		});
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
		logger.info("start conversion of legacy preferences (if any)");

		const message: IBrowserMessage = {
			id: "askForLegacyPreferences",
		};

		browser.runtime.sendMessage(message).then((settings: ISettings): void =>
		{
			try
			{
				if (settings)
				{
					logger.info("got legacy preferences to convert");
					this.savePreferencesAndSendToLegacyAddOn(settings, (): void =>
					{
						this.OnWebExtensionStartupDone();
					});
				}
				else
				{
					logger.info("no legacy preferences to convert");
					this.publishCurrentPreferences((): void =>
					{
						this.OnWebExtensionStartupDone();
					});
				}
			}
			catch (e)
			{
				logger.errorException(e);
				throw e;
			}

		});
	}

	public savePreferencesAndSendToLegacyAddOn(settings: ISettings, onSuccess: () => void): void
	{
		logger.info("going to save settings");

		//TODO: sometimes we get "Error: WebExtension context not found!", why?
		browser.storage.local.set({ settings: settings }).then(() =>
		{
			try
			{
				logger.info("settings saved");
				this.publishCurrentPreferences(onSuccess);
			}
			catch (e)
			{
				logger.errorException(e);
				throw e;
			}
		}, (error: string) =>
			{
				logger.error("error while saving settings: " + error);
			});
	}

	private OnWebExtensionStartupDone(): void
	{
		const message: IBrowserMessage = {
			id: "webExtensionStartupDone",
		};
		browser.runtime.sendMessage(message);
	}
}