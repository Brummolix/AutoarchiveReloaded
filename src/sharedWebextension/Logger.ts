
/// <reference path="../sharedAll/ILogLevelInfo.ts" />
/// <reference path="../sharedAll/Logger.ts" />

namespace AutoarchiveReloaded
{
	export class LogLevelInfo implements ILogLevelInfo
	{
		private static readonly ENABLE_INFO_LOGGING_NAME: string = "WebExtensionLoggerHelper_enableInfoLogging";

		public static setGlobaleEnableInfoLogging(value: boolean)
		{
			(browser.extension.getBackgroundPage() as any)[LogLevelInfo.ENABLE_INFO_LOGGING_NAME] = value;

			//webexperiment has different log setting...
			browser.autoarchive.setInfoLogging(value);
		}

		private static getGlobalEnableInfoLogging(): boolean
		{
			return (browser.extension.getBackgroundPage() as any)[LogLevelInfo.ENABLE_INFO_LOGGING_NAME];
		}

		//this is very tricky!
		//there exist multiple loggers (one in background scripts and one in option page)
		//but they should use the same setting for info logging
		//on the other hand the whole logging handling should be easy and not rely on a lot of things (option handling, read values asynchonously from storage and so on)
		//therefore we always use the value from a global variable of the background script
		//additionally the option helper (or someone else) can set the setting via setGlobaleEnableInfoLogging (it will set the variable in the backround scripts)
		//-> in this way we can have as many loggers as we want, as soon as the settings are available they can set the global value
		public get enableInfoLogging(): boolean
		{
			return LogLevelInfo.getGlobalEnableInfoLogging();
		}
	}

	export const log: Logger = new Logger(new LogLevelInfo());
}