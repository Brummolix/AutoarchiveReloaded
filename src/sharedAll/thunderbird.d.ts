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

// tslint:disable:class-name
// tslint:disable:interface-name

//general---------------------------------------------------------------------------------------------------------

//define a Type "keyword"
//see https://github.com/Microsoft/TypeScript/issues/20719
// tslint:disable-next-line:interface-name
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
type RuntimeMessageListener = (message: any, sender: RuntimeMessageSender, sendResponse: (response: object | null) => void) => void;

declare interface RuntimeMessageListeners extends IListeners<RuntimeMessageListener>
{
}

declare interface RuntimePortListener extends IListeners<(object: object) => void>
{
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port
declare class RuntimePort
{
	public onMessage: RuntimePortListener;

	public disconnect(): void;
	public postMessage(object: object): void;
}

declare interface RuntimeConnectListener extends IListeners<(port: RuntimePort) => void>
{
}

declare interface RuntimeSuspendListener extends IListeners<() => void>
{
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getBrowserInfo
declare interface BrowserInfo
{
	name: string; // value representing the browser name, for example "Firefox".
	vendor: string; // value representing the browser's vendor, for example "Mozilla".
	version: string; // representing the browser's version, for example "51.0" or "51.0a2".
	buildID: string; // representing the specific build of the browser, for example "20161018004015".
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime
declare class Runtime
{
	public onMessage: RuntimeMessageListeners;
	public onConnect: RuntimeConnectListener;
	//public onSuspend: RuntimeSuspendListener; -> does not exist in TB?

	public sendMessage(message: any): Promise<any>;
	public connect(connectInfo: {name: string}): RuntimePort;

	public getBrowserInfo(): Promise<BrowserInfo>;
	public getBackgroundPage(): Promise<BrowserWindow>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
declare class StorageType
{
	public get(value: string | string[]): Promise<object>;
	public set(values: object): Promise<void>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
declare class BrowserStorages
{
	public local: StorageType;
	public sync: StorageType;
	public managed: StorageType;
}

type BrowserWindowType = "normal" | "popup" | "panel" | "devtools";

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/Window
declare class BrowserWindow extends Window
{
	public id: number;
	public title: string;
	public type: BrowserWindowType;
	public focused: boolean;
}

declare interface IListeners<T>
{
	addListener(callback: T): void;
	removeListener(listener: T): void;
	hasListener(listener: T): boolean;
}

declare interface BrowserWindowCreatedListeners extends IListeners< (window: BrowserWindow) => void>
{
}

declare interface BrowserWindowInfo
{
	populate?: boolean; //If true, the windows.Window object will have a tabs property that contains a list of tabs.Tab objects representing the tabs in the window. The Tab objects only contain the url, title and favIconUrl properties if the extension's manifest file includes the "tabs" permission.
	windowTypes?: BrowserWindowType[]; //An array of windows.WindowType objects. If set, the windows.Window returned will be filtered based on its type. If unset the default filter is set to ['normal', 'panel', 'popup'], with 'panel' window types limited to the extension's own windows.
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows
declare class BrowserWindows
{
	public WINDOW_ID_CURRENT: number;
	public readonly onCreated: BrowserWindowCreatedListeners;

