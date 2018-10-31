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
const AutoArchiveReloadedImports: string[] = ["options.js", "overlay.js", "thunderbird-stdlib/RestartlessMenuItems.js", "thunderbird-stdlib/msgHdrUtils.js"];

function startup(data: BootstrapData, reason: BootstrapReasons): void
{
	console.log("AutoArchiveReloaded - startup");

	for (const strImport of AutoArchiveReloadedImports)
	{
		Cu.import("chrome://autoarchiveReloaded/content/" + strImport);
	}

	if (data.webExtension)
	{
		data.webExtension.startup().then((api: StartupWebextensionApi) =>
		{
			const browser = api.browser;
			browser.runtime.onMessage.addListener((msg: IBrowserMessage | IBrowserMessageSendCurrentSettings, sender: RuntimeMessageSender, sendReply: (response: object | null) => void) =>
			{
				if (msg.id === "sendCurrentPreferencesToLegacyAddOn") //we get the current preferences at start and on every change of preferences
				{
					AutoarchiveReloaded.settings = (msg as IBrowserMessageSendCurrentSettings).data;
				}
				else if (msg.id === "askForLegacyPreferences") //at startup we are asked for legacy preferences
				{
					const legacyOptions: AutoarchiveReloaded.LegacyOptions = new AutoarchiveReloaded.LegacyOptions();
					const legacySettings = legacyOptions.getLegacyOptions();
					sendReply(legacySettings);
					legacyOptions.markLegacySettingsAsMigrated();
				}
				else if (msg.id === "webExtensionStartupDone") //after startup we are informed and can go on
				{
					initAutoArchiveReloadedOverlay();
				}
				else if (msg.id === "askForAccounts") //we will be asked for valid accounts which can be archived
				{
					const accounts: IAccountInfo[] = [];
					AutoarchiveReloaded.AccountIterator.forEachAccount((account: Ci.nsIMsgAccount, isAccountArchivable: boolean) =>
					{
						if (!isAccountArchivable)
						{
							return;
						}

						accounts.push({
							accountId: account.key,
							accountName: account.incomingServer.prettyName,
						});
					});

					sendReply(accounts);
				}
			});
		});
	}
}

function initAutoArchiveReloadedOverlay(): void
{
	//TODO: after start of TB the menu is not there!
	//if we deactivate/activate it, it is there?
	//-> debug/log

	//menuitem
	RestartlessMenuItems.add({
		label: AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("menuArchive"),
		id: "AutoArchiveReloaded_AutoarchiveNow",
		onCommand: () =>
		{
			AutoarchiveReloadedOverlay.Global.onArchiveManually();
		},
	});

	//TODO: Toolbar in alle Windows einhängen...
	//TODO: wahrscheinlich besser so:
	//https://github.com/dgutov/bmreplace/blob/67ad019be480fc6b5d458dc886a2fb5364e92171/bootstrap.js#L27

	//toolbar button
	//see https://gist.github.com/Noitidart/9467045
	/*
	let doc = document;
	let toolbox = doc.querySelector('#navigator-toolbox');

	let buttonId = 'AutoArchiveReloaded_AutoarchiveNow_Button';
	let button = doc.getElementById(buttonId);
	if (!button)
	{
		button = doc.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbarbutton');
		button.setAttribute('id', buttonId);
		button.setAttribute('label', AutoarchiveReloadedOverlay.StringBundle.GetStringFromName("menuArchive"));
		button.setAttribute('tooltiptext', 'TODO My buttons tool tip if you want one');
		button.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional');
		button.style.listStyleImage = 'url("https://gist.githubusercontent.com/Noitidart/9266173/raw/06464af2965cb5968248b764b4669da1287730f3/my-urlbar-icon-image.png")';
		button.addEventListener('command', function() {
			AutoarchiveReloadedOverlay.Global.onArchiveManually();
		}, false);

		toolbox.palette.appendChild(button);
	}
	//move button into last postion in nav-bar
	let navBar = doc.querySelector('#nav-bar');
	navBar.insertItem(buttonId); //if you want it in first position in navBar do: navBar.insertItem(buttonId, navBar.firstChild);
	navBar.removeChild(button);
	*/

	//startup
	AutoarchiveReloadedOverlay.Global.startup();
}

function shutdown(data: BootstrapData, reason: BootstrapReasons): void
{
	console.log("AutoArchiveReloaded - shutdown");

	try
	{
		if (typeof RestartlessMenuItems !== "undefined")
		{
			RestartlessMenuItems.removeAll();
		}
	}
	catch (e)
	{
		AutoarchiveReloadedOverlay.Logger.errorException(e);
	}

	console.log("unload scripts");

	for (const strImport of AutoArchiveReloadedImports.reverse())
	{
		Cu.unload("chrome://autoarchiveReloaded/content/" + strImport);
	}
}

function install(data: BootstrapData, reason: BootstrapReasons): void
{
	console.log("AutoArchiveReloaded - install");
}

function uninstall(data: BootstrapData, reason: BootstrapReasons): void
{
	console.log("AutoArchiveReloaded - uninstall");
}