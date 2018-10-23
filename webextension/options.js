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

function saveOptions(e) 
{
  var settings = {
    globalSettings: {
      archiveType: document.querySelector('input[name="archiveType"]:checked').value,
      enableInfoLogging: document.getElementById("enableInfoLogging").checked
    },
    accountSettings: []
  };

  //fill the settings for all accounts
  $("#tabcontent").children().each(function(index) {
    var accountId = $(this).data("accountId");
    if (accountId)
    {
      settings.accountSettings.push({
        bArchiveUnread: getElementForAccount(accountId, "archiveUnread").checked,
        daysUnread: getElementForAccount(accountId, "archiveUnreadDays").value,
        bArchiveMarked: getElementForAccount(accountId, "archiveStarred").checked,
        daysMarked: getElementForAccount(accountId, "archiveStarredDays").value,
        bArchiveTagged: getElementForAccount(accountId, "archiveTagged").checked,
        daysTagged: getElementForAccount(accountId, "archiveTaggedDays").value,
        bArchiveOther: getElementForAccount(accountId, "archiveMessages").checked,
        daysOther: getElementForAccount(accountId, "archiveMessagesDays").value,
        accountId: accountId,
      });
    }
  });
  
  AutoarchiveReloadedWeOptionHelper.savePreferencesAndSendToLegacyAddOn(settings,function(){});
}

function restoreOptions() 
{
  AutoarchiveReloadedWeOptionHelper.loadCurrentSettings(function(settings){
    document.getElementById("enableInfoLogging").checked = settings.globalSettings.enableInfoLogging;
    document.querySelectorAll('input[name="archiveType"]').forEach(element => {
      element.checked = (element.value == settings.globalSettings.archiveType);
    });

    //Für jeden Account die Einstellungen clonen und die gespeicherten Werte setzen
    settings.accountSettings.forEach(accountSetting => {
      cloneTemplate("§§ID§§-tab","tablist",accountSetting);
      cloneTemplate("accountContent-§§ID§§","tabcontent",accountSetting);

      //mark this element as account
      getJQueryElementForAccount(accountSetting.accountId,"accountContent").data("accountId",accountSetting.accountId);

      getElementForAccount(accountSetting.accountId, "archiveUnread").checked = accountSetting.bArchiveUnread;
      getElementForAccount(accountSetting.accountId, "archiveUnreadDays").value = accountSetting.daysUnread;
      getElementForAccount(accountSetting.accountId, "archiveStarred").checked = accountSetting.bArchiveMarked;
      getElementForAccount(accountSetting.accountId, "archiveStarredDays").value = accountSetting.daysMarked;
      getElementForAccount(accountSetting.accountId, "archiveTagged").checked = accountSetting.bArchiveTagged;
      getElementForAccount(accountSetting.accountId, "archiveTaggedDays").value = accountSetting.daysTagged;
      getElementForAccount(accountSetting.accountId, "archiveMessages").checked = accountSetting.bArchiveOther;
      getElementForAccount(accountSetting.accountId, "archiveMessagesDays").value = accountSetting.daysOther;
    });
  });
}

function getJQueryElementForAccount(accountId,elementId)
{
  var id = elementId + "-" + accountId;
  var jQueryElem = $("#" + id);
  return jQueryElem;
}

function getElementForAccount(accountId,elementId)
{
  return getJQueryElementForAccount(accountId,elementId)[0];
}

function cloneTemplate(cloneId,appendToId,accountSetting)
{
  var clone = $("#" + cloneId).clone(true,true);
  clone.appendTo("#" + appendToId);

  //make template visible
  clone.removeClass("d-none");

  var html = clone[0].outerHTML;
  html = html.replace(/§§ID§§/g, accountSetting.accountId);
  html = html.replace(/§§TITLE§§/g, accountSetting.accountName);
  clone[0].outerHTML = html;
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("button").addEventListener("click",saveOptions);