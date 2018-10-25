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
                console.log("loadCurrentSettings fine " + result.settings);
                //settings read succesfully...
                let settings:ISettings = result.setting as ISettings;
                //defaults
                let defaultSettings = this.getDefaultSettings();
                if (settings == undefined)
                    settings = defaultSettings;
                if (settings.globalSettings == undefined)
                    settings.globalSettings = this.getDefaultGlobalSettings();
                if (settings.globalSettings.archiveType == undefined)
                    settings.globalSettings.archiveType = defaultSettings.globalSettings.archiveType;
                if (settings.globalSettings.enableInfoLogging == undefined)
                    settings.globalSettings.enableInfoLogging = defaultSettings.globalSettings.enableInfoLogging;

                //handle accounts
                if (settings.accountSettings == undefined)
                    settings.accountSettings = [];

                //defaults
                accounts.forEach(account => {
                    let accountSetting = this.findAccountSettingOrInfo(settings.accountSettings,account.accountId);
                    if (accountSetting==null)
                    {
                        settings.accountSettings.push({
                            accountId: account.accountId,
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

                    //TODO: a value could still be undefined (if we create a new one!)
                });

                //remove setting of deleted accounts
                for (let n:number=0;n<settings.accountSettings.length;n++)
                {
                    if (this.findAccountSettingOrInfo(accounts,settings.accountSettings[n].accountId) == null)
                    {
                        settings.accountSettings.splice(n, 1);
                        n--;
                    }
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

    findAccountSettingOrInfo<T extends IAccountSettings|IAccountInfo>(accountSettings:T[],id:string):T | null
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

    OnWebExtensionStartupDone():void
    {
        let message:IBrowserMessage = {
            id: "webExtensionStartupDone",
        }
        browser.runtime.sendMessage(message).then((reply:any) => {});
    }

    savePreferencesAndSendToLegacyAddOn(data:ISettings,onSuccess:() => void):void
    {
        browser.storage.local.set({settings: data}).then(() => {
            //settings written sucesfully
            this.sendCurrentPreferencesToLegacyAddOn(onSuccess);
        },function (error:string){
            //error while writing settings
            //TODO: error? log
            console.log(`Error: ${error}`);
        });
    }
    
    getDefaultSettings():ISettings
    {
        return {
            globalSettings:this.getDefaultGlobalSettings(),
            accountSettings:[]
        };
    }

    getDefaultGlobalSettings():IGlobalSettings
    {
        return {
            archiveType: "manual",
            enableInfoLogging: false
        };
    }

}