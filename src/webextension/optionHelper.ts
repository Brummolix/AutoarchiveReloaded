/*!
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

class AutoarchiveReloadedWeOptionHelper
{
    sendCurrentPreferencesToLegacyAddOn (onSuccess:() => void):void
    {
        this.loadCurrentSettings(function(settings:ISettings)
        {
            let message:IBrowserMessageSendCurrentSettings = {
                id: "sendCurrentPreferencesToLegacyAddOn",
                data: settings
            }

            browser.runtime.sendMessage(message).then((reply:any) => {
                onSuccess();
                });
        });
    }

    loadCurrentSettings (onSuccesfulDone:(settings:ISettings,accounts:IAccountInfo[] )=> void)
    {
        console.log("loadCurrentSettings");

        let message:IBrowserMessage = {
            id: "askForAccounts",
        }

        browser.runtime.sendMessage(message).then((accounts:IAccountInfo[]) => {
            browser.storage.local.get("settings").then((result:any)  => {
                
                //settings read succesfully...
                let oHandling:AutoarchiveReloadedOptionHandling = new AutoarchiveReloadedOptionHandling();
                let settings:ISettings = oHandling.convertPartialSettings(result.settings);

                //every existing account should have a setting
                accounts.forEach(account => {
                    let accountSetting = settings.accountSettings[account.accountId];
                    if (accountSetting==undefined)
                        settings.accountSettings[account.accountId] = oHandling.getDefaultAccountSettings();
                });

                //no other account should be there
                for (let accountId in settings.accountSettings)
                {
                    if (this.findAccountInfo(accounts,accountId) == null)
                        delete settings.accountSettings[accountId];
                }

                onSuccesfulDone(settings,accounts);
            },function(error:string)
            {
                //error while reading settings
                //TODO: error? log
                console.log(`Error: ${error}`);
            });
        });
    }

    findAccountInfo(accountSettings:IAccountInfo[],id:string):IAccountInfo | null
    {
        for (let accountSetting of accountSettings) 
        {
            if (accountSetting.accountId == id)
                return accountSetting;
        }

        return null;
    }

    convertLegacyPreferences ():void
    {
        let message:IBrowserMessage = {
            id: "askForLegacyPreferences",
        }

        browser.runtime.sendMessage(message).then((settings:ISettings):void => {
            if (settings)
            {
                this.savePreferencesAndSendToLegacyAddOn(settings, ():void => {
                    this.OnWebExtensionStartupDone();
                });
            }
            else
            {
                this.sendCurrentPreferencesToLegacyAddOn(():void => {
                    this.OnWebExtensionStartupDone();
                });
            }
        });
    }

    private OnWebExtensionStartupDone():void
    {
        let message:IBrowserMessage = {
            id: "webExtensionStartupDone",
        }
        browser.runtime.sendMessage(message).then((reply:any) => {});
    }

    savePreferencesAndSendToLegacyAddOn(settings:ISettings,onSuccess:() => void):void
    {
        //TODO: sometimes we get "Error: WebExtension context not found!"
        //why?
        browser.storage.local.set({settings: settings}).then(() => {
            //settings written sucesfully
            this.sendCurrentPreferencesToLegacyAddOn(onSuccess);
        },function (error:string){
            //error while writing settings
            //TODO: error? log
            console.log(`Error: ${error}`);
        });
    }
 }