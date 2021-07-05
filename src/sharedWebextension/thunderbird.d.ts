/*!
Copyright 2018-2021 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

/* eslint-disable @typescript-eslint/no-empty-interface */

//Attention this file should have NO global imports! Only local imports like import("./something").type are allowed
//otherwise TS creates code with import instead of simpy using the stuff
//see https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts

//Attention:
//this types are not complete! I only added, what is used by AutoarchiveReloaded at the moment!

//WebExtension Stuff---------------------------------------------------------------------------------------------------------

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
declare class RuntimeMessageSender {}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
type RuntimeMessageResponseFunction = (response: import("./Messages").GetArchiveStatusResponse | null) => void;
type RuntimeMessageListener = (
	message: import("./Messages").GetArchiveStatusMessageRequest | import("./Messages").ArchiveManuallyMessageRequest,
	sender: RuntimeMessageSender,
	sendResponse: RuntimeMessageResponseFunction
) => void;

declare interface RuntimeMessageListeners extends Listeners<RuntimeMessageListener> {}

declare interface RuntimePortListener extends Listeners<(object: Record<string, unknown>) => void> {}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port
interface RuntimePort {
	onMessage: RuntimePortListener;

	disconnect(): void;
	postMessage(object: Record<string, unknown>): void;
}

declare interface RuntimeConnectListener extends Listeners<(port: RuntimePort) => void> {}

declare interface RuntimeSuspendListener extends Listeners<() => void> {}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getBrowserInfo
declare interface BrowserInfo {
	name: string; // value representing the browser name, for example "Firefox".
	vendor: string; // value representing the browser's vendor, for example "Mozilla".
	version: string; // representing the browser's version, for example "51.0" or "51.0a2".
	buildID: string; // representing the specific build of the browser, for example "20161018004015".
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime
declare interface Runtime {
	lastError: null | Error;

	onMessage: RuntimeMessageListeners;
	onConnect: RuntimeConnectListener;
	//onSuspend: RuntimeSuspendListener; -> does not exist in TB?

	sendMessage(message: import("./Messages").GetArchiveStatusMessageRequest): Promise<import("./Messages").GetArchiveStatusResponse>;
	sendMessage(message: import("./Messages").ArchiveManuallyMessageRequest): Promise<void>;
	connect(connectInfo: { name: string }): RuntimePort;

	getBrowserInfo(): Promise<BrowserInfo>;
	getBackgroundPage(): Promise<BrowserWindow>;

	//openOptionsPage(): Promise<void>; -> openOptionsPage is not defined
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
declare interface StorageType {
	get(value: string | string[]): Promise<Record<string, Record<string, unknown>>>;
	set(values: Record<string, unknown>): Promise<void>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
declare interface BrowserStorages {
	local: StorageType;
	sync: StorageType;
	managed: StorageType;
}

type BrowserWindowType = "normal" | "popup" | "panel" | "devtools";

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/Window
declare interface BrowserWindow extends Window {
	id: number;
	title: string;
	type: BrowserWindowType;
	focused: boolean;
}

declare interface Listeners<T> {
	addListener(callback: T): void;
	removeListener(listener: T): void;
	hasListener(listener: T): boolean;
}

declare interface BrowserWindowCreatedListeners extends Listeners<(window: BrowserWindow) => void> {}

declare interface BrowserWindowInfo {
	populate?: boolean; //If true, the windows.Window object will have a tabs property that contains a list of tabs.Tab objects representing the tabs in the window. The Tab objects only contain the url, title and favIconUrl properties if the extension's manifest file includes the "tabs" permission.
	windowTypes?: BrowserWindowType[]; //An array of windows.WindowType objects. If set, the windows.Window returned will be filtered based on its type. If unset the default filter is set to ['normal', 'panel', 'popup'], with 'panel' window types limited to the extension's own windows.
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows
declare interface BrowserWindows {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	WINDOW_ID_CURRENT: number;
	readonly onCreated: BrowserWindowCreatedListeners;