	public remove(windowid: number): Promise<void>;
	public getCurrent(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	public getLastFocused(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	public getAll(getInfo?: BrowserWindowInfo): Promise<BrowserWindow[]>;
	public get(id: number, getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension
declare class Extension
{
	public getBackgroundPage(): BrowserWindow;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
declare interface BrowserAction
{
	onClicked: IListeners<() => void>;
}

declare interface TabInfo
{
	url: string;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
declare interface Tab
{
	url?: string;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs
declare interface BrowserTabs
{
	onCreated: IListeners<(tab: Tab) => void>;

	query(queryInfo: TabInfo | {}): Promise<Tab[]>;
}

declare interface i18n
{
	getMessage(messageName: string, substitutions?: string | string[]): string;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html#accounts-mailaccount
declare interface MailAccount
{
	folders: MailFolder[];
	id: string;
	name: string;
	type: string; //e.g. imap, nntp, or pop3.
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html#mailfolder
declare interface MailFolder
{
	accountId: string;
	path: string;
	name: string;
	type: string;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html
declare interface accounts
{
	list(): Promise<MailAccount[]>;
	get(accountId: string): Promise<MailAccount>;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messageheader
declare interface MessageHeader
{
	author: string;
	bccList: string[];
	ccList: string[];
	date: Date;
	flagged: boolean;
	folder: MailFolder;
	id: number;
	read: boolean;
	recipients: string[];
	subject: string;
	tags: string[];
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messagelist
declare interface MessageList
{
	id: string;
	messages: MessageHeader[];
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messagetag
declare interface MessageTag
{
	color: string; //Tag color
	key: string; // Distinct tag identifier – use this string when referring to a tag
	ordinal: string; //Custom sort string (usually empty)
	tag: string; //Human-readable tag name
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html
declare interface messages
{
	list(folder: MailFolder): Promise<MessageList>;
	continueList(messageListId: string): Promise<MessageList>;
	get(messageId: number): Promise<MessageHeader>;
	listTags(): Promise<MessageTag>;

	//move(messageIds: number[], destination: MailFolder); //return type?
	//copy(messageIds: number[], destination: MailFolder); //return type?
	//delete(messageIds: number[], ?skipTrash:boolean); //return type?
}

declare interface AutoarchiveWebExperiment
{
	alert(title: string, text: string): Promise<void>;
	confirm(title: string, text: string): Promise<boolean>;
	startToArchiveMessages(messageIds: number[]): Promise<number>;
	initToolbarConfigurationObserver(): void;
	isToolbarConfigurationOpen(): Promise<boolean>;
	askForLegacyPreferences(accounts: IAccountInfo[]): ISettings | null;
	setInfoLogging(value: boolean): void;
}

type ContextType = "all" | "page" | "frame" | "selection" | "link" | "editable" | "password" | "image" | "video" | "audio" | "browser_action" | "tab" | "message_list" | "folder_pane";

type ItemType = "normal" | "checkbox" | "radio" | "separator";

type ViewType = "tab" | "popup" | "sidebar";

declare interface menuCreateProperties
{
	checked?: boolean; //The initial state of a checkbox or radio item: true for selected and false for unselected. Only one radio item can be selected at a time in a given group of radio items.
	command?: string; //Specifies a command to issue for the context click. Currently supports internal command _execute_browser_action.
	contexts?: ContextType[]; //List of contexts this menu item will appear in. Defaults to [‘page’] if not specified.
	documentUrlPatterns?: string[]; //Lets you restrict the item to apply only to documents whose URL matches one of the given patterns. (This applies to frames as well.) For details on the format of a pattern, see Match Patterns.
	enabled?: boolean; //Whether this context menu item is enabled or disabled. Defaults to true.
	icons?: object;
	id?: string; //The unique ID to assign to this item. Mandatory for event pages. Cannot be the same as another ID for this extension.
	onclick?: () => void; // A function that will be called back when the menu item is clicked. Event pages cannot use this.
	parentId?: number | string; //The ID of a parent menu item; this makes the item a child of a previously added item.
	targetUrlPatterns?: string[]; //Similar to documentUrlPatterns, but lets you filter based on the src attribute of img/audio/video tags and the href of anchor tags.
	title?: string; //The text to be displayed in the item; this is required unless type is ‘separator’. When the context is ‘selection’, you can use %s within the string to show the selected text. For example, if this parameter’s value is “Translate ‘%s’ to Pig Latin” and the user selects the word “cool”, the context menu item for the selection is “Translate ‘cool’ to Pig Latin”.
	type?: ItemType; //The type of menu item. Defaults to ‘normal’ if not specified.
	viewTypes?: ViewType[]; //List of view types where the menu item will be shown. Defaults to any view, including those without a viewType.
	visible: boolean; //Whether the item is visible in the menu.
}

declare interface menus
{
	//returns "The ID of the newly created item."
	create(createProperties: menuCreateProperties, callback?: () => void): Promise<number|string>;

	//update(id, updateProperties)
	remove(menuItemId: number | string): void;
	removeAll(): void;
	//overrideContext(contextOptions)
}

declare interface Browser
{
	runtime: Runtime;
	storage: BrowserStorages;
	windows: BrowserWindows;
	extension: Extension;
	browserAction: BrowserAction;
	tabs: BrowserTabs;

	i18n: i18n;
	accounts: accounts;
	messages: messages;
	menus: menus;

	autoarchive: AutoarchiveWebExperiment;
}

declare var browser: Browser;

//Bootstrap--------------------------------------------------------------------------------------------------

declare class StartupWebextensionApi
{
	public browser: Browser;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Embedded_WebExtensions
declare class StartupWebextension
{
	public startup(): Promise<StartupWebextensionApi>;
}

//https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
declare class BootstrapData
{
	public id: string;
	public version: string;
	public installPath: Ci.nsIFile;
	public resourceURI: Ci.nsIURI;

	public webExtension: StartupWebextension;
}

//LegacyAddOn--------------------------------------------------------------------------------------------------

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIJSCID
declare interface nsIJSCID
{
	getService<T>(type: Type<T>): T;
	createInstance<T>(type: Type<T>): T;
}

declare namespace Components
{
	class utils
	{
		public static import(path: string): void;
		public static unload(path: string): void;
		public static defineModuleGetter(param1: any, param2: any, param3: any): void;
	}

	//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference
	namespace interfaces
	{
		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMWindow
		class nsIDOMWindow extends Window
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPromptService
		class nsIPromptService
		{
			public alert(parent: nsIDOMWindow | null, title: string, msg: string): void;
			public confirm(parent: nsIDOMWindow | null, title: string, msg: string): boolean;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIConsoleService
		class nsIConsoleService
		{
			public logStringMessage(msg: string): void;
		}

		class nsISimpleEnumerator<T>
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgFolder
		class nsIMsgFolder
		{
			public name: string;
			public readonly server: nsIMsgIncomingServer;
			public readonly URI: string;
			public readonly hasSubFolders: boolean;
			public readonly subFolders: nsISimpleEnumerator<nsIMsgFolder>;

			public getFlag(flagName: nsMsgFolderFlags): boolean;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Thunderbird_extensions/HowTos/Activity_Manager
		class nsIActivityManager
		{
			public addActivity(activity: nsIActivity): void;
			public removeActivity(id: string): void;
		}

		//https://dxr.mozilla.org/comm-central/source/comm/mail/base/content/mailWindowOverlay.js
		class BatchMessageMover
		{
			public archiveMessages(messages: nsIMsgDBHdr[]): void;
		}

		//TODO: remove
		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgAccount
		class nsIMsgAccount
		{
			public incomingServer: nsIMsgIncomingServer;
			public key: string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgIncomingServer
		class nsIMsgIncomingServer
		{
			public readonly serverURI: string;
			public type: "pop3" | "imap" | "nntp" | "none" | "im" | "rss" | "exquilla"; //"and so on"?
			public rootFolder: nsIMsgFolder;
			public prettyName: string;
			public readonly localStoreType: "mailbox" | "imap" | "news" | "exquilla";

			public getBoolValue(attr: string): boolean;
			public getIntValue(attr: string): number;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULAppInfo
		class nsIXULAppInfo
		{
			public readonly ID: string;
			public readonly version: string;
			public readonly appBuildID: string;
			public readonly platformVersion: string;
			public readonly platformBuildID: string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle
		class nsIStringBundle
		{
			public GetStringFromName(name: string): string;
			public formatStringFromName(name: string, params: string[], length: number): string;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchSession
		class nsIMsgSearchSession
		{
			public addScopeTerm(scope: nsMsgSearchScope, folder: nsIMsgFolder): void;
			public createTerm(): nsMsgSearchTerm;
			public appendTerm(term: nsMsgSearchTerm): void;
			public registerListener(listener: nsIMsgSearchNotify): void;
			public search(window: nsIMsgWindow | null): void;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgWindow
		class nsIMsgWindow
		{
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchTerm
		class nsMsgSearchTerm
		{
			public attrib: nsMsgSearchAttrib;
			public value: nsIMsgSearchValue;
			public op: nsMsgSearchOp;
			public booleanAnd: boolean;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgSearchValue
		class nsIMsgSearchValue
		{
			public attrib: nsMsgSearchAttrib;
			public age: number;
			public status: nsMsgMessageFlags;
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
			onNewSearch(): void;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileOutputStream
		class nsIFileOutputStream
		{
			public init(file: nsIFile, ioFlags: number, perm: number, behaviorFlags: number): void;
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
			public init(stream: nsIOutputStream, charset: string, bufferSize: number, replacementCharacter: number): void;
			public writeString(str: string): boolean;
			public close(): void;
		}

		class nsIOutputStream
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundleService
		class nsIStringBundleService
		{
			public createBundle(urlSpec: string): nsIStringBundle;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator
		class nsIWindowMediator
		{
			public getMostRecentWindow(windowType: string | null): nsIDOMWindow;
			public getMostRecentWindow(windowType: "mail:3pane"): Mail3Pane;

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgFolderFlagType
		class nsMsgFolderFlags
		{
			public static readonly Trash: nsMsgFolderFlags;
			public static readonly Junk: nsMsgFolderFlags;
			public static readonly Queue: nsMsgFolderFlags;
			public static readonly Drafts: nsMsgFolderFlags;
			public static readonly Templates: nsMsgFolderFlags;
			public static readonly Archive: nsMsgFolderFlags;
			public static readonly Virtual: nsMsgFolderFlags;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchScope
		class nsMsgSearchScope
		{
			public static readonly offlineMail: nsMsgSearchScope;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchOp
		class nsMsgSearchOp
		{
			public static readonly IsGreaterThan: nsMsgSearchOp;
			public static readonly Isnt: nsMsgSearchOp;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsMsgSearchAttrib
		class nsMsgSearchAttrib
		{
			public static readonly AgeInDays: nsMsgSearchAttrib;
			public static readonly MsgStatus: nsMsgSearchAttrib;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/nsMsgMessagesFlags
		class nsMsgMessageFlags
		{
			public static readonly IMAPDeleted: nsMsgMessageFlags;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/nsMsgNavigationType
		class nsMsgNavigationType
		{
			public static readonly firstMessage: nsMsgNavigationType;
		}

		class nsIActivity
		{
			public contextType: string;
			public contextObj: nsIMsgIncomingServer;
		}

		class nsIActivityEvent extends nsIActivity
		{
			public init(msg: string, value2: any, value3: string, time: number, date: number): void;
		}

		class nsIActivityStates
		{

		}

		class nsIActivityProcess extends nsIActivity
		{
			public static readonly STATE_COMPLETED: nsIActivityStates;

			public state: nsIActivityStates;
			public startTime: number;
			public id: string;

			public init(msg: string, value2: any): void;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefService
		class nsIPrefService
		{
			public getBranch(aPrefRoot: string): nsIPrefBranch;
		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
		class nsIMsgDBHdr
		{
			public readonly isRead: boolean;
			public readonly isFlagged: boolean;
			public readonly dateInSeconds: number;
			public readonly folder: nsIMsgFolder;
		}

		class nsIMsgTag
		{

		}

		//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
		class nsIPrefBranch
		{
			public getBoolPref(name: string, defaultValue: boolean | undefined): boolean;
			public getCharPref(name: string, defaultValue: string | undefined): string;
			public getChildList(startingAt: string, obj: object): string[];
			public setBoolPref(name: string, value: boolean): void;
		}
	}

	//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.classes
	export let classes: { [key: string]: nsIJSCID; };
}

import Cu = Components.utils;
import ChromeUtils = Components.utils;
import Cc = Components.classes;
import Ci = Components.interfaces;

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/FileUtils.jsm
declare class FileUtils
{
	public static getFile(key: string, pathArray: string[], followLinks?: boolean): Ci.nsIFile;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Toolkit_API/extIApplication
declare class Application
{
	public static console: extIConsole;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Toolkit_API/extIConsole
declare class extIConsole
{
	public log(msg: string): void;
}

declare class MailServicesAccounts
{
	public accounts: Ci.nsISimpleEnumerator<Ci.nsIMsgAccount>;
}

declare class MailServices
{
	public static accounts: MailServicesAccounts;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Add-on_Manager/Addon
declare class Addon
{
	public readonly type: string;
	public readonly name: string;
	public readonly id: string;
	public readonly version: string;
	public readonly isActive: boolean;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Add-on_Manager/AddonManager
declare class AddonManager
{
	public static getAllAddons(AddonListCallback: (addons: Addon[]) => void): void;
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
	public dbView: FolderDisplayViewDb;
}

//I don't know the real type name
declare class FolderDisplay
{
	public displayedFolder: Ci.nsIMsgFolder;
	public selectedCount: number;

	//not official API
	public view: FolderDisplayView;

	public navigate(type: Ci.nsMsgNavigationType): void;
	public show(folder: Ci.nsIMsgFolder): void;
}

//I don't know the real type name
declare class MessageIdentity
{
	public archiveEnabled: boolean;
}

declare class ThunderbirdNavigator extends Navigator
{
	public oscpu: string;
}

declare class Mail3Pane extends Ci.nsIDOMWindow
{
	public gFolderDisplay: FolderDisplay;
	public BatchMessageMover: { new(): Ci.BatchMessageMover }; //tricky, this is an inner class
	public navigator: ThunderbirdNavigator;

	public getIdentityForHeader(msg: Ci.nsIMsgDBHdr): MessageIdentity;
}

declare class ThunderbirdError
{
	public fileName: string;
	public lineNumber: number;
	public stack: string;

	public toSource(): string;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIObserver
declare class nsIObserver
{

}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowWatcher
declare interface nsIWindowWatcher
{
	registerNotification(observer: nsIObserver): void;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator
declare class nsIWindowMediator
{
	public getMostRecentWindow(id: string): Window;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.jsm
declare namespace Services
{
	let ww: nsIWindowWatcher;
	let wm: nsIWindowMediator;
}

declare namespace ExtensionCommon
{
	abstract class  ExtensionAPI
	{
		public abstract getAPI(context: any): {};
	}
	class EventManager
	{
		constructor(arg: any);
	}
}