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