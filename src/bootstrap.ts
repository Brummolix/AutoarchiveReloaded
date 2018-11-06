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

Cu.import("resource://gre/modules/Services.jsm");

//list here all imports, also from sub files to make sure they are correctly unloaded
const AutoArchiveReloadedImports: string[] = ["options.js", "shared/Logger.js", "overlay.js", "thunderbird-stdlib/RestartlessMenuItems.js", "thunderbird-stdlib/msgHdrUtils.js"];

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

function startup(data: BootstrapData, reason: BootstrapReasons.APP_STARTUP | BootstrapReasons.ADDON_ENABLE | BootstrapReasons.ADDON_INSTALL | BootstrapReasons.ADDON_UPGRADE | BootstrapReasons.ADDON_DOWNGRADE): void
{
	try
	{
		//attention, no logger is there until all scripts are loaded!

		for (const strImport of AutoArchiveReloadedImports)
		{
			Cu.import("chrome://autoarchiveReloaded/content/" + strImport);
		}

		AutoarchiveReloadedBootstrap.logger.info("bootstrap startup and logger defined");

		if (data.webExtension)
		{
			data.webExtension.startup().then((api: StartupWebextensionApi) =>
			{
				const browser = api.browser;
				browser.runtime.onMessage.addListener((msg: IBrowserMessage | IBrowserMessageSendCurrentSettings, sender: RuntimeMessageSender, sendReply: (response: object | null) => void) =>
				{
					if (msg.id === "sendCurrentPreferencesToLegacyAddOn") //we get the current preferences at start and on every change of preferences
					{
						replyToSendCurrentPreferencesToLegacyAddOnAskForLegacyPreferences((msg as IBrowserMessageSendCurrentSettings));
					}
					else if (msg.id === "askForLegacyPreferences") //at startup we are asked for legacy preferences
					{
						replyToAskForLegacyPreferences(sendReply);
					}
					else if (msg.id === "webExtensionStartupDone") //after startup we are informed and can go on
					{
						initAutoArchiveReloadedOverlay();
					}
					else if (msg.id === "askForAccounts") //we will be asked for valid accounts which can be archived
					{
						replyToAskForAccounts(sendReply);
					}
					else if (msg.id === "archiveManually")
					{
						replyToArchiveManually();
					}
				});
			});
		}
	}
	catch (e)
	{
		//there might be no logger, yet
		if (isLoggerAvailable())
		{
			AutoarchiveReloadedBootstrap.logger.errorException(e);
		}
		else
		{
			console.log("AutoArchiveReloaded error");
			console.log(e);
		}
		throw e;
	}
}

function isLoggerAvailable(): boolean
{
	return (typeof AutoarchiveReloadedBootstrap !== "undefined") && (typeof AutoarchiveReloadedBootstrap.logger !== "undefined");
}

function replyToArchiveManually(): void
{
	if (!bIsInToolbarCustomize)
	{
		AutoarchiveReloadedBootstrap.Global.onArchiveManually();
	}
	else
	{
		AutoarchiveReloadedBootstrap.logger.info("archive manually rejected because of toolbar customization");
	}
}

function replyToSendCurrentPreferencesToLegacyAddOnAskForLegacyPreferences(msg: IBrowserMessageSendCurrentSettings): void
{
	try
	{
		AutoarchiveReloadedBootstrap.settings = msg.data;
	}
	catch (e)
	{
		AutoarchiveReloadedBootstrap.logger.errorException(e);
		throw e;
	}
}

function replyToAskForLegacyPreferences(sendReply: (response: object | null) => void): void
{
	try
	{
		const legacyOptions: AutoarchiveReloadedBootstrap.LegacyOptions = new AutoarchiveReloadedBootstrap.LegacyOptions();
		const legacySettings = legacyOptions.getLegacyOptions();
		sendReply(legacySettings);
		legacyOptions.markLegacySettingsAsMigrated();
	}
	catch (e)
	{
		AutoarchiveReloadedBootstrap.logger.errorException(e);
		throw e;
	}
}

