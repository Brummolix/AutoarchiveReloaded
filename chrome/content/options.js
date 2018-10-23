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

function AutoarchiveReloadedOptionsClass()
{
    this.settings = {};

    //return null if already migrated or no settings!
    this.getLegacyOptions = function ()
    {
        var prefBranch = this.getInternalLegacyPrefBranch();
        var aChildArray = prefBranch.getChildList("", {});

        //TODO: this test is not sufficient, even if no global options are available there could be account settings...
        if (aChildArray.length==0)
            return null;

        if (prefBranch.getBoolPref("preferencesAlreadyMigrated",false))
            return null;

        var legacySettings = {
            globalSettings: {
                archiveType: prefBranch.getCharPref("archiveType","manual"),
                enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging",false)
            },

            accountSettings : []
        };

        //TODO: get real data
        var accountSetting = {
            accountId: "account1",
            accountName: "testaccount 1",
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
        var accountSetting2 = {
            accountId: "account2",
            accountName: "testaccount 2",
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
    };

    this.markLegacySettingsAsMigrated = function()
    {
        this.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
    };

    this.getInternalLegacyPrefBranch = function()
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        return prefs.getBranch("extensions.AutoarchiveReloaded.");
    };
}

var AutoarchiveReloadedOptions = AutoarchiveReloadedOptions || new AutoarchiveReloadedOptionsClass();