/// <reference path="../sharedAll/GlobalStates.ts" />

interface IGetArchiveStatusMessageRequest
{
	message: "getArchiveStatus";
}

interface IGetArchiveStatusResponse
{
	status: AutoarchiveReloaded.GlobalStates;
}

interface IArchiveManuallyMessageRequest
{
	message: "archiveManually";
}