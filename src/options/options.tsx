/*!
Copyright 2018-2026 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

import { AccountInfo, Settings } from "../sharedWebextension/interfaces";
import { AccountInfoProvider } from "../sharedWebextension/AccountInfo";
import { log } from "../sharedWebextension/LoggerWebextension";
import { OptionHelper } from "../sharedWebextension/optionHelper";
import { createRoot } from "react-dom/client";
import { OptionsPage } from "./OptionsPage";

async function saveOptions(settings: Settings): Promise<void> {
	try {
		await optionHelper.savePreferencesAndPublishForLogging(settings);
	} catch (e) {
		log.errorException(e);
		throw e;
	}
}

async function getAccountsSorted(settings: Settings): Promise<AccountInfo[]> {
	const accounts: AccountInfo[] = await AccountInfoProvider.askForAccounts();
	const accountsSorted: AccountInfo[] = [];
	for (const accountId in settings.accountSettings) {
		if (settings.accountSettings.hasOwnProperty(accountId)) {
			accountsSorted.push(AccountInfoProvider.findAccountInfo(accounts, accountId) as AccountInfo);
		}
	}

	accountsSorted.sort((a: AccountInfo, b: AccountInfo): number => {
		if (a.order === b.order) {
			return 0;
		}

		if (a.order < b.order) {
			return -1;
		}

		return 1;
	});
	return accountsSorted;
}

async function onLoad(): Promise<void> {
	try {
		const domNode = document.getElementById("react");
		if (domNode == null) {
			log.error("no element react");
			return;
		}
		const settings: Settings = await optionHelper.loadCurrentSettings();
		const accountsSorted = await getAccountsSorted(settings);

		const root = createRoot(domNode);
		root.render(<OptionsPage accounts={accountsSorted} settings={settings} onSave={saveOptions} />);
	} catch (e) {
		log.errorException(e);
		throw e;
	}
}

const optionHelper: OptionHelper = new OptionHelper();
// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener("load", onLoad);
