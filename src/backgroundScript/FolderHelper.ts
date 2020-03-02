export class FolderHelper
{
	//#41 - before TB 74 the folders were filled completely, starting with TB 64 one must traverse all subfolders
	public static getFoldersRecursivly(folders?: MailFolder[]): MailFolder[]
	{
		if (folders === undefined)
		{
			return [];
		}
		let allFolders: MailFolder[] = [];
		for (const folder of folders)
		{
			allFolders.push(folder);
			allFolders = allFolders.concat(this.getFoldersRecursivly(folder.subFolders));
		}

		return allFolders;
	}
}