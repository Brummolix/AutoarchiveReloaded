/// <reference path="../sharedAll/GlobalStates.ts" />

async function initialize()
{
	const message: IGetArchiveStatusMessageRequest = {message: "getArchiveStatus"};
	const response: IGetArchiveStatusResponse = await browser.runtime.sendMessage(message);
	const status: AutoarchiveReloaded.GlobalStates = response.status;

	switch (status)
	{
		case AutoarchiveReloaded.GlobalStates.UNINITIALZED:
		{
			AutoarchiveReloaded.log.info("not initialized, cancel");
			$("#text").text(browser.i18n.getMessage("waitForInit"));
			$("#button").hide();
			break;
		}
		case AutoarchiveReloaded.GlobalStates.IN_PROGRESS:
		{
			AutoarchiveReloaded.log.info("busy with other archive..., cancel");
			$("#text").text(browser.i18n.getMessage("waitForArchive"));
			$("#button").hide();
			break;
		}
		case AutoarchiveReloaded.GlobalStates.READY_FOR_WORK:
		{
			AutoarchiveReloaded.log.info("user can start archiving");
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
		AutoarchiveReloaded.log.errorException(e);
		throw e;
	}
}

$(onLoad);