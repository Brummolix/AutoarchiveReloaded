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
    autoarchiveprefs = {
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
        },
        onSave:function () {
            this.server.setBoolValue("archiveMessages", document.getElementById("archiveMessages").checked);
            this.server.setIntValue("archiveMessagesDays", document.getElementById("archiveMessagesDays").value);

            this.server.setBoolValue("archiveStarred", document.getElementById("archiveStarred").checked);
            this.server.setIntValue("archiveStarredDays", document.getElementById("archiveStarredDays").value);

            this.server.setBoolValue("archiveTagged", document.getElementById("archiveTagged").checked);
            this.server.setIntValue("archiveTaggedDays", document.getElementById("archiveTaggedDays").value);
        }
    }
}