function replyToAskForAccounts(sendReply: (response: object | null) => void): void
{
	try
	{
		const nsAccounts: Ci.nsIMsgAccount[] = [];
		AutoarchiveReloadedBootstrap.AccountIterator.forEachAccount((account: Ci.nsIMsgAccount, isAccountArchivable: boolean) =>
		{
			if (isAccountArchivable)
			{
				nsAccounts.push(account);
			}
		});

		nsAccounts.sort((a: Ci.nsIMsgAccount, b: Ci.nsIMsgAccount) =>
		{
			const mailTypeA: boolean = (a.incomingServer.type === "pop3" || a.incomingServer.type === "imap");
			const mailTypeB: boolean = (b.incomingServer.type === "pop3" || b.incomingServer.type === "imap");

			if (mailTypeA === mailTypeB)
			{
				return a.incomingServer.prettyName.localeCompare(b.incomingServer.prettyName);
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
				accountId: account.key,
				accountName: account.incomingServer.prettyName,
				order: currentOrder++,
			});
		});

		sendReply(accounts);
	}
	catch (e)
	{
		AutoarchiveReloadedBootstrap.logger.errorException(e);
		throw e;
	}
}

function initAutoArchiveReloadedOverlay(): void
{
	try
	{
		AutoarchiveReloadedBootstrap.logger.info("initAutoArchiveReloadedOverlay");

		//directly after start of TB the adding of the menu does not work (getting the elemtens of "taskPopup" and "tabmail" returns null)
		//therefore we have to wait a bit
		//additionally setTimeout is not defined (even if we can use it AutoarchiveReloadedOverlay.Global.startup at the same time???)
		//therefore use the mail3pane
		(AutoarchiveReloadedBootstrap.Helper.getMail3Pane() as any).setTimeout(() =>
		{
			try
			{
				RestartlessMenuItems.add({
					label: AutoarchiveReloadedBootstrap.StringBundle.GetStringFromName("menuArchive"),
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
				AutoarchiveReloadedBootstrap.logger.errorException(e);
				throw e;
			}

		}, 1000);

		//startup
		AutoarchiveReloadedBootstrap.Global.startup();
	}
	catch (e)
	{
		AutoarchiveReloadedBootstrap.logger.errorException(e);
		throw e;
	}
}

function shutdown(data: BootstrapData, reason: BootstrapReasons.APP_SHUTDOWN | BootstrapReasons.ADDON_DISABLE | BootstrapReasons.ADDON_UNINSTALL | BootstrapReasons.ADDON_UPGRADE | BootstrapReasons.ADDON_DOWNGRADE): void
{
	//attention, do not rely on the logger in shutdown
	//it gives "can't access dead object" when accessing the settings

	removeToolbarCustomizationListener(AutoarchiveReloadedBootstrap.Helper.getMail3Pane());

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

	for (const strImport of AutoArchiveReloadedImports.reverse())
	{
		Cu.unload("chrome://autoarchiveReloaded/content/" + strImport);
	}
}

function install(data: BootstrapData, reason: BootstrapReasons.ADDON_INSTALL | BootstrapReasons.ADDON_UPGRADE | BootstrapReasons.ADDON_DOWNGRADE): void
{
	//nothing to do
}

function uninstall(data: BootstrapData, reason: BootstrapReasons.ADDON_UNINSTALL | BootstrapReasons.ADDON_UPGRADE | BootstrapReasons.ADDON_DOWNGRADE): void
{
	//nothing to do
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
	AutoarchiveReloadedBootstrap.logger.info("toolbar customization detected");
	bIsInToolbarCustomize = true;
}

function afterCustomize(e: Event): void
{
	AutoarchiveReloadedBootstrap.logger.info("toolbar customization ended");
	bIsInToolbarCustomize = false;
}