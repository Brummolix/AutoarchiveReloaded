/*!
Copyright 2018-2019 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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
export type ArchiveType = "manual" | "startup";

export interface IGlobalSettings
{
	archiveType: ArchiveType;
	enableInfoLogging: boolean;
}

export interface IAccountSettings
{
	bArchiveOther: boolean;
	daysOther: number;
	bArchiveMarked: boolean;
	daysMarked: number;
	bArchiveTagged: boolean;
	daysTagged: number;
	bArchiveUnread: boolean;
	daysUnread: number;
}

export interface IAccountSettingsArray
{
	[key: string]: IAccountSettings;
}

export interface ISettings
{
	globalSettings: IGlobalSettings;

	//we do not use a Map because it is not seralized/deserialized with JSON.stringify and therefore also not stored in the local storage
	//accountSettings: Map<string,IAccountSettings>;

	//we could use TSMap from npm module "typescript-map" but it is a pain to use it for a Thunderbird Addon
	//(the module system does not work with Thunderbird, therefore you had to include it manually and you also had to load it yourself and to even adapt it with EXPORTED_SYMBOLS)
	//accountSettings: TSMap<string,IAccountSettings>;

	//therefore we use a plain old object with an associative array
	accountSettings: IAccountSettingsArray;
}

export interface IAccountInfo
{
	accountId: string;
	accountName: string;
	order: number;
}