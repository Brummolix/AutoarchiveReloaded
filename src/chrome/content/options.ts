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
    'AutoarchiveReloadedOptions'
]

//TODO: we need the AutoarchiveReloadedWeOptionHelper but it is also needed inside the webextension
//or do we have to copy it to another place because it is inside web extension an not available for the legacyAddIn part?
//shall we create a space with shared resources!
//or rewrite the whole default settings part (only need default settings in webextension)
class AutoarchiveReloadedOptionsClass
{
    constructor()
    {
        console.log("AutoarchiveReloadedOptionsClass CONSTRUCTOR called!");
    }

    //TODO: refactor to own class for default settings?
    //TODO: does not work see above...
    settings:ISettings = new AutoarchiveReloadedWeOptionHelper().getDefaultSettings();

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

            accountSettings : []
        };

        //TODO: get real data
        let accountSetting:IAccountSettings = {
            accountId: "account1",
            bArchiveOther: true,
            daysOther: 0,
            bArchiveMarked: true,
            daysMarked: 40,
            bArchiveTagged: true,
            daysTagged: 50,
            bArchiveUnread: true,
            daysUnread: 60
        };
        legacySettings.accountSettings[0] = accountSetting;
        let accountSetting2:IAccountSettings = {
            accountId: "account2",
            bArchiveOther: false,
            daysOther: 70,
            bArchiveMarked: false,
            daysMarked: 80,
            bArchiveTagged: false,
            daysTagged: 90,
            bArchiveUnread: false,
            daysUnread: 100
        };
        legacySettings.accountSettings[1] = accountSetting2;

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

//TODO: does it work without AutoarchiveReloadedOptions || ??? Or is it created new for every one who includes it then?
//AutoarchiveReloadedOptions || new AutoarchiveReloadedOptionsClass();
//-> debug and see how many times the constructor was called!
//maybe use a namespace?
var AutoarchiveReloadedOptions:AutoarchiveReloadedOptionsClass = new AutoarchiveReloadedOptionsClass();