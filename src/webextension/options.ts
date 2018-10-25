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

function saveOptions():void
{
  let settings:ISettings = {
    globalSettings: {
      //TODO: unsauber, wir "wissen", dass es der richtige Wert sein muss
      archiveType: $("[name=archiveType]:checked").val() as ArchiveType,
      enableInfoLogging: (<HTMLInputElement>document.getElementById("enableInfoLogging")).checked
    },
    accountSettings: {}
  };

  //fill the settings for all accounts
  $("#tabcontent").children().each(function(index) {
    let accountId:string = $(this).data("accountId");
    if (accountId)
    {
      settings.accountSettings[accountId] ={
        bArchiveUnread: (<HTMLInputElement>getElementForAccount(accountId, "archiveUnread")).checked,
        daysUnread: Number((<HTMLInputElement>getElementForAccount(accountId, "archiveUnreadDays")).value),
        bArchiveMarked: (<HTMLInputElement>getElementForAccount(accountId, "archiveStarred")).checked,
        daysMarked: Number((<HTMLInputElement>getElementForAccount(accountId, "archiveStarredDays")).value),
        bArchiveTagged: (<HTMLInputElement>getElementForAccount(accountId, "archiveTagged")).checked,
        daysTagged: Number((<HTMLInputElement>getElementForAccount(accountId, "archiveTaggedDays")).value),
        bArchiveOther: (<HTMLInputElement>getElementForAccount(accountId, "archiveMessages")).checked,
        daysOther: Number((<HTMLInputElement>getElementForAccount(accountId, "archiveMessagesDays")).value),
      };
    }
  });
  
  aaHelper.savePreferencesAndSendToLegacyAddOn(settings,function(){});
}

function restoreOptions() 
{
  aaHelper.loadCurrentSettings((settings:ISettings,accounts:IAccountInfo[]) => {
    (<HTMLInputElement>document.getElementById("enableInfoLogging")).checked = settings.globalSettings.enableInfoLogging;
    document.querySelectorAll<HTMLInputElement>('input[name="archiveType"]').forEach(element => {
      element.checked = (element.value == settings.globalSettings.archiveType);
    });

    //Für jeden Account die Einstellungen clonen und die gespeicherten Werte setzen
    //for (let [accountId, accountSetting] of settings.accountSettings)
    for (let accountId in settings.accountSettings)
    {
      let accountSetting = settings.accountSettings[accountId];
      //TODO: as IAccountInfo ist nicht ganz sauber, wir "wissen", dass es nicht null sein kann...
      let account:IAccountInfo = aaHelper.findAccountInfo(accounts,accountId as string) as IAccountInfo;

      cloneTemplate("§§ID§§-tab","tablist",account);
      cloneTemplate("accountContent-§§ID§§","tabcontent",account);

      //mark this element as account
      getJQueryElementForAccount(accountId,"accountContent").data("accountId",accountId);

      (<HTMLInputElement>getElementForAccount(accountId, "archiveUnread")).checked = accountSetting.bArchiveUnread;
      (<HTMLInputElement>getElementForAccount(accountId, "archiveUnreadDays")).value = accountSetting.daysUnread.toString();
      (<HTMLInputElement>getElementForAccount(accountId, "archiveStarred")).checked = accountSetting.bArchiveMarked;
      (<HTMLInputElement>getElementForAccount(accountId, "archiveStarredDays")).value = accountSetting.daysMarked.toString();
      (<HTMLInputElement>getElementForAccount(accountId, "archiveTagged")).checked = accountSetting.bArchiveTagged;
      (<HTMLInputElement>getElementForAccount(accountId, "archiveTaggedDays")).value = accountSetting.daysTagged.toString();
      (<HTMLInputElement>getElementForAccount(accountId, "archiveMessages")).checked = accountSetting.bArchiveOther;
      (<HTMLInputElement>getElementForAccount(accountId, "archiveMessagesDays")).value = accountSetting.daysOther.toString();
    };
  });
}

function getJQueryElementForAccount(accountId:string,elementId:string):JQuery
{
  let id = elementId + "-" + accountId;
  let jQueryElem = $("#" + id);
  return jQueryElem;
}

function getElementForAccount(accountId:string,elementId:string):HTMLElement
{
  return getJQueryElementForAccount(accountId,elementId)[0];
}

function cloneTemplate(cloneId:string,appendToId:string,accountInfo:IAccountInfo)
{
  let clone = $("#" + cloneId).clone(true,true);
  clone.appendTo("#" + appendToId);

  //make template visible
  clone.removeClass("d-none");

  let html = clone[0].outerHTML;
  html = html.replace(/§§ID§§/g, accountInfo.accountId);
  html = html.replace(/§§TITLE§§/g, accountInfo.accountName);
  clone[0].outerHTML = html;
}

let aaHelper:AutoarchiveReloadedWeOptionHelper = new AutoarchiveReloadedWeOptionHelper();
$(()=> {
  restoreOptions();
  $("#button").click(saveOptions);
});