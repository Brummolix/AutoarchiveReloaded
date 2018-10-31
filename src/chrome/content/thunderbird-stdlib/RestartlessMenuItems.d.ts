/*!
Copyright 2018 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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
interface RestartlessMenuItemOptions
{
	id: string; //An id for the <tt>menuitem</tt>, this should be namespaced.
	label: string; // A label for the <tt>menuitem</tt>.
	url?: string; //(optional, preferred) An URL where the <tt>oncommand</tt> should navigate to.
	onCommand?: () => void;//(optional) A function callback what the <tt>menuitem</tt>'s oncommand will call.
	accesskey?: string; //(optional) An access key for the <tt>menuitem</tt>.
	key?: string; // (optional) A shortcut key for the <tt>menuitem</tt>.
	image?: string; //(optional) An URL for the <tt>menuitem</tt>.
	onUnload?: () => void;//(optional) A function for the <tt>menuitem</tt>, which redoes all the stuff
}

declare class RestartlessMenuItems
{
	static add(options: RestartlessMenuItemOptions): void;
	static remove(options: RestartlessMenuItemOptions, keepArray: boolean): void;
	static removeAll(): void;
}
