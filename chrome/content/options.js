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

var AutoarchiveReloadedOptions = AutoarchiveReloadedOptions || {};

    AutoarchiveReloadedOptions.settings = {};

    //return null if already migrated or no settings!
    AutoarchiveReloadedOptions.getLegacyOptions = function ()
    {
        var prefBranch = AutoarchiveReloadedOptions.getInternalLegacyPrefBranch();
        var aChildArray = prefBranch.getChildList("", {});

        if (aChildArray.length==0)
            return null;

        if (prefBranch.getBoolPref("preferencesAlreadyMigrated",false))
            return null;

        var settings = {
            archiveType: prefBranch.getCharPref("archiveType","manual"),
            enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging",false)
        }

        return settings;
    }

    AutoarchiveReloadedOptions.markLegacySettingsAsMigrated = function()
    {
        AutoarchiveReloadedOptions.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
    }

    AutoarchiveReloadedOptions.getInternalLegacyPrefBranch = function()
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        return prefs.getBranch("extensions.AutoarchiveReloaded.");
    };
