/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */

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