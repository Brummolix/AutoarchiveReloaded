"use strict";
if (typeof autoarchive == "undefined") {

    var autoarchive = {
        nsMsgFolderFlags_Archive: 0x00004000,
        msgHdrIsArchive: function (msgHdr) {
            msgHdr.folder.getFlag(autoarchive.nsMsgFolderFlags_Archive);
        },

        getMail3Pane: function () {
            return Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator)
                .getMostRecentWindow("mail:3pane");
        },
        inboxFolders:[],
        prefs: (Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefService).
            getBranch("extensions.autoarchive.")),
        accounts: fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount),
        searchListener: function() {
            this.messages = [];
            this.msgHdrsArchive = function (msgHdrs) {
                var mail3PaneWindow = autoarchive.getMail3Pane();
                var batchMover = new mail3PaneWindow.BatchMessageMover();
                batchMover.archiveMessages(msgHdrs.filter(
                    function (x)
                        !autoarchive.msgHdrIsArchive(x) && autoarchive.getMail3Pane().getIdentityForHeader(x).archiveEnabled
                ));
            };
            this.onSearchHit = function (dbHdr, folder) {
                this.messages.push(dbHdr);
            };
            this.onSearchDone = function (status) {
                if (this.messages.length > 0)
                    this.msgHdrsArchive(this.messages);
            };
            this.onNewSearch = function () {
            };
        },

        getFolders:function (folder) {
            var isInbox = folder.getFlag(Ci.nsMsgFolderFlags.Inbox);
            if (isInbox)
                autoarchive.inboxFolders.push(folder);
            if (folder.hasSubFolders)
                for each(var folder in fixIterator(folder.subFolders, Ci.nsIMsgFolder))
            {
                autoarchive.getFolders(folder);
            }
        },

        doArchive:function(age, folder, type) {
            var searchSession = Cc["@mozilla.org/messenger/searchSession;1"]
                .createInstance(Ci.nsIMsgSearchSession);
            searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

            var searchByAge = searchSession.createTerm();
            searchByAge.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
            var value = searchByAge.value;
            value.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
            value.age = age;
            searchByAge.value = value;
            searchByAge.op = Ci.nsMsgSearchOp.IsGreaterThan;
            searchByAge.booleanAnd = true;
            searchSession.appendTerm(searchByAge);

            if (type == 0)
            {
                var searchByTags = searchSession.createTerm();
                searchByTags.attrib = Ci.nsMsgSearchAttrib.Keywords;
                var value = searchByTags.value;
                value.attrib = Ci.nsMsgSearchAttrib.Keywords;
                searchByTags.value = value;
                searchByTags.op = Ci.nsMsgSearchOp.IsEmpty;
                searchByTags.booleanAnd = true;
                searchSession.appendTerm(searchByTags);

                var searchByLabel = searchSession.createTerm();
                searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                var value = searchByLabel.value;
                value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                value.status = Ci.nsMsgMessageFlags.Marked;
                searchByLabel.value = value;
                searchByLabel.op = Ci.nsMsgSearchOp.Isnt;
                searchByLabel.booleanAnd = true;
                searchSession.appendTerm(searchByLabel);
            } else if (type == 1)
            {
                var searchByLabel = searchSession.createTerm();
                searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                var value = searchByLabel.value;
                value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                value.status = Ci.nsMsgMessageFlags.Marked;
                searchByLabel.value = value;
                searchByLabel.op = Ci.nsMsgSearchOp.Is;
                searchByLabel.booleanAnd = true;
                searchSession.appendTerm(searchByLabel);
            } else if (type == 2)
            {
                var searchByTags = searchSession.createTerm();
                searchByTags.attrib = Ci.nsMsgSearchAttrib.Keywords;
                var value = searchByTags.value;
                value.attrib = Ci.nsMsgSearchAttrib.Keywords;
                searchByTags.value = value;
                searchByTags.op = Ci.nsMsgSearchOp.IsntEmpty;
                searchByTags.booleanAnd = true;
                searchSession.appendTerm(searchByTags);

                var searchByLabel = searchSession.createTerm();
                searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                var value = searchByLabel.value;
                value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
                value.status = Ci.nsMsgMessageFlags.Marked;
                searchByLabel.value = value;
                searchByLabel.op = Ci.nsMsgSearchOp.Isnt;
                searchByLabel.booleanAnd = true;
                searchSession.appendTerm(searchByLabel);
            }

            searchSession.registerListener(new autoarchive.searchListener());
            searchSession.search(null);
        },

        archive:function () {
            for each(var account in autoarchive.accounts)
            {
                autoarchive.inboxFolders = [];
                autoarchive.getFolders(account.incomingServer.rootFolder);
                for each(var folder in autoarchive.inboxFolders)
                {
                    if (account.incomingServer.getBoolValue("archiveMessages"))
                        autoarchive.doArchive(account.incomingServer.getIntValue("archiveMessagesDays"), folder, 0);
                    if (account.incomingServer.getBoolValue("archiveStarred"))
                        autoarchive.doArchive(account.incomingServer.getIntValue("archiveStarredDays"), folder, 1);
                    if (account.incomingServer.getBoolValue("archiveTagged"))
                        autoarchive.doArchive(account.incomingServer.getIntValue("archiveTaggedDays"), folder, 2);
                }
            }
        },

        init:function () {
            window.setTimeout(function () {
                autoarchive.archive();
            }, 10000);
            window.setInterval(function () {
                autoarchive.archive();
            }, 86400000);
        }
    }

    autoarchive.init();
}