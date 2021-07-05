/*!
Copyright 2013-2021 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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

import { GlobalStates } from "../sharedWebextension/GlobalStates";
import { Settings } from "../sharedWebextension/interfaces";
import { log } from "../sharedWebextension/LoggerWebextension";
import { OptionHelper } from "../sharedWebextension/optionHelper";
import { AppInfoLogger } from "./AppInfoLogger";
import { Archiver } from "./Archiver";

//global static startup/ui functions
export class MainFunctions {
	private static status: GlobalStates = GlobalStates.uninitialized;

	public static async startupAndInitialzeAutomaticArchiving(): Promise<void> {
		log.info("start...");

		const appInfoLogger = new AppInfoLogger();
		await appInfoLogger.log();

		this.status = GlobalStates.readyForWork;
		log.info("ready for work");

		const optionHelper: OptionHelper = new OptionHelper();
		const settings: Settings = await optionHelper.loadCurrentSettings();

		if (settings.globalSettings.archiveType === "startup") {
			log.info("archive type at startup");

			//wait some time to give TB time to connect and everything
			setTimeout(this.onDoArchiveAutomatic.bind(this), 9000);

			//repeat after one day (if someone has open Thunderbird all the time)
			setInterval(this.onDoArchiveAutomatic.bind(this), 86400000);
		} else {
			log.info("archive type manually");
		}
	}

	public static getStatus(): GlobalStates {
		return this.status;
	}

	public static async onArchiveManually(): Promise<void> {
		await this.onDoArchive();
	}

	private static onDoArchiveAutomatic(): void {
		log.info("try automatic archive");
		if (this.status !== GlobalStates.readyForWork) {
			log.info("automatic archive busy, wait");
			//busy: wait 5 seconds
			setTimeout(this.onDoArchiveAutomatic.bind(this), 5000);
		} else {
			void this.onDoArchive();
		}
	}

	private static async onDoArchive(): Promise<void> {
		log.info("start archiving");
		this.status = GlobalStates.inProgress;
		const autoarchiveReloaded = new Archiver();
		await autoarchiveReloaded.archiveAccounts();
		log.info("archive (searching messages to archive) done");
		this.status = GlobalStates.readyForWork;
	}
}
