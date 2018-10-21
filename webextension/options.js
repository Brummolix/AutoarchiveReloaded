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

function saveOptions(e) {

  //TODO: Für alle accounts die Einstellungen holen und speichern (sowie zurückgeben)

  var settings = {
    archiveType: document.querySelector('input[name="archiveType"]:checked').value,
    enableInfoLogging: document.getElementById("enableInfoLogging").checked
  };

  AutoarchiveReloadedWeOptionHelper.savePreferencesAndSendToLegacyAddOn(settings,function(){});
}

function restoreOptions() 
{
  //TODO: Für jeden (sinnvollen) Account die Einstellungen clonen und die gespeicherten Werte setzen


  cloneTemplate("§§ID§§-tab","tablist")
  cloneTemplate("§§ID§§-content","tabcontent")

  AutoarchiveReloadedWeOptionHelper.loadCurrentSettings(function(settings){
    document.getElementById("enableInfoLogging").checked = settings.enableInfoLogging;
    document.querySelectorAll('input[name="archiveType"]').forEach(element => {
      element.checked = (element.value == settings.archiveType);
    });
  });
}

function cloneTemplate(cloneId,appendToId)
{
  var clone = $("#" + cloneId).clone(true,true);
  clone.appendTo("#" + appendToId);

  //make template visible
  clone.removeClass("d-none");

  var html = clone[0].outerHTML;
  html = html.replace(/§§ID§§/g, "HelloWorldId");
  html = html.replace(/§§TITLE§§/g, "Hello World");
  clone[0].outerHTML = html;
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("button").addEventListener("click",saveOptions);