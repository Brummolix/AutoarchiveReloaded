import { GlobalStates } from "./GlobalStates";

export interface IGetArchiveStatusMessageRequest
{
	message: "getArchiveStatus";
}

export interface IGetArchiveStatusResponse
{
	status: GlobalStates;
}

export interface IArchiveManuallyMessageRequest
{
	message: "archiveManually";
}