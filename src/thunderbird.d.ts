/*!
Copyright 2018 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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