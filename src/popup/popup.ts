
/// <reference path="../sharedAll/thunderbird.d.ts" />

import { GlobalStates } from "../sharedAll/GlobalStates";
import { IArchiveManuallyMessageRequest, IGetArchiveStatusMessageRequest, IGetArchiveStatusResponse } from "../sharedAll/IMessages";
import { log } from "../sharedWebextension/Logger";

async function initialize()
{
	const message: IGetArchiveStatusMessageRequest = {message: "getArchiveStatus"};
	const response: IGetArchiveStatusResponse = await browser.runtime.sendMessage(message);
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

async function onManualArchive(): Promise<void>
{
	const message: IArchiveManuallyMessageRequest = {message: "archiveManually"};
	browser.runtime.sendMessage(message);
	window.close();
}

async function onLoad()
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

$(onLoad);