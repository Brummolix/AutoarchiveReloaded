import { GlobalStates } from "./GlobalStates";

export interface GetArchiveStatusMessageRequest
{
	message: "getArchiveStatus";
}

export interface GetArchiveStatusResponse
{
	status: GlobalStates;
}

export interface ArchiveManuallyMessageRequest
{
	message: "archiveManually";
}