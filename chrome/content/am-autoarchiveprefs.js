/*
Copyright 2013 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
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
function onPreInit(account, accountValues) {
    autoarchiveprefs.server = account.incomingServer;
}

function onInit(pageId, serverId) {
    autoarchiveprefs.onInit();
}

function onAcceptEditor() {
}

function onSave() {
    autoarchiveprefs.onSave();
}

function UpdatePage() {
}

if (typeof(autoarchiveprefs) == 'undefined') {
    var autoarchiveprefs = {
        server:null,
        onInit:function () {
            document.getElementById("archiveMessages").checked = this.server.getBoolValue("archiveMessages");
            document.getElementById("archiveMessagesDays").disabled = !document.getElementById("archiveMessages").checked;
            document.getElementById("archiveMessagesDays").value = this.server.getIntValue("archiveMessagesDays");

            document.getElementById("archiveStarred").checked = this.server.getBoolValue("archiveStarred");
            document.getElementById("archiveStarredDays").disabled = !document.getElementById("archiveStarred").checked;
            document.getElementById("archiveStarredDays").value = this.server.getIntValue("archiveStarredDays");

            document.getElementById("archiveTagged").checked = this.server.getBoolValue("archiveTagged");
            document.getElementById("archiveTaggedDays").disabled = !document.getElementById("archiveTagged").checked;
            document.getElementById("archiveTaggedDays").value = this.server.getIntValue("archiveTaggedDays");

            document.getElementById("archiveUnread").checked = this.server.getBoolValue("archiveUnread");
            document.getElementById("archiveUnreadDays").disabled = !document.getElementById("archiveUnread").checked;
            document.getElementById("archiveUnreadDays").value = this.server.getIntValue("archiveUnreadDays");
		},
        onSave:function () {
            this.server.setBoolValue("archiveMessages", document.getElementById("archiveMessages").checked);
            this.server.setIntValue("archiveMessagesDays", document.getElementById("archiveMessagesDays").value);

            this.server.setBoolValue("archiveStarred", document.getElementById("archiveStarred").checked);
            this.server.setIntValue("archiveStarredDays", document.getElementById("archiveStarredDays").value);

            this.server.setBoolValue("archiveTagged", document.getElementById("archiveTagged").checked);
            this.server.setIntValue("archiveTaggedDays", document.getElementById("archiveTaggedDays").value);

            this.server.setBoolValue("archiveUnread", document.getElementById("archiveUnread").checked);
            this.server.setIntValue("archiveUnreadDays", document.getElementById("archiveUnreadDays").value);
        }
    }
}