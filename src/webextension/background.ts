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
try
{
	//TODO: disable button in mailwindow (or only enable it in mail3pane) -> how to detect?
	browser.browserAction.onClicked.addListener( (tab: any) =>
	{
		const message: IBrowserMessage = {
			id: "archiveManually",
		};

		//TODO: don't do anything if the buttons are configured right now, but how to detect this?
		browser.runtime.sendMessage(message);
	});

	const helper: AutoarchiveReloadedWeOptionHelper = new AutoarchiveReloadedWeOptionHelper();
	helper.convertLegacyPreferences();
}
catch (e)
{
	loggerWebExtension.errorException(e);
	throw e;
}