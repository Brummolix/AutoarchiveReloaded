"use strict";
if (typeof autoarchive == "undefined")
{
	var autoarchive = 
	{
		nsIAP: Components.interfaces.nsIActivityProcess,
		nsIAM: Components.interfaces.nsIActivityManager,
		nsIAE: Components.interfaces.nsIActivityEvent,

		startActivity: function (folder)
		{
			let gActivityManager = Components.classes["@mozilla.org/activity-manager;1"].getService(autoarchive.nsIAM);
			let process = Components.classes["@mozilla.org/activity-process;1"].createInstance(autoarchive.nsIAP);

			process.init("Archiving folder: " + folder.prettiestName, null);
			process.contextType = "account"; // group this activity by account
			process.contextObj = folder.server; // account in question

			gActivityManager.addActivity(process);
			return process;
		},

		stopActivity: function (folder, process, actual)
		{
			let gActivityManager = Components.classes["@mozilla.org/activity-manager;1"].getService(autoarchive.nsIAM);
			process.state = Components.interfaces.nsIActivityProcess.STATE_COMPLETED;
			gActivityManager.removeActivity(process.id);

			if (typeof actual == "string" || actual > 0)
			{
				let event = Components.classes["@mozilla.org/activity-event;1"].createInstance(autoarchive.nsIAE);
				event.init(folder.prettiestName + " is archived.",
					null,
					"Archiving " + actual + " messages.",
					process.startTime, // start time
					Date.now() // completion time
				);

				event.contextType = process.contextType; // optional
				event.contextObj = process.contextObj; // optional
				gActivityManager.addActivity(event);
			}
		},

		getMail3Pane: function ()
		{
			return Cc["@mozilla.org/appshell/window-mediator;1"]
				.getService(Ci.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");
		},

		/*
		prefs: (Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService).
		getBranch("extensions.autoarchive.")),
		*/
		accounts: fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount),

		searchListener: function (folder, activity)
		{
			this.messages = [];
			this.folder = folder;
			this.activity = activity;

			this.msgHdrsArchive = function()
			{
				var mail3PaneWindow = autoarchive.getMail3Pane();
				var batchMover = new mail3PaneWindow.BatchMessageMover();
				
				try
				{
					batchMover.archiveMessages(this.messages);
					return this.messages.length;
				}
				catch (e)
				{ 
					//if no Mail3Pane?
					Components.utils.reportError("Error during archive messages in folder " + this.folder.name + ". Error: " + e + ". mail3PaneWindow = " + mail3PaneWindow);
					return "? (error occured)";
				}
			};
			
			//collect all messages
			this.onSearchHit = function (dbHdr, folder)
			{
				try
				{
					//TODO: actual it is not clear how to get the archiveEnabled for the identity in the beginning and not for every message
					if (autoarchive.getMail3Pane().getIdentityForHeader(dbHdr).archiveEnabled)
					{
						autoarchive.logToConsole("found " + dbHdr.subject);
						this.messages.push(dbHdr);
					}
				}
				catch (e)
				{ 
					//Mail3Pane?
					Components.utils.reportError("Error during checking for archive messages in folder " + folder.name + ". Error: " + e);
				}
			};

			//after the search was done, archive all messages
			this.onSearchDone = function (status)
			{
				var actual = 0;
				if (this.messages.length > 0)
					actual = this.msgHdrsArchive();
				if (this.activity != null)
					autoarchive.stopActivity(folder, activity, actual);
			};

			this.onNewSearch = function () {};
		},

		//determine all folders (recursive, starting with param folder), which we want to archive
		//write output to inboxFolders array
		getFolders: function (folder, inboxFolders)
		{
			try
			{
				//attention do not try to get the folderURL for IMAP account (it crashes or may crash)
			
				//Do not archive some special folders (and also no subfolders in there)
				//Inbox - yes
				//SentMail - yes, sure
				//Drafts - no, because you want to send them?
				//Trash - no, trash is trash
				//Templates - no, because you want to use it
				//Junk - no junk is junk
				//Archive - no, we do archive
				//Queue - no, must be sent?
				if (folder.getFlag(Ci.nsMsgFolderFlags.Trash) || folder.getFlag(Ci.nsMsgFolderFlags.Junk) 
				    || folder.getFlag(Ci.nsMsgFolderFlags.Queue) || folder.getFlag(Ci.nsMsgFolderFlags.Drafts) 
					|| folder.getFlag(Ci.nsMsgFolderFlags.Templates) || folder.getFlag(Ci.nsMsgFolderFlags.Archive) )
					return;
					
				//a Feed account (RSS Feeds) will be listed here, but it is kicked out later because it does not have archive options...
				
				inboxFolders.push(folder);

				if (folder.hasSubFolders)
				{
					for each(var subFolder in fixIterator(folder.subFolders, Ci.nsIMsgFolder))
					{
						autoarchive.getFolders(subFolder, inboxFolders);
					}
				}
			}
			catch (e)
			{
				//TODO: crashes for IRC account > Fehler: Error check folder: IRC - testsdasdasdasdasd@chat.freenode.net name[Exception... "'JavaScript component does not have a method named: "getFlag"' when calling method: [nsIMsgFolder::getFlag]"  nsresult: "0x80570030 (NS_ERROR_XPC_JSOBJECT_HAS_NO_FUNCTION_NAMED)"  location: "JS frame :: chrome://autoarchive/content/overlay.js :: autoarchive.getFolders :: line 132"  data: no]
				Components.utils.reportError("Error check folder: " + folder.name + e);
			}
		},

		doArchive: function (age, folder, type)
		{
			autoarchive.logToConsole("start archiving  " + folder.prettiestName);
	
			//build a search for the messages to archive
			var searchSession = Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession);
			searchSession.addScopeTerm(Ci.nsMsgSearchScope.offlineMail, folder);

			//attention: the strange value copy syntax is needed
			
			//AgeInDays > age
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

			//TODO: why is activity only for one type?
			//TODO: change names of type
			
			if (type == 0) //"unmarked messages"
			{
				autoarchive.logToConsole("unmarked messages");
				activity = autoarchive.startActivity(folder);

				//no keywords
				searchSession.appendTerm(this.getKeywordSearchTerm(searchSession,false));

				//MsgStatus not marked
				searchSession.appendTerm(this.getMarkedSearchTerm(searchSession,false));
			}
			else if (type == 1) //"starred messages" (marked with a star)
			{
				autoarchive.logToConsole("starred messages");
				//MsgStatus marked
				searchSession.appendTerm(this.getMarkedSearchTerm(searchSession,true));
			}
			else if (type == 2) //"tagged messages"
			{
				autoarchive.logToConsole("tagged messages");
				//has keywords
				searchSession.appendTerm(this.getKeywordSearchTerm(searchSession,true));

				//MsgStatus not marked
				searchSession.appendTerm(this.getMarkedSearchTerm(searchSession,false));
			}

			//the real archiving is done on the searchListener
			searchSession.registerListener(new autoarchive.searchListener(folder, activity));
			searchSession.search(null);
		},
		
		getKeywordSearchTerm: function (searchSession,searchForNonEmptyKeywords)
		{
			var searchByTags = searchSession.createTerm();
			searchByTags.attrib = Ci.nsMsgSearchAttrib.Keywords;
			var value = searchByTags.value;
			value.attrib = Ci.nsMsgSearchAttrib.Keywords;
			searchByTags.value = value;
			if (searchForNonEmptyKeywords)
				searchByTags.op = Ci.nsMsgSearchOp.IsntEmpty;
			else
				searchByTags.op = Ci.nsMsgSearchOp.IsEmpty;
			searchByTags.booleanAnd = true;
			return searchByTags;
		},
		
		getMarkedSearchTerm: function (searchSession,searchForMarked)
		{
			var searchByLabel = searchSession.createTerm();
			searchByLabel.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
			var value = searchByLabel.value;
			value.attrib = Ci.nsMsgSearchAttrib.MsgStatus;
			value.status = Ci.nsMsgMessageFlags.Marked;
			searchByLabel.value = value;
			if (searchForMarked)
				searchByLabel.op = Ci.nsMsgSearchOp.Is;
			else
				searchByLabel.op = Ci.nsMsgSearchOp.Isnt;
			searchByLabel.booleanAnd = true;
			return searchByLabel;
		},

		//archive messages for all accounts
		//(depending on the autoarchive options of the account)
		archive: function ()
		{
			for each(var account in autoarchive.accounts)
			{
				var inboxFolders = [];
				autoarchive.getFolders(account.incomingServer.rootFolder, inboxFolders);
				for each(var folder in inboxFolders)
				{
					//autoarchive.logToConsole("archive  " + folder.prettiestName);

					//TODO: maybe rename option values?
					if (account.incomingServer.getBoolValue("archiveMessages"))
						autoarchive.doArchive(account.incomingServer.getIntValue("archiveMessagesDays"), folder, 0);
					if (account.incomingServer.getBoolValue("archiveStarred"))
						autoarchive.doArchive(account.incomingServer.getIntValue("archiveStarredDays"), folder, 1);
					if (account.incomingServer.getBoolValue("archiveTagged"))
						autoarchive.doArchive(account.incomingServer.getIntValue("archiveTaggedDays"), folder, 2);
				}
			}
		},

		init: function ()
		{
			autoarchive.logToConsole("init");

			window.setTimeout(function ()
			{
				autoarchive.archive();
			}, 10000);
			window.setInterval(function ()
			{
				autoarchive.archive();
			}, 86400000);
		},

		logToConsole: function (str)
		{
			Application.console.log("AUTOARCHIVER: " + str);
		}
	};

	autoarchive.init();
}