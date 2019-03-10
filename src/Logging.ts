/*!
Copyright 2018 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

namespace AutoarchiveReloaded
{
	export class LoggerHelper implements ILoggerHelper
	{
		private static readonly ENABLE_INFO_LOGGING_NAME: string = "WebExtensionLoggerHelper_enableInfoLogging";

		public static setGlobaleEnableInfoLogging(value: boolean)
		{
			(browser.extension.getBackgroundPage() as any)[LoggerHelper.ENABLE_INFO_LOGGING_NAME] = value;

			//webexperiment has different log setting...
			browser.autoarchive.setInfoLogging(value);
		}

		private static getGlobalEnableInfoLogging(): boolean
		{
			return (browser.extension.getBackgroundPage() as any)[LoggerHelper.ENABLE_INFO_LOGGING_NAME];
		}

		public log(msgToLog: string): void
		{
			console.log(msgToLog);
		}

		//this is very tricky!
		//there exist multiple loggers (one in background scripts and one in option page)
		//but they should use the same setting for info logging
		//on the other hand the whole logging handling should be easy and not rely on a lot of things (option handling, read values asynchonously from storage and so on)
		//therefore we always use the value from a global variable of the background script
		//additionally the option helper (or someone else) can set the setting via setGlobaleEnableInfoLogging (it will set the variable in the backround scripts)
		//-> in this way we can have as many loggers as we want, as soon as the settings are available they can set the global value
		public getEnableInfoLogging(): boolean
		{
			return LoggerHelper.getGlobalEnableInfoLogging();
		}
	}

	export const loggerWebExtension: Logger = new Logger(new LoggerHelper());

	//TODO: temporarily enable info logging until we have a more stable state
	LoggerHelper.setGlobaleEnableInfoLogging(true);
}