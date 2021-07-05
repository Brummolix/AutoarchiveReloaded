/*!
Copyright 2018-2021 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

enum LogLevel {
	info,
	error,
}

export class Logger {
	private logLevelInfo: LogLevelInfo;

	public constructor(logLevelInfo: LogLevelInfo) {
		this.logLevelInfo = logLevelInfo;
	}

	public info(str: string): void {
		this.log(LogLevel.info, str);
	}

	public error(str: string): void {
		this.log(LogLevel.error, str);
	}

	public errorException(exception: Error, message?: string): void {
		if (message === undefined) {
			this.error("Exception occured");
		} else {
			this.error(message);
		}
		this.logAny(exception);
	}

	private getLogLevelFromPref(): LogLevel {
		if (this.logLevelInfo.enableInfoLogging) {
			return LogLevel.info;
		}

		return LogLevel.error;
	}

	private log(levelToLog: LogLevel, str: string): void {
		if (levelToLog < this.getLogLevelFromPref()) {
			return;
		}

		this.logEntry(levelToLog, str);
	}

	private logEntry(levelToLog: LogLevel, str: string): void {
		const date = new Date();
		let strToLog = date.toLocaleString() + " - AutoarchiveReloaded - ";
		if (levelToLog === LogLevel.info) {
			strToLog += "INFO";
		} else {
			strToLog += "ERROR";
		}
		strToLog += ": " + str;

		this.logAny(strToLog);
	}

	private logAny(value: any): void {
		console.log(value);
	}
}
