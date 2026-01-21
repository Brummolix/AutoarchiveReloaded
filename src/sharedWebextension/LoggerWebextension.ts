/*!
Copyright 2019-2026 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

import { LogLevelInfo } from "./LogLevelInfo";
import { Logger } from "./Logger";

export class LogLevelInfoWebExtension implements LogLevelInfo {
	private static readonly ENABLE_INFO_LOGGING_NAME: string = "WebExtensionLoggerHelper_enableInfoLogging";

	public static setGlobaleEnableInfoLogging(value: boolean): void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		(browser.extension.getBackgroundPage() as any)[LogLevelInfoWebExtension.ENABLE_INFO_LOGGING_NAME] = value;
	}

	private static getGlobalEnableInfoLogging(): boolean {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return (browser.extension.getBackgroundPage() as any)[LogLevelInfoWebExtension.ENABLE_INFO_LOGGING_NAME] as boolean;
	}

	//this is very tricky!
	//there exist multiple loggers (one in background scripts and one in option page)
	//but they should use the same setting for info logging
	//on the other hand the whole logging handling should be easy and not rely on a lot of things (option handling, read values asynchonously from storage and so on)
	//therefore we always use the value from a global variable of the background script
	//additionally the option helper (or someone else) can set the setting via setGlobaleEnableInfoLogging (it will set the variable in the backround scripts)
	//-> in this way we can have as many loggers as we want, as soon as the settings are available they can set the global value
	public get enableInfoLogging(): boolean {
		return LogLevelInfoWebExtension.getGlobalEnableInfoLogging();
	}
}

export const log: Logger = new Logger(new LogLevelInfoWebExtension());
