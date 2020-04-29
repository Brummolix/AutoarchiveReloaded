/*!
Copyright 2020 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

export class FolderHelper {
	//#41 - before TB 74 the folders were filled completely, starting with TB 64 one must traverse all subfolders
	public static getFoldersRecursivly(folders?: MailFolder[]): MailFolder[] {
		if (folders === undefined) {
			return [];
		}
		let allFolders: MailFolder[] = [];
		for (const folder of folders) {
			allFolders.push(folder);
			allFolders = allFolders.concat(this.getFoldersRecursivly(folder.subFolders));
		}

		return allFolders;
	}
}
