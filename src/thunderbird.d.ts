/*!
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

//Attention:
//this types are not complete! I only added, what is used by AutoarchiveReloaded at the moment!

//general---------------------------------------------------------------------------------------------------------

//define a Type "keyword"
//see https://github.com/Microsoft/TypeScript/issues/20719
interface Type<T> extends Function
{
	new(...args: any[]): T;
}

//WebExtension Stuff---------------------------------------------------------------------------------------------------------

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
declare class RuntimeMessageSender
{
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
type RuntimeMessageListener = (message: any, sender: RuntimeMessageSender, sendResponse: (response: Object | null) => void) => void;

declare class RuntimeMessageListeners
{
	addListener(listener: RuntimeMessageListener): void;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime
declare class Runtime
{
	sendMessage(message: any): Promise<any>;

	onMessage: RuntimeMessageListeners;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
declare class StorageType
{
	get(value: string | string[]): Promise<object>
	set(values: object): Promise<void>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
declare class BrowserStorages
{
	local: StorageType;
	sync: StorageType;
	managed: StorageType;
}

declare class Browser
{
	runtime: Runtime;
	storage: BrowserStorages;
}
declare var browser: Browser;

//Bootstrap--------------------------------------------------------------------------------------------------

declare class StartupWebextensionApi
{
	browser: Browser;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Embedded_WebExtensions
declare class StartupWebextension
{
	startup(): Promise<StartupWebextensionApi>;
}

//https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
declare class BootstrapData
{
	id: string
	version: string;
	installPath: Ci.nsIFile;
	resourceURI: Ci.nsIURI;

	webExtension: StartupWebextension;
}

//https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Bootstrapped_extensions#Reason_constants
declare enum BootstrapReasons
{
	APP_STARTUP = 1,// 	The application is starting up.
	APP_SHUTDOWN = 2,// 	The application is shutting down.
	ADDON_ENABLE = 3,// 	The add-on is being enabled.
	ADDON_DISABLE = 4,// 	The add-on is being disabled. (Also sent during uninstallation)
	ADDON_INSTALL = 5,// 	The add-on is being installed.
	ADDON_UNINSTALL = 6,// 	The add-on is being uninstalled.
	ADDON_UPGRADE = 7,// 	The add-on is being upgraded.
	ADDON_DOWNGRADE = 8,// 	The add-on is being downgraded.
}

//LegacyAddOn--------------------------------------------------------------------------------------------------

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIJSCID
declare class Services
{
	getService<T>(type: Type<T>): T;
	createInstance<T>(type: Type<T>): T;
}

declare namespace Components
{
	class utils
	{
		static import(path: string): void;
		static unload(path: string): void;
	}


	//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference
	namespace interfaces
	{
		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMWindow
		class nsIDOMWindow
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPromptService
		class nsIPromptService
		{
			alert(parent: nsIDOMWindow | null, title: string, msg: string): void;
			confirm(parent: nsIDOMWindow | null, title: string, msg: string): boolean;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIConsoleService
		class nsIConsoleService
		{
			logStringMessage(msg: string): void;
		}

		class nsISimpleEnumerator<T>
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgFolder
		class nsIMsgFolder
		{
			name: string;
			readonly server: nsIMsgIncomingServer;
			readonly URI: string;
			getFlag(flagName: nsMsgFolderFlags): boolean;
			readonly hasSubFolders: boolean;
			readonly subFolders: nsISimpleEnumerator<nsIMsgFolder>;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Thunderbird_extensions/HowTos/Activity_Manager
		class nsIActivityManager
		{
			addActivity(activity: nsIActivity): void;
			removeActivity(id: string): void;
		}

		//https://dxr.mozilla.org/comm-central/source/comm/mail/base/content/mailWindowOverlay.js
		class BatchMessageMover
		{
			archiveMessages(messages: nsIMsgDBHdr[]): void;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgAccount
		class nsIMsgAccount
		{
			incomingServer: nsIMsgIncomingServer;
			key: string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgIncomingServer
		class nsIMsgIncomingServer
		{
			readonly serverURI: string;
			type: "pop3" | "imap" | "nntp" | "none"; //"and so on"?
			rootFolder: nsIMsgFolder;
			prettyName: string;
			readonly localStoreType: "mailbox" | "imap" | "news";

			getBoolValue(attr: string): boolean;
			getIntValue(attr: string): number;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULAppInfo
		class nsIXULAppInfo
		{
			readonly ID: string;
			readonly version: string;
			readonly appBuildID: string;
			readonly platformVersion: string;
			readonly platformBuildID: string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle
		class nsIStringBundle
		{
			GetStringFromName(name: string): string;
			formatStringFromName(name: string, params: string[], length: number): string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchSession
		class nsIMsgSearchSession
		{
			addScopeTerm(scope: nsMsgSearchScope, folder: nsIMsgFolder): void;
			createTerm(): nsMsgSearchTerm;
			appendTerm(term: nsMsgSearchTerm): void;
			registerListener(listener: nsIMsgSearchNotify): void;
			search(window: nsIMsgWindow | null): void;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgWindow
		class nsIMsgWindow
		{
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchTerm
		class nsMsgSearchTerm
		{
			attrib: nsMsgSearchAttrib;
			value: nsIMsgSearchValue;
			op: nsMsgSearchOp;
			booleanAnd: boolean;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchValue
		class nsIMsgSearchValue
		{
			attrib: nsMsgSearchAttrib;
			age: number;
			status: nsMsgMessageFlags;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchNotify
		interface nsIMsgSearchNotify
		{
			onSearchHit(header: nsIMsgDBHdr, folder: nsIMsgFolder): void;

			// notification that a search has finished.
			onSearchDone(status: number): void;

            /*
             * called when a new search begins
             */
			onNewSearch(): void
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileOutputStream
		class nsIFileOutputStream
		{
			init(file: nsIFile, ioFlags: number, perm: number, behaviorFlags: number): void;
		}

		class nsIFile
		{

		}

		class nsIURI
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIConverterOutputStream
		//https://dxr.mozilla.org/comm-central/source/obj-x86_64-pc-linux-gnu/dist/include/nsIUnicharOutputStream.h?q=nsIUnicharOutputStream&redirect_type=direct#27
		class nsIConverterOutputStream
		{
			init(stream: nsIOutputStream, charset: string, bufferSize: number, replacementCharacter: number): void;
			writeString(str: string): boolean;
			close(): void;
		}

		class nsIOutputStream 
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundleService
		class nsIStringBundleService
		{
			createBundle(urlSpec: string): nsIStringBundle;

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator
		class nsIWindowMediator
		{
			getMostRecentWindow(windowType: string | null): nsIDOMWindow;
			getMostRecentWindow(windowType: "mail:3pane"): Mail3Pane;

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgFolderFlagType
		class nsMsgFolderFlags
		{
			static readonly Trash: nsMsgFolderFlags;
			static readonly Junk: nsMsgFolderFlags;
			static readonly Queue: nsMsgFolderFlags;
			static readonly Drafts: nsMsgFolderFlags;
			static readonly Templates: nsMsgFolderFlags;
			static readonly Archive: nsMsgFolderFlags;
			static readonly Virtual: nsMsgFolderFlags;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchScope
		class nsMsgSearchScope
		{
			static readonly offlineMail: nsMsgSearchScope;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchOp
		class nsMsgSearchOp
		{
			static readonly IsGreaterThan: nsMsgSearchOp;
			static readonly Isnt: nsMsgSearchOp;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchAttrib
		class nsMsgSearchAttrib
		{
			static readonly AgeInDays: nsMsgSearchAttrib;
			static readonly MsgStatus: nsMsgSearchAttrib;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/nsMsgMessagesFlags
		class nsMsgMessageFlags
		{
			static readonly IMAPDeleted: nsMsgMessageFlags;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/nsMsgNavigationType
		class nsMsgNavigationType
		{
			static readonly firstMessage: nsMsgNavigationType;
		}

		class nsIActivity
		{
			contextType: string;
			contextObj: nsIMsgIncomingServer;
		}

		class nsIActivityEvent extends nsIActivity
		{
			init(msg: string, value2: any, value3: string, time: number, date: number): void;
		}

		class nsIActivityStates
		{

		}

		class nsIActivityProcess extends nsIActivity
		{
			static readonly STATE_COMPLETED: nsIActivityStates;

			state: nsIActivityStates;
			init(msg: string, value2: any): void;
			startTime: number;
			id: string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefService
		class nsIPrefService
		{
			getBranch(aPrefRoot: string): nsIPrefBranch;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
		class nsIMsgDBHdr
		{
			readonly isRead: boolean;
			readonly isFlagged: boolean;
			readonly dateInSeconds: number;
			readonly folder: nsIMsgFolder;
		}

		class nsIMsgTag
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
		class nsIPrefBranch
		{
			getBoolPref(name: string, defaultValue: boolean | undefined): boolean;
			getCharPref(name: string, defaultValue: string | undefined): string;
			getChildList(startingAt: string, obj: object): string[];
			setBoolPref(name: string, value: boolean): void;
		}
	}

	//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.classes
	export var classes: { [key: string]: Services; };
}

import Cu = Components.utils;
import Cc = Components.classes;
import Ci = Components.interfaces;

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/FileUtils.jsm
declare class FileUtils
{
	static getFile(key: string, pathArray: string[], followLinks?: boolean): Ci.nsIFile;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Toolkit_API/extIApplication
declare class Application
{
	static console: extIConsole;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Toolkit_API/extIConsole
declare class extIConsole
{
	log(msg: string): void;
}

declare class MailServicesAccounts
{
	accounts: Ci.nsISimpleEnumerator<Ci.nsIMsgAccount>;
}


declare class MailServices
{
	static accounts: MailServicesAccounts
}

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Add-on_Manager/Addon
declare class Addon
{
	readonly type: string;
	readonly name: string;
	readonly id: string;
	readonly version: string;
	readonly isActive: boolean;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Add-on_Manager/AddonManager
declare class AddonManager
{
	static getAllAddons(AddonListCallback: (addons: Addon[]) => void): void;
}

declare function fixIterator<T>(collection: Ci.nsISimpleEnumerator<T>, objectType: Type<T>): T[];

//not official API
declare class FolderDisplayViewDb
{
	//show(folder:Ci.nsIMsgFolder):void;
}

//not official API
declare class FolderDisplayView
{
	dbView: FolderDisplayViewDb;
}

//I don't know the real type name
declare class FolderDisplay
{
	displayedFolder: Ci.nsIMsgFolder;
	selectedCount: number;
	navigate(type: Ci.nsMsgNavigationType): void;
	show(folder: Ci.nsIMsgFolder): void;

	//not official API
	view: FolderDisplayView;

}

//I don't know the real type name
declare class MessageIdentity
{
	archiveEnabled: boolean;
}

declare class ThunderbirdNavigator extends Navigator
{
	oscpu: string;
}

declare class Mail3Pane extends Ci.nsIDOMWindow
{
	gFolderDisplay: FolderDisplay;
	BatchMessageMover: { new(): Ci.BatchMessageMover };//tricky, this is an inner class
	getIdentityForHeader(msg: Ci.nsIMsgDBHdr): MessageIdentity;
	navigator: ThunderbirdNavigator;
}

declare class ThunderbirdError
{
	fileName: string;
	lineNumber: number;
	toSource(): string;
	stack: string;
}