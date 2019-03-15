/*!
Copyright 2013-2018 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
Copyright 2012 Alexey Egorov (original version Autoarchive, http://code.google.com/p/autoarchive/ )

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
ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.import("resource:///modules/MailServices.jsm");
ChromeUtils.import("resource:///modules/iteratorUtils.jsm");

/// <reference path="ClassicTBHelper.ts" />

//Attention it HAVE TO be var, otherwise the extension api is not working
//@ts-ignore: 'autoarchive' is declared but its value is never read
//tslint:disable-next-line: no-var-keyword prefer-const
var autoarchive = class extends ExtensionCommon.ExtensionAPI {
	private toolbarCustomizationDetection: ToolbarCustomizationDetection = new ToolbarCustomizationDetection();
	private archiver: Archiver = new Archiver();
	private legacyOptions: LegacyOptions = new LegacyOptions();

	public getAPI(context: any)
	{
		return {
			autoarchive: {
				alert: async (title: string, text: string): Promise<void> =>
				{
					await ClassicTBHelper.getThePromptService().alert(null, title, text);
				},
				confirm: async (title: string, text: string): Promise<boolean> =>
				{
					return await ClassicTBHelper.getThePromptService().confirm(null, title, text);
				},
				startToArchiveMessages: async (messageIds: number[]): Promise<number> =>
				{
					try
					{
						return this.archiver.startToArchiveMessages(messageIds);
					}
					catch (e)
					{
						log.error(e);
						throw e;
					}
				},
				initToolbarConfigurationObserver: (): void =>
				{
					try
					{
						this.toolbarCustomizationDetection.registerToolbarCustomizationListener(ClassicTBHelper.getMail3Pane());
					}
					catch (e)
					{
						log.error(e);
						throw e;
					}
				},
				//normally it did not have to be async, but the return value did not work in this case
				isToolbarConfigurationOpen: async (): Promise<boolean> =>
				{
					return this.toolbarCustomizationDetection.isInToolbarCustomize;
				},
				askForLegacyPreferences: async (accounts: IAccountInfo[]): Promise<ISettings | null> =>
				{
					log.info("askForLegacyPreferences");
					try
					{
						return this.legacyOptions.askForLegacyPreferences(accounts);
					}
					catch (e)
					{
						log.error(e);
						throw e;
					}
				},
				setInfoLogging: (value: boolean): void =>
				{
					logLevelInfo.enableInfoLogging = value;
				},
			},
		};
	}
};