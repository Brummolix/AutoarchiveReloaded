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

// tslint:disable-next-line:no-var-keyword
var EXPORTED_SYMBOLS = ["AutoarchiveReloadedShared"];

namespace AutoarchiveReloadedShared
{
	export enum LogLevel
	{
		LEVEL_INFO, LEVEL_ERROR,
	}

	export interface ILoggerHelper
	{
		log(msgToLog: string): void;
		getEnableInfoLogging(): boolean;
	}

	export class Logger
	{
		private loggerHelper: ILoggerHelper;

		constructor(loggerHelper: ILoggerHelper)
		{
			this.loggerHelper = loggerHelper;
		}

		public static getExceptionInfo(e: ThunderbirdError): string
		{
			return e + "; Source: '" + e.fileName + "'; Line: " + e.lineNumber + "; code: " + e.toSource() + "; stack: " + e.stack;
		}

		public info(str: string): void
		{
			this.log(LogLevel.LEVEL_INFO, str);
		}

		public error(str: string): void
		{
			this.log(LogLevel.LEVEL_ERROR, str);
		}

		public errorException(e: ThunderbirdError): void
		{
			this.error(Logger.getExceptionInfo(e));
		}

		private getLogLevelFromPref(): LogLevel
		{
			if (this.loggerHelper.getEnableInfoLogging())
			{
				return LogLevel.LEVEL_INFO;
			}

			return LogLevel.LEVEL_ERROR;
		}

		private log(levelToLog: LogLevel, str: string): void
		{
			if (levelToLog < this.getLogLevelFromPref())
			{
				return;
			}

			this.DoLog(levelToLog, str);
		}

		private DoLog(levelToLog: LogLevel, str: string): void
		{
			const date = new Date();
			let strToLog = date.toLocaleString() + " - AutoarchiveReloaded - ";
			if (levelToLog === LogLevel.LEVEL_INFO)
			{
				strToLog += "INFO";
			}
			else
			{
				strToLog += "ERROR";
			}
			strToLog += ": " + str;

			this.loggerHelper.log(strToLog);
		}
	}
}