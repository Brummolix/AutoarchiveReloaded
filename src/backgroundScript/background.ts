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

/// <reference path="../sharedWebextension/Logger.ts" />

namespace AutoarchiveReloaded
{
	export async function startup(): Promise<void>
	{
		try
		{
			log.info("Hello world background.ts");

			browser.autoarchive.initToolbarConfigurationObserver();

			browser.browserAction.onClicked.addListener(onArchiveManuallyClicked);

			const helper: OptionHelper = new OptionHelper();
			await helper.convertLegacyPreferences();
			Global.startup();
		}
		catch (e)
		{
			log.errorException(e);
			throw e;
		}
	}

	async function onArchiveManuallyClicked(): Promise<void>
	{
		//TODO: disable button in mailwindow (or only enable it in mail3pane) -> how to detect?

		//it would be better to detect if the buttons are configured right now and do nothing in this case
		//but as we don't know how to do it for a web extension it will be done in the webexperiment
		if (await browser.autoarchive.isToolbarConfigurationOpen())
		{
			log.info("archive manually rejected because of toolbar customization");
			return;
		}

		await Global.onArchiveManually();
	}
}

AutoarchiveReloaded.startup();