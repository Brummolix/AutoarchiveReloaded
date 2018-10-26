//TODO: remove any's?

declare var browser:any;
declare var Components:any;

declare var Cu:any;
declare var Cc:any;
declare var Ci:any;
declare var FileUtils:any;
declare var Application:any;
declare var MailServices:any;
declare var AddonManager:any;
declare function fixIterator(collection:any[],objectType:any):any;

type nsIPrefBranch = any;
type Mail3Pane = any;

type nsIMsgTag = any;

declare class nsIMsgDBHdr{
    isRead:boolean;
    isFlagged:boolean;
    dateInSeconds:number;
    folder:nsIMsgFolder;
}

type nsIConsoleService = any;
type nsIActivityProcess = any;
type nsIMsgFolder = any;
type nsIActivityManager = any;
type BatchMessageMover = any;
type nsIMsgAccount = any;
type nsIMsgIncomingServer = any;
type nsIPromptService = any;
type nsIXULAppInfo = any;
type nsIStringBundle = any;