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
	export class SettingsHelper
	{
		public static isArchivingSomething(accountSettings: IAccountSettings): boolean
		{
			return (accountSettings.bArchiveOther || accountSettings.bArchiveMarked || accountSettings.bArchiveTagged || accountSettings.bArchiveUnread);
		}

		public static getMinAge(accountSettings: IAccountSettings): number
		{
			let minAge = Number.MAX_VALUE;
			if (accountSettings.bArchiveOther)
			{
				minAge = Math.min(accountSettings.daysOther, minAge);
			}
			if (accountSettings.bArchiveMarked)
			{
				minAge = Math.min(accountSettings.daysMarked, minAge);
			}
			if (accountSettings.bArchiveTagged)
			{
				minAge = Math.min(accountSettings.daysTagged, minAge);
			}
			if (accountSettings.bArchiveUnread)
			{
				minAge = Math.min(accountSettings.daysUnread, minAge);
			}

			return minAge;
		}

		public static log(accountName: string, accountSettings: IAccountSettings)
		{
			loggerWebExtension.info("Settings for '" + accountName + "':");
			loggerWebExtension.info(JSON.stringify(accountSettings));
		}
	}
}