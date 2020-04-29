/*!
Copyright 2013-2020 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
Copyright 2012 Alexey Egorov (original version Autoarchive, http://code.google.com/p/autoarchive/ )

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

import { AccountInfo, Settings } from "../sharedAll/interfaces";
import { LegacyOptions } from "./LegacyOptions";
import { log, logLevelInfo } from "./Logger";

//This class must be the default export, because the default is exported by webpack (see configuration) on a "var autoarchive"
//(The only way Thunderbird wants it...)

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class autoarchive extends ExtensionCommon.ExtensionAPI {
	private legacyOptions: LegacyOptions = new LegacyOptions();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getAPI(context: ExtensionContext): any {
		return {
			autoarchive: {
				askForLegacyPreferences: (accounts: AccountInfo[]): Settings | null => {
					log.info("askForLegacyPreferences");
					try {
						return this.legacyOptions.askForLegacyPreferences(accounts);
					} catch (e) {
						log.error(e);
						throw e;
					}
				},
				setInfoLogging: (value: boolean): void => {
					logLevelInfo.enableInfoLogging = value;
				},
			},
		};
	}
}
