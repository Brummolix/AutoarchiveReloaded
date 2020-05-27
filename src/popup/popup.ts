/* eslint-disable prefer-arrow/prefer-arrow-functions */
//TODO: temporarily or permanently?

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

import { GlobalStates } from "../sharedAll/GlobalStates";
import { ArchiveManuallyMessageRequest, GetArchiveStatusMessageRequest, GetArchiveStatusResponse } from "../sharedAll/Messages";
import { log } from "../sharedWebextension/Logger";

async function initialize(): Promise<void> {
	const message: GetArchiveStatusMessageRequest = { message: "getArchiveStatus" };
	const response: GetArchiveStatusResponse = await browser.runtime.sendMessage(message);
	const status: GlobalStates = response.status;

	switch (status) {
		case GlobalStates.uninitialized: {
			log.info("not initialized, cancel");
			$("#text").text(browser.i18n.getMessage("waitForInit"));
			$("#button").hide();
			break;
		}
		case GlobalStates.inProgress: {
			log.info("busy with other archive..., cancel");
			$("#text").text(browser.i18n.getMessage("waitForArchive"));
			$("#button").hide();
			break;
		}
		case GlobalStates.readyForWork: {
			log.info("user can start archiving");
			$("#text").text(browser.i18n.getMessage("dialogStartManualText"));
			$("#button").show();
			break;
		}
	}
}

async function onManualArchive(): Promise<void> {
	const message: ArchiveManuallyMessageRequest = { message: "archiveManually" };
	await browser.runtime.sendMessage(message);
	window.close();
}

async function onLoad(): Promise<void> {
	try {
		await initialize();
		$("#button").click(onManualArchive);
	} catch (e) {
		log.errorException(e);
		throw e;
	}
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
$(onLoad);
