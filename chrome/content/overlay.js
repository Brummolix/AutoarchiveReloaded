"use strict";
if (typeof autoarchive == "undefined") {

  var autoarchive = {
    nsMsgFolderFlags_Archive : 0x00004000,
	
    nsIAP : Components.interfaces.nsIActivityProcess,
	nsIAM : Components.interfaces.nsIActivityManager,
    nsIAE : Components.interfaces.nsIActivityEvent,

    startActivity : function (folder) 
	{
      let gActivityManager = Components.classes["@mozilla.org/activity-manager;1"].getService(autoarchive.nsIAM);
      let process = Components.classes["@mozilla.org/activity-process;1"].createInstance(autoarchive.nsIAP);

      process.init("Archiving folder: " + folder.prettiestName, null);
      process.contextType = "account";     // group this activity by account
      process.contextObj = folder.server;  // account in question

      gActivityManager.addActivity(process);
      return process;
    } ,

    stopActivity : function (folder, process, actual) 
	{
      let gActivityManager = Components.classes["@mozilla.org/activity-manager;1"].getService(autoarchive.nsIAM);
      process.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
      gActivityManager.removeActivity(process.id);

      if (typeof actual == "string" || actual > 0) {
        let event = Components.classes["@mozilla.org/activity-event;1"].createInstance(autoarchive.nsIAE);
        event.init(folder.prettiestName + " is archived.",
                   null,
                   "Archiving " + actual + " messages.",
                   process.startTime, // start time
                   Date.now()          // completion time
        );

        event.contextType = process.contextType; // optional
        event.contextObj = process.contextObj;   // optional
        gActivityManager.addActivity(event);
      }
    },

    msgHdrIsArchive: function (msgHdr) {
      msgHdr.folder.getFlag(autoarchive.nsMsgFolderFlags_Archive);
    } ,

    getMail3Pane: function () {
      return Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow("mail:3pane");
    } ,

	/*
	prefs: (Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService).
		getBranch("extensions.autoarchive.")),
	*/
    accounts : fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount),

    searchListener : function(folder, activity) {
      this.messages = [];
      this.folder = folder;
      this.activity = activity;

      this.msgHdrsArchive = function (msgHdrs) {
        var mail3PaneWindow = autoarchive.getMail3Pane();
        var batchMover = new mail3PaneWindow.BatchMessageMover();
        var filter = msgHdrs.filter(
          function (x)
            !autoarchive.msgHdrIsArchive(x) && autoarchive.getMail3Pane().getIdentityForHeader(x).archiveEnabled
        );

        try {
          batchMover.archiveMessages(filter);
          return filter.length;
        } catch(e) {  //if no Mail3Pane
          Components.utils.reportError(
            "Error during archive messages in folder " + msgHdrs[0].folder.name +
              ". Error: " + e + ". mail3PaneWindow = " + mail3PaneWindow
          );
          return "0 (error occurs)";
        }
      };
      this.onSearchHit = function (dbHdr, folder) {
        this.messages.push(dbHdr);
      };

      this.onSearchDone = function (status) {
        var actual = 0;
        if (this.messages.length > 0)
          actual = this.msgHdrsArchive(this.messages);
        if (this.activity != null)
          autoarchive.stopActivity(folder, activity, actual);
      };

      this.onNewSearch = function () {
      };
    } ,
	
    getFolders:function (folder, inboxFolders) {
      try {
        var isInbox = folder.getFlag(Ci.nsMsgFolderFlags.ImapBox) && !folder.getFlag(Ci.nsMsgFolderFlags.Trash);
        if (isInbox) {
          inboxFolders.push(folder);
        }
        if (folder.hasSubFolders)
          for each(var subFolder in fixIterator(folder.subFolders, Ci.nsIMsgFolder)) {
            autoarchive.getFolders(subFolder, inboxFolders);
          }
      } catch(e) {
        Components.utils.reportError("Error check folder: " + folder.name + e);
      }
    } ,

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

      var activity = null;
	  
      if (type == 0) 
	  {

        activity = autoarchive.startActivity(folder);

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

      searchSession.registerListener(new autoarchive.searchListener(folder, activity));
      searchSession.search(null);
    } ,

    archive:function () {
      for each(var account in autoarchive.accounts) 
	  {
        var inboxFolders = [];
        autoarchive.getFolders(account.incomingServer.rootFolder, inboxFolders);
        for each(var folder in inboxFolders) 
		{
          if (account.incomingServer.getBoolValue("archiveMessages"))
            autoarchive.doArchive(account.incomingServer.getIntValue("archiveMessagesDays"), folder, 0);
          if (account.incomingServer.getBoolValue("archiveStarred"))
            autoarchive.doArchive(account.incomingServer.getIntValue("archiveStarredDays"), folder, 1);
          if (account.incomingServer.getBoolValue("archiveTagged"))
            autoarchive.doArchive(account.incomingServer.getIntValue("archiveTaggedDays"), folder, 2);
        }
      }
    } ,

    init:function () {
		autoarchive.logToConsole("init");

      window.setTimeout( function () {
          autoarchive.archive();
        }, 10000);
        window.setInterval(function () {
          autoarchive.archive();
        },86400000);
    },

	logToConsole:function(str)
	{
		Application.console.log("AUTOARCHIVER: " + str);  
	}
  };

  autoarchive.init();
}