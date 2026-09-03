/*!
Copyright 2019-2026 Brummolix (AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

import { GlobalStates } from "../sharedWebextension/GlobalStates";
import { ArchiveManuallyMessageRequest, GetArchiveStatusMessageRequest, GetArchiveStatusResponse } from "../sharedWebextension/Messages";
import { log } from "../sharedWebextension/LoggerWebextension";
import { ReactElement } from "react";
import { createReactRoot } from "../sharedWebextension/createReactRoot";
import { localize } from "../sharedWebextension/localize";
import "../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./popup.css";

async function initialize(): Promise<GlobalStates> {
	const message: GetArchiveStatusMessageRequest = { message: "getArchiveStatus" };
	const response: GetArchiveStatusResponse = await browser.runtime.sendMessage(message);
	const status: GlobalStates = response.status;

	switch (status) {
		case GlobalStates.uninitialized: {
			log.info("not initialized, cancel");
			break;
		}
		case GlobalStates.inProgress: {
			log.info("busy with other archive..., cancel");
			break;
		}
		case GlobalStates.readyForWork: {
			log.info("user can start archiving");
			break;
		}
	}
	return status;
}

async function onManualArchive(): Promise<void> {
	const message: ArchiveManuallyMessageRequest = { message: "archiveManually" };
	await browser.runtime.sendMessage(message);
	window.close();
}

function Popup(props: { status: GlobalStates }): ReactElement {
	return (
		<>
			<div></div>
			<div id="text" className="alert alert-warning" role="alert">
				{((): string => {
					switch (props.status) {
						case GlobalStates.uninitialized:
							return localize("waitForInit");
						case GlobalStates.inProgress:
							return localize("waitForArchive");
						case GlobalStates.readyForWork:
							return localize("dialogStartManualText");
					}
				})()}
			</div>
			{props.status === GlobalStates.readyForWork && (
				<div>
					{/*eslint-disable-next-line @typescript-eslint/no-misused-promises*/}
					<button id="button" type="button" className="btn btn-primary btn-lg" onClick={onManualArchive}>
						{localize("buttonArchive")}
					</button>
				</div>
			)}
			<div></div>
		</>
	);
}

async function onLoad(): Promise<void> {
	try {
		const status = await initialize();
		createReactRoot().render(<Popup status={status} />);
	} catch (e) {
		log.errorException(e);
		throw e;
	}
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener("load", onLoad);
