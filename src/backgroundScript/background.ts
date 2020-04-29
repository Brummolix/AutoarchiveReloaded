/*!
Copyright 2019-2020 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { ArchiveManuallyMessageRequest, GetArchiveStatusMessageRequest } from "../sharedAll/Messages";
import {log} from "../sharedWebextension/Logger";
import { OptionHelper } from "../sharedWebextension/optionHelper";
import { MainFunctions } from "./MainFunctions";

async function startup(): Promise<void>
{
	try
	{
		log.info("Autoarchive background script started");

		const optionHelper: OptionHelper = new OptionHelper();
		await optionHelper.initializePreferencesAtStartup();
		await MainFunctions.startupAndInitialzeAutomaticArchiving();
		browser.runtime.onMessage.addListener(handleMessage);
	}
	catch (e)
	{
		log.errorException(e);
		throw e;
	}
}

function handleMessage(request: ArchiveManuallyMessageRequest|GetArchiveStatusMessageRequest, sender: RuntimeMessageSender, sendResponse: RuntimeMessageResponseFunction): void {
	switch (request.message)
	{
		case "getArchiveStatus":
		{
			log.info("background script getArchiveStatus");
			sendResponse({status: MainFunctions.getStatus()});
			break;
		}
		case "archiveManually":
		{
			log.info("user choosed to archive manually");
			MainFunctions.onArchiveManually(); //without await...
			sendResponse(null);
			break;
		}
	}
}

startup();