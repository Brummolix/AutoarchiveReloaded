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
			const message: IBrowserMessageSendCurrentSettings = {
				id: "sendCurrentPreferencesToLegacyAddOn",
				data: settings,
			};

			WebExtensionLoggerHelper.setGlobaleEnableInfoLogging(settings.globalSettings.enableInfoLogging);

			browser.runtime.sendMessage(message).then((reply: any) =>
			{
				onSuccess();
			});
		});
	}

	public loadCurrentSettings(onSuccesfulDone: (settings: ISettings, accounts: IAccountInfo[]) => void)
	{
		console.log("loadCurrentSettings");

		const message: IBrowserMessage = {
			id: "askForAccounts",
		};

		browser.runtime.sendMessage(message).then((accounts: IAccountInfo[]) =>
		{
			browser.storage.local.get("settings").then((result: any) =>
			{

				//settings read succesfully...
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

				onSuccesfulDone(settings, accounts);
			}, (error: string) =>
			{
				//error while reading settings
				//TODO: error? log
				console.log(`Error: ${error}`);
			});
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
		const message: IBrowserMessage = {
			id: "askForLegacyPreferences",
		};

		browser.runtime.sendMessage(message).then((settings: ISettings): void =>
		{
			if (settings)
			{
				this.savePreferencesAndSendToLegacyAddOn(settings, (): void =>
				{
					this.OnWebExtensionStartupDone();
				});
			}
			else
			{
				this.publishCurrentPreferences((): void =>
				{
					this.OnWebExtensionStartupDone();
				});
			}
		});
	}

	public savePreferencesAndSendToLegacyAddOn(settings: ISettings, onSuccess: () => void): void
	{
		//TODO: sometimes we get "Error: WebExtension context not found!"
		//why?
		browser.storage.local.set({ settings: settings }).then(() =>
		{
			//settings written sucesfully
			this.publishCurrentPreferences(onSuccess);
		}, (error: string) =>
		{
			//error while writing settings
			//TODO: error? log
			console.log(`Error: ${error}`);
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