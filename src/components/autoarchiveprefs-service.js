/*
Copyright 2013-2014 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
Copyright 2012 Alexey Egorov (original version Autoarchive, http://code.google.com/p/autoarchive/ )

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

"use strict";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function AutoarchiveManagerExtension() 
{
}

AutoarchiveManagerExtension.prototype = 
{
    name:"autoarchiveprefs",
    chromePackageName:'autoarchiveReloaded',
    classID:Components.ID("{ac4f0da9-5240-487e-992c-7cf3c622a9ad}"),
    classDescription:"Autoarchive Account Manager Extension Service",
    contractID:"@mozilla.org/accountmanager/extension;1?name=autoarchiveprefs",
    _xpcom_categories:[
        {
            category:"mailnews-accountmanager-extensions"
        }
    ],
    showPanel:function (server) 
	{
		return true;
    },
    QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIMsgAccountManagerExtension])
};

if (XPCOMUtils.generateNSGetFactory) 
{
    // Gecko >= 2.0
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([AutoarchiveManagerExtension]);
}
else 
{
    // Gecko <= 1.9.x
    var NSGetModule = XPCOMUtils.generateNSGetModule([AutoarchiveManagerExtension], postModuleRegisterCallback);

}

function postModuleRegisterCallback (compMgr, fileSpec, componentsArray) 
{
    dump("Autoarchive account manager extension registered\n");
}
