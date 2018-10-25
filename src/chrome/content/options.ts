/*
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

var EXPORTED_SYMBOLS = [
    'AutoarchiveReloaded'
]

Components.utils.import("chrome://autoarchiveReloaded/content/shared/OptionHandling.js");

namespace AutoarchiveReloaded
{
    export class LegacyOptions
    {
        //return null if already migrated or no settings!
        getLegacyOptions():ISettings | null
        {
            let prefBranch = this.getInternalLegacyPrefBranch();
            
            let aChildArray:object[] = prefBranch.getChildList("", {});

            //TODO: this test is not sufficient, even if no global options are available there could be account settings...
            if (aChildArray.length==0)
                return null;

            if (prefBranch.getBoolPref("preferencesAlreadyMigrated",false))
                return null;
            

            let legacySettings:ISettings = {
                globalSettings: {
                    archiveType: prefBranch.getCharPref("archiveType","manual"),
                    enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging",false),
                },

                accountSettings : { }
            };

            //TODO: get real data

            /*
           	private account:nsIMsgAccount;

			let server = this.account.incomingServer;
			//we take the same option names as the original extension
			this.bArchiveOther = server.getBoolValue("archiveMessages");
			this.daysOther = server.getIntValue("archiveMessagesDays");
			this.bArchiveMarked = server.getBoolValue("archiveStarred");
			this.daysMarked = server.getIntValue("archiveStarredDays");
			this.bArchiveTagged = server.getBoolValue("archiveTagged");
			this.daysTagged = server.getIntValue("archiveTaggedDays");
			this.bArchiveUnread = server.getBoolValue("archiveUnread");
			this.daysUnread = server.getIntValue("archiveUnreadDays");
            */

            let accountSetting:IAccountSettings = {
                bArchiveOther: true,
                daysOther: 0,
                bArchiveMarked: true,
                daysMarked: 40,
                bArchiveTagged: true,
                daysTagged: 50,
                bArchiveUnread: true,
                daysUnread: 60
            };
            legacySettings.accountSettings["account1"] = accountSetting;
            let accountSetting2:IAccountSettings = {
                bArchiveOther: false,
                daysOther: 70,
                bArchiveMarked: false,
                daysMarked: 80,
                bArchiveTagged: false,
                daysTagged: 90,
                bArchiveUnread: false,
                daysUnread: 100
            };
            legacySettings.accountSettings["account2"] = accountSetting2;

            return legacySettings;
        }

        markLegacySettingsAsMigrated():void
        {
            this.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
        };

        getInternalLegacyPrefBranch():nsIPrefBranch
        {
            let prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
            return prefs.getBranch("extensions.AutoarchiveReloaded.");
        };
    }

    //TODO: why is this inside options?
    export function isAccountArchivable(account:nsIMsgAccount):boolean
    {
		//ignore IRC accounts
		return (account.incomingServer.localStoreType == "mailbox" || account.incomingServer.localStoreType == "imap" || account.incomingServer.localStoreType == "news");
    }

    //TODO: does it work without AutoarchiveReloadedOptions || ??? Or is it created new for every one who includes it then?
    //AutoarchiveReloadedOptions || new AutoarchiveReloadedOptionsClass();
    //-> debug and see if the settings are there in overlay.ts
    export var settings:ISettings;
}