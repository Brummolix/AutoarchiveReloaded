if (typeof autoarchive == "undefined") {
    var autoarchive = {};

    const nsMsgFolderFlags_Archive = 0x00004000;

    autoarchive.inboxFolders = [];
    autoarchive.messages = [];
    autoarchive.prefs = (Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).
        getBranch("extensions.autoarchive."));
    autoarchive.searchListener =
    {
        onSearchHit: function (dbHdr, folder) {
            autoarchive.messages.push(dbHdr);
        },
        onSearchDone: function (status) {
        },
        onNewSearch: function () {
        }
    };


    autoarchive.msgHdrIsArchive = function (msgHdr) {
        msgHdr.folder.getFlag(nsMsgFolderFlags_Archive);
    }

    autoarchive.getMail3Pane = function () {
        return Cc["@mozilla.org/appshell/window-mediator;1"]
            .getService(Ci.nsIWindowMediator)
            .getMostRecentWindow("mail:3pane");
    }

    autoarchive.msgHdrsArchive = function (msgHdrs) {
        var mail3PaneWindow = autoarchive.getMail3Pane();
        var batchMover = new mail3PaneWindow.BatchMessageMover();
        batchMover.archiveMessages(msgHdrs.filter(
            function (x)
                !autoarchive.msgHdrIsArchive(x) && autoarchive.getMail3Pane().getIdentityForHeader(x).archiveEnabled
        ));
    }

    autoarchive.getFolders = function (folder) {
        var isInbox = folder.getFlag(Ci.nsMsgFolderFlags.Inbox);
        if (isInbox)
            autoarchive.inboxFolders.push(folder);
        if (folder.hasSubFolders)
            for each(var folder in fixIterator(folder.subFolders, Ci.nsIMsgFolder))
        {
            autoarchive.getFolders(folder);
        }
    }

    autoarchive.archivate = function () {
        for each(var account in fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount))
        {
            autoarchive.getFolders(account.incomingServer.rootFolder);
        }

        for each(folder in autoarchive.inboxFolders)
        {
            var searchSession = Cc["@mozilla.org/messenger/searchSession;1"]
                .createInstance(Ci.nsIMsgSearchSession);
            searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

            var searchByAge = searchSession.createTerm();
            searchByAge.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
            var value = searchByAge.value;
            value.attrib = Ci.nsMsgSearchAttrib.AgeInDays;
            if (autoarchive.prefs.getIntPref("ageInDays") > 0)
                value.age = autoarchive.prefs.getIntPref("ageInDays");
            else
                value.age = 21;
            searchByAge.value = value;
            searchByAge.op = Ci.nsMsgSearchOp.IsGreaterThan;
            searchByAge.booleanAnd = true;
            searchSession.appendTerm(searchByAge);

            if (!autoarchive.prefs.getBoolPref("archiveMarked")) {
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
            }

            searchSession.registerListener(autoarchive.searchListener);
            searchSession.search(null);
        }

        if (autoarchive.messages.length > 0)
            autoarchive.msgHdrsArchive(autoarchive.messages);
    }

    autoarchive.init = function () {
        window.setTimeout(function () {
            autoarchive.archivate();
        }, 10000);
        window.setInterval(function () {
            autoarchive.archivate();
        }, 86400000);
    }

    autoarchive.init();
}