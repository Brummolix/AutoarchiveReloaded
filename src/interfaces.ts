type ArchiveType = "manual" | "startup";

interface IGlobalSettings
{
    archiveType: ArchiveType;
    enableInfoLogging: boolean;
}

interface IAccountSettings
{
    accountId: string,
    //TODO: remove
    accountName: string,
    bArchiveOther: boolean,
    daysOther: number,
    bArchiveMarked: boolean,
    daysMarked: number,
    bArchiveTagged: boolean,
    daysTagged: number,
    bArchiveUnread: boolean,
    daysUnread: number

}

interface ISettings
{
    globalSettings:IGlobalSettings;
    accountSettings:IAccountSettings[];
}