	remove(windowid: number): Promise<void>;
	getCurrent(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	getLastFocused(getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
	getAll(getInfo?: BrowserWindowInfo): Promise<BrowserWindow[]>;
	get(id: number, getInfo?: BrowserWindowInfo): Promise<BrowserWindow>;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension
declare interface Extension {
	getBackgroundPage(): BrowserWindow;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
declare interface BrowserAction {
	onClicked: Listeners<() => void>;
}

declare interface TabInfo {
	url: string;
}

//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
declare interface Tab {
	url?: string;
}

//https://thunderbird-webextensions.readthedocs.io/en/68/tabs.html
declare interface TabCreateProperties {
	active?: boolean;
	index?: number;
	//selected?: boolean; (boolean) Unsupported. Whether the tab should become the selected tab in the window. Defaults to true
	url?: string;
	windowId?: number; // (integer) The window to create the new tab in. Defaults to the current window.
}

declare interface BrowserTab {
	active: boolean; //Whether the tab is active in its window. (Does not necessarily mean the window is focused.)
	highlighted: boolean; //Whether the tab is highlighted. Works as an alias of active
	index: number; // (integer) The zero-based index of the tab within its window.
	selected: boolean; // Unsupported. Whether the tab is selected.
	favIconUrl?: string; // The URL of the tab’s favicon. This property is only present if the extension’s manifest includes the "tabs" permission. It may also be an empty string if the tab is loading.
	height?: number; //(integer) The height of the tab in pixels.
	id?: number; //(integer) The ID of the tab. Tab IDs are unique within a browser session. Under some circumstances a Tab may not be assigned an ID. Tab ID can also be set to TAB_ID_NONE for apps and devtools windows.
	mailTab?: boolean; //(boolean) Whether the tab is a 3-pane tab.
	status: string; //Either loading or complete.
	title: string; // The title of the tab. This property is only present if the extension’s manifest includes the "tabs" permission.
	url?: string; //The URL the tab is displaying. This property is only present if the extension’s manifest includes the "tabs" permission.
	width?: number; //(integer) The width of the tab in pixels.
	windowId?: number; //(integer) The ID of the window the tab is contained within.
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/tabs.html
declare interface BrowserTabs {
	onCreated: Listeners<(tab: Tab) => void>;

	query(queryInfo: TabInfo): Promise<Tab[]>;
	create(createProperties: TabCreateProperties): Promise<BrowserTab>;
}

declare interface Internationalization {
	getMessage(messageName: string, substitutions?: string | string[]): string;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html#accounts-mailaccount
//TODO: does exquilla really exists?
type AccountType = "pop3" | "imap" | "rss" | "exquilla" | "nntp" | "none";

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html#accounts-mailaccount
declare interface MailAccount {
	folders: MailFolder[];
	id: string;
	name: string;
	type: AccountType;
}

//TODO: virtual does not exist, yet
type FolderType = "inbox" | "sent" | "trash" | "junk" | "outbox" | "drafts" | "templates" | "archives";

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html#mailfolder
declare interface MailFolder {
	accountId: string;
	path: string;
	name?: string;
	type?: FolderType;
	subFolders?: MailFolder[]; //this is only available starting with TB v74, before the MailFolder returned by MailAccount.folders contained ALL folders recursively
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/accounts.html
declare interface Accounts {
	list(): Promise<MailAccount[]>;
	get(accountId: string): Promise<MailAccount>;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messageheader
declare interface MessageHeader {
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
	junk?: boolean; //[Added in TB 74]
	junkScore: number; //[Added in TB 74]
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messagelist
declare interface MessageList {
	id: string; //id for continueList
	messages: MessageHeader[];
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messagetag
declare interface MessageTag {
	color: string; //Tag color
	key: string; // Distinct tag identifier – use this string when referring to a tag
	ordinal: string; //Custom sort string (usually empty)
	tag: string; //Human-readable tag name
}

//https://webextension-api.thunderbird.net/en/78/messages.html#messages-tagsdetail
declare interface TagsDetail {
	mode: "all" | "any"; //Whether all of the tag filters must apply, or any of them.
	tags: any; //Object keys are tags to filter on, values are true if the message must have the tag, or false if it must not have the tag. For a list of available tags, call the listTags() method.
}

//https://webextension-api.thunderbird.net/en/78/messages.html#query-queryinfo
declare interface MessageQueryInfo {
	author?: string; //Returns only messages with this value matching the author.
	body?: string; //	Returns only messages with this value in the body of the mail.
	flagged?: boolean; //	Returns only flagged (or unflagged if false) messages.
	folder?: MailFolder; //Returns only messages from the specified folder. The accountsRead permission is required.
	fromDate?: Date; //	Returns only messages with a date after this value.
	fromMe?: boolean; //	Returns only messages with the author matching any configured identity.
	fullText?: string; //	Returns only messages with this value somewhere in the mail (subject, body or author).
	recipients?: string; //	Returns only messages with this value matching one or more recipients.
	subject?: string; //	Returns only messages with this value matching the subject.
	tags?: TagsDetail; // [Added in TB 74], Returns only messages with the specified tags. For a list of available tags, call the listTags method. Querying for messages that must not have a tag does not work.
	toDate?: Date; //	Returns only messages with a date before this value.
	toMe?: boolean; //	Returns only messages with one or more recipients matching any configured identity.
	unread?: boolean; //	Returns only unread (or read if false) messages.
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html
declare interface Messages {
	list(folder: MailFolder): Promise<MessageList>;
	continueList(messageListId: string): Promise<MessageList>;
	get(messageId: number): Promise<MessageHeader>;
	listTags(): Promise<MessageTag>;

	//move(messageIds: number[], destination: MailFolder); //return type?
	copy(messageIds: number[], destination: MailFolder): Promise<void>;
	delete(messageIds: number[], skipTrash?: boolean): Promise<void>; //return type?
	archive(messageIds: number[]): Promise<void>;

	query(queryInfo: MessageQueryInfo): Promise<MessageList>;
	getRaw(messageId: number): Promise<string>;
	getFull(messageId: number): Promise<MessagePart>;

	onNewMailReceived: Listeners<(folder: MailFolder, messages: MessageList) => void>; //[Added in TB 75]
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messages-messagepart
/**Represents an email message “part”, which could be the whole message */
declare interface MessagePart {
	/**
	 * the content of the part
	 */
	body?: string;
	contentType?: string;
	/**
	 * An object of part headers, with the header name as key, and an array of header values as value
	 */
	headers?: Record<string, string[]>;
	/**
	 * Name of the part, if it is a file
	 */
	name?: string;
	partName?: string;
	/**
	 * any sub-parts of this part
	 */
	parts?: MessagePart[];
	/**
	 * an integer
	 */
	size?: number;
}

/**
 * The different contexts a menu can appear in. Specifying all is equivalent to the combination of all other contexts excluding tab and tools_menu.
 */
type ContextType =
	| "all"
	| "page"
	| "frame"
	| "selection"
	| "link"
	| "editable"
	| "password"
	| "image"
	| "video"
	| "audio"
	| "browser_action"
	| "tab"
	| "message_list"
	| "folder_pane"
	| "compose_attachments" //Added in TB 83, backported to TB 78.5.0
	| "tools_menu"; //Added in TB 88

type ItemType = "normal" | "checkbox" | "radio" | "separator";

type ViewType = "tab" | "popup" | "sidebar";

//https://thunderbird-webextensions.readthedocs.io/en/latest/menus.html#menus-onclickdata
declare interface OnClickData {
	editable: boolean; //A flag indicating whether the element is editable (text input, textarea, etc.).
	menuItemId: number | string; // The ID of the menu item that was clicked.
	modifiers: string[]; // An array of keyboard modifiers that were held while the menu item was clicked.
	button?: number; // An integer value of button by which menu item was clicked.
	checked?: boolean; // A flag indicating the state of a checkbox or radio item after it is clicked.
	displayedFolder?: MailFolder; // The displayed folder, if the context menu was opened in the message list.
	frameId?: number; // The id of the frame of the element where the context menu was clicked.
	frameUrl?: string; // The URL of the frame of the element where the context menu was clicked, if it was in a frame.
	linkText?: string; //If the element is a link, the text of that link.
	linkUrl?: string; //If the element is a link, the URL it points to.
	mediaType?: string; //One of ‘image’, ‘video’, or ‘audio’ if the context menu was activated on one of these types of elements.
	pageUrl?: string; //The URL of the page where the menu item was clicked. This property is not set if the click occurred in a context where there is no current page, such as in a launcher context menu.
	parentMenuItemId?: number | string; //The parent ID, if any, for the item clicked.
	selectedFolder?: MailFolder; //The selected folder, if the context menu was opened in the folder pane.
	selectedMessages?: MessageList; //The selected messages, if the context menu was opened in the message list.
	selectionText?: string; //The text for the context selection, if any.
	srcUrl?: string; //Will be present for elements with a ‘src’ URL.
	targetElementId?: number; //An identifier of the clicked element, if any. Use menus.getTargetElement in the page to find the corresponding element.
	viewType?: ViewType; //The type of view where the menu is clicked. May be unset if the menu is not associated with a view.
	wasChecked?: boolean; //A flag indicating the state of a checkbox or radio item before it was clicked.
}

type MenuOnClickHandler = (info: OnClickData, tab?: Tab) => void;

declare interface MenuCreateProperties {
	checked?: boolean; //The initial state of a checkbox or radio item: true for selected and false for unselected. Only one radio item can be selected at a time in a given group of radio items.
	command?: string; //Specifies a command to issue for the context click. Currently supports internal command _execute_browser_action.
	contexts?: ContextType[]; //List of contexts this menu item will appear in. Defaults to [‘page’] if not specified.
	documentUrlPatterns?: string[]; //Lets you restrict the item to apply only to documents whose URL matches one of the given patterns. (This applies to frames as well.) For details on the format of a pattern, see Match Patterns.
	enabled?: boolean; //Whether this context menu item is enabled or disabled. Defaults to true.
	icons?: Record<string, unknown>;
	id?: string; //The unique ID to assign to this item. Mandatory for event pages. Cannot be the same as another ID for this extension.
	onclick?: MenuOnClickHandler; // A function that will be called back when the menu item is clicked. Event pages cannot use this.
	parentId?: number | string; //The ID of a parent menu item; this makes the item a child of a previously added item.
	targetUrlPatterns?: string[]; //Similar to documentUrlPatterns, but lets you filter based on the src attribute of img/audio/video tags and the href of anchor tags.
	title?: string; //The text to be displayed in the item; this is required unless type is ‘separator’. When the context is ‘selection’, you can use %s within the string to show the selected text. For example, if this parameter’s value is “Translate ‘%s’ to Pig Latin” and the user selects the word “cool”, the context menu item for the selection is “Translate ‘cool’ to Pig Latin”.
	type?: ItemType; //The type of menu item. Defaults to ‘normal’ if not specified.
	viewTypes?: ViewType[]; //List of view types where the menu item will be shown. Defaults to any view, including those without a viewType.
	visible: boolean; //Whether the item is visible in the menu.
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/menus.html#update-id-updateproperties
declare interface MenuUpdateProperties {
	checked?: boolean;
	contexts?: ContextType[];
	documentUrlPatterns?: string[];
	enabled?: boolean;
	icons?: Record<string, unknown>;
	onclick?: MenuOnClickHandler;
	/**
	 * integer,
	 * Note: You cannot change an item to be a child of one of its own descendants.
	 */
	parentId?: number | string;
	targetUrlPatterns?: string[];
	title?: string;
	type?: ItemType;
	viewTypes?: ViewType[];
	/**
	 * Whether the item is visible in the menu.
	 */
	visible?: boolean;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/menus.html
declare interface Menus {
	/**
	 * returns "The ID of the newly created item."
	 */
	create(createProperties: MenuCreateProperties, callback?: () => void): Promise<number | string>;

	/**
	 * Updates a previously created context menu item.
	 *
	 * Required permissions: menus
	 *
	 * @param id The ID of the item to update.
	 * @param updateProperties The properties to update. Accepts the same values as the create function.
	 */
	update(id: number | string, updateProperties: MenuUpdateProperties): void;
	/**
	 * Updates the extension items in the shown menu, including changes that have been made since the menu was shown.
	 * Has no effect if the menu is hidden. Rebuilding a shown menu is an expensive operation, only invoke this method when necessary.
	 * Required permissions: menus
	 */
	refresh(): void;

	remove(menuItemId: number | string): void;
	removeAll(): void;
	//overrideContext(contextOptions)

	/**
	 * Fired when a menu is shown. The extension can add, modify or remove menu items and call menus.refresh() to update the menu.
	 */
	onShown: Listeners<(info: OnShownData, tab?: Tab) => void>;
	onClicked: Listeners<MenuOnClickHandler>;
	onHidden: Listeners<() => void>;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/menus.html#onshown-info-tab
/**
 * Information about the context of the menu action and the created menu items. For more information about each property, see OnClickData.
 * Some properties are only included if the extension has host permission for the given context,
 * for example activeTab for content tabs, compose for compose tabs and messagesRead for message display tabs.
 */
declare interface OnShownData {
	/**
	 * A list of all contexts that apply to the menu.
	 */
	contexts: ContextType[];
	editable: boolean;
	/**
	 * array of None(?), a list of IDs of the menu items that were shown
	 */
	menuIds: (string | number)[];
	/**
	 * [Added in TB 83]
	 * The selected attachments of a message being composed. The compose permission is required.
	 */
	attachments?: ComposeAttachment[];
	/**
	 * Host permission is required.
	 */
	frameUrl?: string;
	/**
	 * Host permission is required.
	 */
	linkText?: string;
	/**
	 * Host permission is required.
	 */
	linkUrl?: string;
	mediaType?: string;
	/**
	 * Host permission is required.
	 */
	pageUrl?: string;
	/**
	 * The selected folder, if the context menu was opened in the folder pane. The accountsRead permission is required.
	 */
	selectedFolder?: MailFolder;
	/**
	 * The selected messages, if the context menu was opened in the message list. The messagesRead permission is required.
	 */
	selectedMessages?: MessageList;
	/**
	 * Host permission is required.
	 */
	selectionText?: string;
	/**
	 * Host permission is required.
	 */
	srcUrl?: string;
	/**
	 * integer
	 */
	targetElementId?: number;
	viewType?: ViewType;
}

//https://thunderbird-webextensions.readthedocs.io/en/latest/compose.html#compose-composeattachment
declare interface ComposeAttachment {
	//fill if needed
}

declare interface Browser {
	runtime: Runtime;
	storage: BrowserStorages;
	windows: BrowserWindows;
	extension: Extension;
	browserAction: BrowserAction;
	tabs: BrowserTabs;

	i18n: Internationalization;
	accounts: Accounts;
	messages: Messages;
	menus: Menus;
}

declare const browser: Browser;
