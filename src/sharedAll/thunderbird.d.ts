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
// tslint:disable:max-classes-per-file

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
interface RuntimePort
{
	onMessage: RuntimePortListener;

	disconnect(): void;
	postMessage(object: object): void;
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
declare interface Runtime
{
	onMessage: RuntimeMessageListeners;
	onConnect: RuntimeConnectListener;
	//onSuspend: RuntimeSuspendListener; -> does not exist in TB?

	sendMessage(message: any): Promise<any>;
	connect(connectInfo: {name: string}): RuntimePort;

	getBrowserInfo(): Promise<BrowserInfo>;
	getBackgroundPage(): Promise<BrowserWindow>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
declare interface StorageType
{
	get(value: string | string[]): Promise<object>;
	set(values: object): Promise<void>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
declare interface BrowserStorages
{
	local: StorageType;
	sync: StorageType;
	managed: StorageType;
}

type BrowserWindowType = "normal" | "popup" | "panel" | "devtools";

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/Window
declare interface BrowserWindow extends Window
{
	id: number;
	title: string;
	type: BrowserWindowType;
	focused: boolean;
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
declare interface BrowserWindows
{
	WINDOW_ID_CURRENT: number;
	readonly onCreated: BrowserWindowCreatedListeners;

	remove(windowid: number): Promise<void>;
	getCurrent(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	getLastFocused(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	getAll(getInfo?: BrowserWindowInfo): Promise<BrowserWindow[]>;
	get(id: number, getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension
declare interface Extension
{
	getBackgroundPage(): BrowserWindow;
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