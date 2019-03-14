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
	//for managing the activities in activity view
	export class ActivityManager
	{
		private folder: Ci.nsIMsgFolder;
		private startProcess: Ci.nsIActivityProcess;

		constructor(folder: Ci.nsIMsgFolder)
		{
			try
			{
				this.folder = folder;
				this.startProcess = undefined as unknown as Ci.nsIActivityProcess;
				/*
				//TODO: what about the whole Activity manager?
				this.startProcess = Components.classes["@mozilla.org/activity-process;1"].createInstance(Components.interfaces.nsIActivityProcess);

				this.startProcess.init(browser.i18n.getMessage("activityStart", this.folder.name), null);
				this.startProcess.contextType = "account"; // group this activity by account
				this.startProcess.contextObj = this.folder.server; // account in question

				const activityManager = this.getActivityManager();
				activityManager.addActivity(this.startProcess);
				*/
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		public stopAndSetFinal(actual: number): void
		{
			try
			{
				this.startProcess.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
				const activityManager = this.getActivityManager();
				activityManager.removeActivity(this.startProcess.id);

				let msgNumber: string;
				if (actual < 0)
				{
					msgNumber = "? (error occured)";
				}
				else
				{
					msgNumber = actual.toString();
				}

				const event = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);
				event.init(browser.i18n.getMessage("activityDone", this.folder.name),
					null,
					browser.i18n.getMessage("activityMessagesToArchive", msgNumber),
					this.startProcess.startTime, // start time
					Date.now(), // completion time
				);
				event.contextType = this.startProcess.contextType; // optional
				event.contextObj = this.startProcess.contextObj; // optional
				activityManager.addActivity(event);
			}
			catch (e)
			{
				loggerWebExtension.errorException(e);
				throw e;
			}
		}

		private getActivityManager(): Ci.nsIActivityManager
		{
			return Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
		}
	}
}