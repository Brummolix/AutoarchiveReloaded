/*!
Copyright 2019-2022 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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
import { ArchiveManuallyMessageRequest, GetArchiveStatusMessageRequest } from "../sharedWebextension/Messages";
import { log } from "../sharedWebextension/LoggerWebextension";
import { OptionHelper } from "../sharedWebextension/optionHelper";
import { MainFunctions } from "./MainFunctions";

/**
 * the main startup function of the background script
 */
async function startup(): Promise<void> {
	try {
		log.info("Autoarchive background script started");

		const optionHelper: OptionHelper = new OptionHelper();
		await optionHelper.initializePreferencesAtStartup();
		await MainFunctions.startupAndInitialzeAutomaticArchiving();
		browser.runtime.onMessage.addListener(handleMessage);
	} catch (e) {
		log.errorException(e);
		throw e;
	}
}

/**
 * receive messages (commands) from the popup
 *
 * @param request - the data of the message
 * @param sender the sender
 * @param sendResponse the function to receive the response
 */
function handleMessage(
	request: ArchiveManuallyMessageRequest | GetArchiveStatusMessageRequest,
	sender: RuntimeMessageSender,
	sendResponse: RuntimeMessageResponseFunction
): void {
	switch (request.message) {
		case "getArchiveStatus": {
			log.info("background script getArchiveStatus");
			sendResponse({ status: MainFunctions.getStatus() });
			break;
		}
		case "archiveManually": {
			log.info("user choosed to archive manually");

			// handleMessage does not work with async functions and it is OK to send the response immediately without waiting...
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			MainFunctions.onArchiveManually();
			sendResponse(null);
			break;
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- global await is not possible but it works as nothing comes after this function...
startup();
