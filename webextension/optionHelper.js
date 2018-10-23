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
    //TODO: accountName should be independent from settings (it should be not saved)
    console.log("loadCurrentSettings");

    var message = {
        id: "askForAccounts",
    }

    browser.runtime.sendMessage(message).then(accounts => {
        browser.storage.local.get("settings").then(function(result){
            console.log("loadCurrentSettings fine " + result.settings);
            //settings read succesfully...

            //defaults
            if (result.settings == undefined)
                result.settings = {};
            if (result.settings.globalSettings == undefined)
                result.settings.globalSettings = {};
            if (result.settings.globalSettings.archiveType == undefined)
                result.settings.globalSettings.archiveType = "manual";
            if (result.settings.globalSettings.enableInfoLogging == undefined)
                result.settings.globalSettings.enableInfoLogging = false;

            //handle accounts
            if (result.settings.accountSettings == undefined)
                result.settings.accountSettings = [];

            //defaults
            accounts.forEach(account => {
                var accountSetting = findAccountSetting(result.settings.accountSettings,account.accountId);
                if (accountSetting==undefined)
                {
                    result.settings.accountSettings.push({
                        accountId: account.accountId,
                        accountName: account.accountName,
                        bArchiveOther: false,
                        daysOther: 360,
                        bArchiveMarked: false,
                        daysMarked: 360,
                        bArchiveTagged: false,
                        daysTagged: 360,
                        bArchiveUnread: false,
                        daysUnread: 360
                    });
                }
            });

            //remove setting of deleted accounts
            for (var n=0;n<result.settings.accountSettings.length;n++)
            {
                if (findAccountSetting(accounts,result.settings.accountSettings[n].accountId) == undefined)
                {
                    result.settings.accountSettings.splice(n, 1);
                    n--;
                }
            }

            onSuccesfulDone(result.settings);
        },function(error)
        {
            //error while reading settings
            //TODO: error? log
            console.log(`Error: ${error}`);
        });
    });
}

function findAccountSetting(accountSettings,id)
{
    for (let accountSetting of accountSettings) 
    {
        if (accountSetting.accountId == id)
            return accountSetting;
    }

    return undefined;
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