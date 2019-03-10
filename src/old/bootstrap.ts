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

async function replyToArchiveManually(): Promise<void>
{
	console.log("replyToArchiveManually");
	//TODO: disable button in mailwindow (or only enable it in mail3pane) -> how to detect?

	//it would be better to detect if the buttons are configured right now and do nothing in this case
	//but as we don't know how to do it for a web extension it will be done in the webexperiment
	if (await browser.autoarchive.isToolbarConfigurationOpen())
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
			//TODO: Menus deactivated
			AutoarchiveReloadedWebextension.loggerWebExtension.info("Menus deactivated");

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

function shutdown(): void
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