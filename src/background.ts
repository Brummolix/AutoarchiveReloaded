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
startup();

async function startup(): Promise<void>
{
	try
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.info("Hello world background.ts");

		browser.autoarchive.initToolbarConfigurationObserver();

		browser.browserAction.onClicked.addListener(replyToArchiveManually);

		const helper: AutoarchiveReloadedWebextension.OptionHelper = new AutoarchiveReloadedWebextension.OptionHelper();
		await helper.convertLegacyPreferences();
		AutoarchiveReloadedBootstrap.Global.startup();
	}
	catch (e)
	{
		AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
		throw e;
	}
}

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