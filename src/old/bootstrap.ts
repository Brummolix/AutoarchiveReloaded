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
AutoarchiveReloadedWebextension.loggerWebExtension.info("Hello world bootstrap.ts");

//https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Bootstrapped_extensions#Reason_constants
enum BootstrapReasons
{
	APP_STARTUP = 1, 		//The application is starting up.
	APP_SHUTDOWN = 2, 		//The application is shutting down.
	ADDON_ENABLE = 3, 		//The add-on is being enabled.
	ADDON_DISABLE = 4, 		//The add-on is being disabled. (Also sent during uninstallation)
	ADDON_INSTALL = 5,		//The add-on is being installed.
	ADDON_UNINSTALL = 6,	//The add-on is being uninstalled.
	ADDON_UPGRADE = 7,		//The add-on is being upgraded.
	ADDON_DOWNGRADE = 8,	//The add-on is being downgraded.
}

async function replyToArchiveManually(): Promise<void>
{
	if (bIsInToolbarCustomize)
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.info("archive manually rejected because of toolbar customization");
		return;
	}

	await AutoarchiveReloadedBootstrap.Global.onArchiveManually();
}

//we get the current preferences at start and on every change of preferences
function setCurrentPreferences(settings: ISettings): void
{
	AutoarchiveReloadedWebextension.loggerWebExtension.info("setCurrentPreferences");
	try
	{
		AutoarchiveReloadedBootstrap.settings = settings;
	}
	catch (e)
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
		throw e;
	}
}

function replyToAskForLegacyPreferences(): ISettings | null
{
	try
	{
		const legacyOptions: AutoarchiveReloadedBootstrap.LegacyOptions = new AutoarchiveReloadedBootstrap.LegacyOptions();
		const legacySettings = legacyOptions.getLegacyOptions();
		legacyOptions.markLegacySettingsAsMigrated();
		return legacySettings;
	}
	catch (e)
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
		throw e;
	}
}

async function askForAccounts(): Promise<IAccountInfo[]>
{
	try
	{
		const nsAccounts: MailAccount[] = [];
		await AutoarchiveReloadedBootstrap.AccountIterator.forEachAccount((account: MailAccount, isAccountArchivable: boolean) =>
		{
			if (isAccountArchivable)
			{
				nsAccounts.push(account);
			}
		});

		nsAccounts.sort((a: MailAccount, b: MailAccount) =>
		{
			const mailTypeA: boolean = AutoarchiveReloadedBootstrap.AccountInfo.isMailType(a);
			const mailTypeB: boolean = AutoarchiveReloadedBootstrap.AccountInfo.isMailType(b);

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
		AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
		throw e;
	}
}

function initAutoArchiveReloadedOverlay(): void
{
	try
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.info("initAutoArchiveReloadedOverlay");

		//directly after start of TB the adding of the menu does not work (getting the elemtens of "taskPopup" and "tabmail" returns null)
		//therefore we have to wait a bit
		setTimeout(() =>
		{
			//TODO: Menus and toolbarCustomizationListener deactivated
			AutoarchiveReloadedWebextension.loggerWebExtension.info("Menus and toolbarCustomizationListener deactivated");

			/*
			try
			{
				RestartlessMenuItems.add({
					label: browser.i18n.getMessage("menuArchive"),
					id: "AutoArchiveReloaded_AutoarchiveNow",
					idAppMenu: "AutoArchiveReloaded_AutoarchiveNow_AppMenu",
					onCommand: () =>
					{
						AutoarchiveReloadedBootstrap.Global.onArchiveManually();
					},
				});

				registerToolbarCustomizationListener(AutoarchiveReloadedBootstrap.Helper.getMail3Pane());
			}
			catch (e)
			{
				AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
				throw e;
			}
			*/
		}, 1000);

		//startup
		AutoarchiveReloadedBootstrap.Global.startup();
	}
	catch (e)
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
		throw e;
	}
}

function shutdown(data: BootstrapData, reason: BootstrapReasons.APP_SHUTDOWN | BootstrapReasons.ADDON_DISABLE | BootstrapReasons.ADDON_UNINSTALL | BootstrapReasons.ADDON_UPGRADE | BootstrapReasons.ADDON_DOWNGRADE): void
{
	//attention, do not rely on the logger in shutdown
	//it gives "can't access dead object" when accessing the settings

	//TODO: ?
	//removeToolbarCustomizationListener(AutoarchiveReloadedBootstrap.Helper.getMail3Pane());

	try
	{
		if (typeof RestartlessMenuItems !== "undefined")
		{
			RestartlessMenuItems.removeAll();
		}
	}
	catch (e)
	{
		console.log("AutoArchiveReloaded error");
		console.log(e);
	}
}

let bIsInToolbarCustomize: boolean = false;

function registerToolbarCustomizationListener(window: Window): void
{
	if (!window)
	{
		return;
	}

	window.addEventListener("aftercustomization", afterCustomize);
	window.addEventListener("beforecustomization", beforeCustomize);
}

function removeToolbarCustomizationListener(window: Window): void
{
	if (!window)
	{
		return;
	}

	window.removeEventListener("aftercustomization", afterCustomize);
	window.removeEventListener("beforecustomization", beforeCustomize);
}

function beforeCustomize(e: Event): void
{
	AutoarchiveReloadedWebextension.loggerWebExtension.info("toolbar customization detected");
	bIsInToolbarCustomize = true;
}

function afterCustomize(e: Event): void
{
	AutoarchiveReloadedWebextension.loggerWebExtension.info("toolbar customization ended");
	bIsInToolbarCustomize = false;
}