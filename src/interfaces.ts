type ArchiveType = "manual" | "startup";

interface IGlobalSettings
{
    archiveType: ArchiveType;
    enableInfoLogging: boolean;
}

interface IAccountSettings
{
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
    
    //we do not use a Map because it is not seralized/deserialized with JSON.stringify and therefore also not stored in the local storage
    //accountSettings: Map<string,IAccountSettings>;

    //we could use TSMap from npm module "typescript-map" but it is a pain to use it for a Thunderbird Addon
    //(the module system does not work with Thunderbird, therefore you had to include it manually and you also had to load it yourself and to even adapt it with EXPORTED_SYMBOLS)
    //accountSettings: TSMap<string,IAccountSettings>;

    //therefore we use a plain old object with an associative array
    accountSettings : { [key:string]:IAccountSettings; }
}

interface IAccountInfo
{
    accountId: string;
    accountName: string;
}