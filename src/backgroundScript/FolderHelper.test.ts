/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */

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

/// <reference path="../sharedAll/thunderbird.d.ts" />

import { assert } from "assertthat";
import { FolderHelper } from "./FolderHelper";

describe("FolderHelper", () => {
	describe("#getFoldersRecursivly()", () => {
		it("should work with <TB74 folders (no subfolders) ", () => {
			const folder1: MailFolder = {
				accountId: "",
				path: "",
				name: "folder1",
				type: "inbox",
			};
			const folder2: MailFolder = {
				accountId: "",
				path: "",
				name: "folder2",
				type: "inbox",
			};
			const folders: MailFolder[] = [folder1, folder2];
			const allfolders = FolderHelper.getFoldersRecursivly(folders);

			assert.that(allfolders).is.equalTo([folder1, folder2]);
		});

		it("should work with TB74 folders (subfolders)", () => {
			const subFolder1_1: MailFolder = {
				accountId: "",
				path: "",
				name: "subfolder1.1",
				type: "inbox",
			};
			const subfolder1_2: MailFolder = {
				accountId: "",
				path: "",
				name: "subfolder1.2",
				type: "inbox",
			};
			const folder1: MailFolder = {
				accountId: "",
				path: "",
				name: "folder1",
				type: "inbox",
				subFolders: [subFolder1_1, subfolder1_2],
			};
			const subfolder2_1_1: MailFolder = {
				accountId: "",
				path: "",
				name: "subfolder2.1.1",
				type: "inbox",
			};
			const subfolder2_1_2: MailFolder = {
				accountId: "",
				path: "",
				name: "subfolder2.1.2",
				type: "inbox",
			};
			const subfolder2_1: MailFolder = {
				accountId: "",
				path: "",
				name: "subfolder2.1",
				type: "inbox",
				subFolders: [subfolder2_1_1, subfolder2_1_2],
			};
			const folder2: MailFolder = {
				accountId: "",
				path: "",
				name: "folder2",
				type: "inbox",
				subFolders: [subfolder2_1],
			};
			const folder3: MailFolder = {
				accountId: "",
				path: "",
				name: "folder3",
				type: "inbox",
			};
			const folders: MailFolder[] = [folder1, folder2, folder3];
			const allfolders = FolderHelper.getFoldersRecursivly(folders);

			assert.that(allfolders).is.equalTo([folder1, subFolder1_1, subfolder1_2, folder2, subfolder2_1, subfolder2_1_1, subfolder2_1_2, folder3]);
		});
	});
});