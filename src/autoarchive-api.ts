ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

//TODO: AutoarchiveReloadedWebextension.loggerWebExtension is not available here
//use something other? Or only do console logging? or do not log?

//Attention it HAVE TO be var, otherwise the extension api is not working
//@ts-ignore: 'autoarchive' is declared but its value is never read
//tslint:disable-next-line: no-var-keyword prefer-const
var autoarchive = class extends ExtensionCommon.ExtensionAPI {
	private bIsInToolbarCustomize: boolean = false;

	public getAPI(context: any)
	{
		return {
			autoarchive: {
				alert: async (title: string, text: string): Promise<void> =>
				{
					await this.getThePromptService().alert(null, title, text);
					//Services.wm.getMostRecentWindow("mail:3pane").alert("Hello " + name + "!");
				},
				confirm: async (title: string, text: string): Promise<boolean> =>
				{
					return await this.getThePromptService().confirm(null, title, text);
				},
				startToArchiveMessages: async (messageIds: number[]): Promise<number> =>
				{
					return this._startToArchiveMessages(messageIds);
				},
				initToolbarConfigurationObserver: (): void =>
				{
					console.log("initToolbarConfigurationObserver");
					this.registerToolbarCustomizationListener(this.getMail3Pane());
				},
				//normally it did not have to be async, but the return value did not work in this case
				isToolbarConfigurationOpen: async (): Promise<boolean> =>
				{
					console.log("isToolbarConfigurationOpen " + this.bIsInToolbarCustomize);
					return this.bIsInToolbarCustomize;
				},
			},
		};
	}

	private getThePromptService(): Ci.nsIPromptService
	{
		return Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
	}

	private _startToArchiveMessages(messageIds: number[]): number
	{
		console.log("startToArchiveMessages");

		const mail3PaneWindow: Mail3Pane = this.getMail3Pane();
		console.log(mail3PaneWindow);

		//TODO: how to translate a webapi message into nsIMsgDBHdr (or the folders?)
		//see https://groups.google.com/forum/#!topic/mozilla.dev.apps.thunderbird/zI_3yBYLiCM
		//see https://bugzilla.mozilla.org/show_bug.cgi?id=1530606

		//TODO: or do we have to do *everything* in web experiment :(
		/*
		for (const messageId of messageIds) {
			const msgHdr: any = messageTracker.getMessage(messageId);
			console.log(msgHdr);
		}
		*/

		//https://hg.mozilla.org/comm-central/file/tip/mail/components/extensions/parent/ext-messages.js
		//messageTracker ist in https://hg.mozilla.org/comm-central/file/tip/mail/components/extensions/parent/ext-mail.js
		//TODO: wie kommt man da ran?

		/*
		//TB jumps to the end (after finishing the archiving) if no message is selected
		//> select the first message (unfortunately it will become unread...)
		//(but only select the first message if the messages being archived are from the current folder)
		if (messages.length > 0)
		{
			if (messages[0].folder === mail3PaneWindow.gFolderDisplay.displayedFolder)
			{
				if (mail3PaneWindow.gFolderDisplay.selectedCount <= 0)
				{
					mail3PaneWindow.gFolderDisplay.navigate(Components.interfaces.nsMsgNavigationType.firstMessage);
				}
			}
		}

		const batchMover: Ci.BatchMessageMover = new mail3PaneWindow.BatchMessageMover();

		//There are several issues with "this.view.dbView is null" inside "chrome://messenger/content/folderDisplay.js", 1359
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/1
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/5
		//see https://github.com/Brummolix/AutoarchiveReloaded/issues/7
		//something is wrong inside the TB stuff at this moment
		//the null pointer exception is described here: https://bugzilla.mozilla.org/show_bug.cgi?id=978559 but the Mozilla guys have not done anything about it until now
		//
		//one reason is, if no folder is selected (for example if the account is selected only)
		//therefore we try to select some folder if we find the dbView is null
		if (mail3PaneWindow.gFolderDisplay)
		{
			if (mail3PaneWindow.gFolderDisplay.view)
			{
				if (!mail3PaneWindow.gFolderDisplay.view.dbView)
				{
					AutoarchiveReloadedWebextension.loggerWebExtension.info("mail3PaneWindow.gFolderDisplay.dbView is null > batchMessageMover will not work");
					const folderToSelect = this.folder;
					if (folderToSelect)
					{
						AutoarchiveReloadedWebextension.loggerWebExtension.info("> try to select folder " + folderToSelect.name + " " + folderToSelect.URI);
						//When extension TorBirdy was installed gFolderTreeView.selectFolder did not work.
						//gFolderDisplay.show worked with and without TorBirdy.
						mail3PaneWindow.gFolderDisplay.show(folderToSelect);
					}
				}
			}
		}

		//TODO: do not archive if a imap server is offline (otherwise the archive is done locally but not on the server, if you start next time (and you are online) it may be archived again
		//-> problem: how to detect imap server problems/problems with i-net connection? (we do not talk about online/offline mode here which you can handle with  MailOfflineMgr!)
		//I have also reported the real bug to TB: see https://bugzilla.mozilla.org/show_bug.cgi?id=956598

		batchMover.archiveMessages(messages);
		*/

		return messageIds.length;
	}

	private getMail3Pane(): Mail3Pane
	{
		return Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator)
			.getMostRecentWindow("mail:3pane");
	}

	private registerToolbarCustomizationListener(window: Window): void
	{
		console.log("registerToolbarCustomizationListener");
		if (!window)
		{
			return;
		}

		console.log("registerToolbarCustomizationListener add events");

		window.addEventListener("aftercustomization", this.afterCustomize);
		window.addEventListener("beforecustomization", this.beforeCustomize);
	}

	//TODO: how to remove?
	//event is still registered after AddOn is deactivated
	//if AddOn is reactivated, 2 listners are registered
	//- using browser.runtime.onSuspend in background script did not work, onSuspend does not exist
	//- using browser.runtime.getBackgroundPage().addListener("unload"), unload event is fired, but web experiment api can not be called
	// @ts-ignore: noUnusedLocals
	private removeToolbarCustomizationListener(window: Window): void
	{
		console.log("removeToolbarCustomizationListener");
		if (!window)
		{
			return;
		}

		window.removeEventListener("aftercustomization", this.afterCustomize);
		window.removeEventListener("beforecustomization", this.beforeCustomize);
	}

	private beforeCustomize(e: Event): void
	{
		console.log("toolbar customization detected");
		//AutoarchiveReloadedWebextension.loggerWebExtension.info("toolbar customization detected");
		this.bIsInToolbarCustomize = true;
		console.log(this.bIsInToolbarCustomize);
	}

	private afterCustomize(e: Event): void
	{
		console.log("toolbar customization ended");
		//AutoarchiveReloadedWebextension.loggerWebExtension.info("toolbar customization ended");
		this.bIsInToolbarCustomize = false;
		console.log(this.bIsInToolbarCustomize);
	}
};
