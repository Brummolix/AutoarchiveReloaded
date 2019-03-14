/*!
Copyright 2013-2018 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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
namespace AutoarchiveReloaded
{
	//TODO: rename
	enum States
	{
		UNINITIALZED,
		READY_FOR_WORK,
		IN_PROGRESS,
	}

	//TODO: rename
	//TODO: singleton
	//singleton with global /startup/ui functions
	export class Global
	{
		private static status: States = States.UNINITIALZED;

		public static async startup(): Promise<void>
		{
			loggerWebExtension.info("start...");

			const appInfoLogger = new AppInfoLogger();
			await appInfoLogger.log();

			this.status = States.READY_FOR_WORK;
			loggerWebExtension.info("ready for work");

			const optionHelper: OptionHelper = new OptionHelper();
			const settings: ISettings = await optionHelper.loadCurrentSettings();

			if (settings.globalSettings.archiveType === "startup")
			{
				loggerWebExtension.info("archive type at startup");

				//wait some time to give TB time to connect and everything
				setTimeout(this.onDoArchiveAutomatic.bind(this), 9000);

				//repeat after one day (if someone has open Thunderbird all the time)
				setInterval(this.onDoArchiveAutomatic.bind(this), 86400000);
			}
			else
			{
				loggerWebExtension.info("archive type manually");
			}
		}

		public static async onDoArchiveAutomatic(): Promise<void>
		{
			loggerWebExtension.info("try automatic archive");
			if (this.status !== States.READY_FOR_WORK)
			{
				loggerWebExtension.info("automatic archive busy, wait");
				//busy: wait 5 seconds
				setTimeout(this.onDoArchiveAutomatic.bind(this), 5000);
			}
			else
			{
				await this.onDoArchive();
			}
		}

		public static async onDoArchive(): Promise<void>
		{
			loggerWebExtension.info("start archiving");
			this.status = States.IN_PROGRESS;
			const autoarchiveReloaded = new Archiver(this.onArchiveDone.bind(this));
			await autoarchiveReloaded.archiveAccounts();
		}

		public static async onArchiveManually(): Promise<void>
		{
			loggerWebExtension.info("try manual archive");
			if (this.status === States.UNINITIALZED)
			{
				loggerWebExtension.info("not initialized, cancel");

				await browser.autoarchive.alert(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("waitForInit"));
				return;
			}

			if (await browser.autoarchive.confirm(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("dialogStartManualText")))
			{
				if (this.status === States.IN_PROGRESS)
				{
					loggerWebExtension.info("busy with other archive..., cancel");
					await browser.autoarchive.alert(browser.i18n.getMessage("dialogTitle"), browser.i18n.getMessage("waitForArchive"));
					return;
				}
				await this.onDoArchive();
			}
			else
			{
				loggerWebExtension.info("manual archive canceled by user");
			}
		}

		private static onArchiveDone(): void
		{
			loggerWebExtension.info("archive (searching messages to archive) done");
			this.status = States.READY_FOR_WORK;
		}
	}
}