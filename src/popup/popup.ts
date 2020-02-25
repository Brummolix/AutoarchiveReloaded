/* eslint-disable prefer-arrow/prefer-arrow-functions */
//TODO: temporarily or permanently?

/// <reference path="../sharedAll/thunderbird.d.ts" />

import { GlobalStates } from "../sharedAll/GlobalStates";
import { ArchiveManuallyMessageRequest, GetArchiveStatusMessageRequest, GetArchiveStatusResponse } from "../sharedAll/Messages";
import { log } from "../sharedWebextension/Logger";

async function initialize(): Promise<void>
{
	const message: GetArchiveStatusMessageRequest = {message: "getArchiveStatus"};
	const response: GetArchiveStatusResponse = await browser.runtime.sendMessage(message);
	const status: GlobalStates = response.status;

	switch (status)
	{
		case GlobalStates.UNINITIALZED:
		{
			log.info("not initialized, cancel");
			$("#text").text(browser.i18n.getMessage("waitForInit"));
			$("#button").hide();
			break;
		}
		case GlobalStates.IN_PROGRESS:
		{
			log.info("busy with other archive..., cancel");
			$("#text").text(browser.i18n.getMessage("waitForArchive"));
			$("#button").hide();
			break;
		}
		case GlobalStates.READY_FOR_WORK:
		{
			log.info("user can start archiving");
			$("#text").text(browser.i18n.getMessage("dialogStartManualText"));
			$("#button").show();
			break;
		}
	}
}

function onManualArchive(): void
{
	const message: ArchiveManuallyMessageRequest = {message: "archiveManually"};
	browser.runtime.sendMessage(message);
	window.close();
}

async function onLoad(): Promise<void>
{
	try
	{
		await initialize();
		$("#button").click(onManualArchive);
	}
	catch (e)
	{
		log.errorException(e);
		throw e;
	}
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
$(onLoad);