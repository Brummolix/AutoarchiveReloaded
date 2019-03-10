ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.import("resource:///modules/MailServices.jsm");
ChromeUtils.import("resource:///modules/iteratorUtils.jsm");

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
				askForLegacyPreferences: async (accounts: IAccountInfo[]): Promise<ISettings | null> =>
				{
					console.log("replyToAskForLegacyPreferences");
					console.log(accounts);
					try
					{
						const legacyOptions: LegacyOptions = new LegacyOptions();
						const legacySettings = legacyOptions.getLegacyOptions(accounts);
						legacyOptions.markLegacySettingsAsMigrated();
						console.log(legacySettings);
						return legacySettings;
					}
					catch (e)
					{
						//AutoarchiveReloadedWebextension.loggerWebExtension.errorException(e);
						console.log(e);
						throw e;
					}
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

		window.addEventListener("aftercustomization", this.afterCustomize.bind(this));
		window.addEventListener("beforecustomization", this.beforeCustomize.bind(this));
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

class LegacyOptions
{
	// returns null if already migrated or no settings!
	public getLegacyOptions(accounts: IAccountInfo[]): ISettings | null
	{
		console.log("getLegacyOptions");

		const prefBranch = this.getInternalLegacyPrefBranch();

		console.log(prefBranch);
		console.log(prefBranch.getBoolPref("preferencesAlreadyMigrated", false));

		if (prefBranch.getBoolPref("preferencesAlreadyMigrated", false))
		{
			return null;
		}

		const accountSettings: IAccountSettingsArray = this.getLegacyAccountSettings(accounts);

		//no account and no global settings?
		const aChildArray: string[] = prefBranch.getChildList("", {});
		console.log(aChildArray);
		if ((aChildArray.length === 0) && Object.keys(accountSettings).length === 0)
		{
			return null;
		}

		//in an old profile the default values were not stored and we get undefined instead
		//nevertheless we read everything with default value undefined now and the deepMerge later on will merge it with current default values
		const legacySettings: ISettings = {
			globalSettings: {
				archiveType: prefBranch.getCharPref("archiveType", undefined) as ArchiveType,
				enableInfoLogging: prefBranch.getBoolPref("enableInfoLogging", undefined),
			},
			accountSettings: accountSettings,
		};

		return legacySettings;
	}

	public markLegacySettingsAsMigrated(): void
	{
		console.log("markLegacySettingsAsMigrated");
		this.getInternalLegacyPrefBranch().setBoolPref("preferencesAlreadyMigrated", true);
	}

	private getLegacyAccountSettings(accountInfos: IAccountInfo[]): IAccountSettingsArray
	{
		console.log("getLegacyAccountSettings");
		const accountSettings: IAccountSettingsArray = {};

		for (const accountInfo of accountInfos)
		{
			const accounts: Ci.nsIMsgAccount[] = fixIterator(MailServices.accounts.accounts, Ci.nsIMsgAccount);
			let account;
			for (const currentAccount of accounts)
			{
				if (currentAccount.key === accountInfo.accountId)
				{
					account = currentAccount;
					break;
				}
			}

			if (account == null)
			{
				continue;
			}

			const server: Ci.nsIMsgIncomingServer = account.incomingServer;
			const settingOfAccount: IAccountSettings = {
				bArchiveOther: server.getBoolValue("archiveMessages"),
				daysOther: server.getIntValue("archiveMessagesDays"),
				bArchiveMarked: server.getBoolValue("archiveStarred"),
				daysMarked: server.getIntValue("archiveStarredDays"),
				bArchiveTagged: server.getBoolValue("archiveTagged"),
				daysTagged: server.getIntValue("archiveTaggedDays"),
				bArchiveUnread: server.getBoolValue("archiveUnread"),
				daysUnread: server.getIntValue("archiveUnreadDays"),
			};

			//if nothing is archived (which was the default) we assume that the AddOn was not installed or at least not used
			//therefore we ignore the settings then and the defaults will be used later on
			if (settingOfAccount.bArchiveOther || settingOfAccount.bArchiveMarked || settingOfAccount.bArchiveTagged || settingOfAccount.bArchiveUnread)
			{
				accountSettings[account.key] = settingOfAccount;
			}
		}

		return accountSettings;
	}

	private getInternalLegacyPrefBranch(): Ci.nsIPrefBranch
	{
		const prefs: Ci.nsIPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return prefs.getBranch("extensions.AutoarchiveReloaded.");
	}
}