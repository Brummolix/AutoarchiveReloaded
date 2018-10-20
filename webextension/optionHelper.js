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
    'AutoarchiveReloadedWeOptionHelper'
]

var AutoarchiveReloadedWeOptionHelper = AutoarchiveReloadedWeOptionHelper || {};

AutoarchiveReloadedWeOptionHelper.sendCurrentPreferencesToLegacyAddOn = function (onSuccess)
{
    AutoarchiveReloadedWeOptionHelper.loadCurrentSettings(function(settings)
    {
        var message = {
            id: "sendCurrentPreferencesToLegacyAddOn",
            data: settings
        }

        browser.runtime.sendMessage(message).then(reply => {
            onSuccess();
            });
    });
};

AutoarchiveReloadedWeOptionHelper.loadCurrentSettings = function (onSuccesfulDone)
{
    //TODO: defaults???
    //wenn gar nichts da ist, sollten defaults bestimmt werden!

    var getting = browser.storage.local.get("settings");
    getting.then(function(result){
        //TODO: geht das auch, wenn es noch gar keine Settings gibt (z.B. bei Neuinstallation!)
        //settings read sucefully...
        onSuccesfulDone(result.settings);
    },function(error)
    {
        //error while reading settings
        //TODO: error? log
        console.log(`Error: ${error}`);
    });

}

AutoarchiveReloadedWeOptionHelper.convertLegacyPreferences = function ()
{
    var message = {
        id: "askForLegacyPreferences",
    }

    browser.runtime.sendMessage(message).then(reply => {
        if ( (reply) && reply.data )
        {
            AutoarchiveReloadedWeOptionHelper.savePreferencesAndSendToLegacyAddOn(reply.data, function(){
                AutoarchiveReloadedWeOptionHelper.OnWebExtensionStartupDone();
            });
        }
        else
        {
            AutoarchiveReloadedWeOptionHelper.sendCurrentPreferencesToLegacyAddOn(function(){
                AutoarchiveReloadedWeOptionHelper.OnWebExtensionStartupDone();
            });
        }
    });
};

AutoarchiveReloadedWeOptionHelper.OnWebExtensionStartupDone = function ()
{
    var message = {
        id: "webExtensionStartupDone",
    }
    browser.runtime.sendMessage(message).then(reply => {});
}

AutoarchiveReloadedWeOptionHelper.savePreferencesAndSendToLegacyAddOn = function (data,onSuccess)
{
    browser.storage.local.set({settings: data}).then(function (){
        //settings written sucesfully
        AutoarchiveReloadedWeOptionHelper.sendCurrentPreferencesToLegacyAddOn(onSuccess);
    },function (error){
        //error while writing settings
        //TODO: error? log
        console.log(`Error: ${error}`);
    })
}