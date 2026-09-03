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

import { ReactElement, useState } from "react";
import { localize } from "../sharedWebextension/localize";
import { AccountInfo, AccountSettingsArray, ArchiveType, Settings } from "../sharedWebextension/interfaces";
import "animate.css";

export function OptionsPage(props: { accounts: AccountInfo[]; settings: Settings; onSave: (settings: Settings) => Promise<void> }): ReactElement {
	// At the moment we have no state.
	// Instead, we fill the form with the initial value. On save button we build the data from the form elements.
	// (React: uncontrolled inputs)
	// If we need it, we could also define everything as react state and use controlled inputs which update the state on every onChange.

	const [showToast, setShowToast] = useState(false);

	const handleSave = async (): Promise<void> => {
		//build settings from fields
		const settings: Settings = {
			globalSettings: {
				archiveType: archiveType(radioValue("archiveType")),
				enableInfoLogging: input("enableInfoLogging").checked,
			},
			accountSettings: props.accounts.reduce<AccountSettingsArray>(
				(result, account) => ({
					...result,
					[account.accountId]: {
						bArchiveOther: inputAccount(account.accountId, "archiveMessages").checked,
						daysOther: Number(inputAccount(account.accountId, "archiveMessagesDays").value),
						bArchiveMarked: inputAccount(account.accountId, "archiveStarred").checked,
						daysMarked: Number(inputAccount(account.accountId, "archiveStarredDays").value),
						bArchiveTagged: inputAccount(account.accountId, "archiveTagged").checked,
						daysTagged: Number(inputAccount(account.accountId, "archiveTaggedDays").value),
						bArchiveUnread: inputAccount(account.accountId, "archiveUnread").checked,
						daysUnread: Number(inputAccount(account.accountId, "archiveUnreadDays").value),
						bArchiveTrashFolders: inputAccount(account.accountId, "archiveTrashFolders").checked,
						bArchiveJunkFolders: inputAccount(account.accountId, "archiveJunkFolders").checked,
						bArchiveOutboxFolders: inputAccount(account.accountId, "archiveOutboxFolders").checked,
						bArchiveDraftFolders: inputAccount(account.accountId, "archiveDraftFolders").checked,
						bArchiveTemplateFolders: inputAccount(account.accountId, "archiveTemplateFolders").checked,
						bArchiveArchiveFolders: inputAccount(account.accountId, "archiveArchiveFolders").checked,
					},
				}),
				{}
			),
		};
		await props.onSave(settings);
		setShowToast(true);
		setTimeout(() => setShowToast(false), 3000);
	};

	return (
		<div className="container">
			<div className="m-3"></div>
			<h3>{localize("settingsHeadline")}</h3>
			<div className="card">
				<div className="card-header">
					<ul className="nav nav-tabs card-header-tabs" role="tablist" id="tablist">
						<li className="nav-item">
							<a className="nav-link active" data-bs-toggle="tab" id="global-tab" href="#global" role="tab" aria-controls="home" aria-selected="true">
								{localize("globalSettings")}
							</a>
						</li>
						{props.accounts.map((account) => (
							<li className="nav-item" id={account.accountId + "-tab"}>
								<a
									className="nav-link"
									data-bs-toggle="tab"
									id={`${account.accountId}-link-tab`}
									href={`#accountContent-${account.accountId}`}
									role="tab"
									aria-controls="profile"
									aria-selected="false"
								>
									{account.accountName}
								</a>
							</li>
						))}
					</ul>
				</div>
				<div className="tab-content" id="tabcontent">
					<div id="global" className="tab-pane fade show active card-body" role="tabpanel" aria-labelledby="global-tab">
						<form>
							<fieldset className="row">
								<legend className="col-form-label col-sm-2 pt-0">{localize("archiveTypeTitle")}</legend>
								<div className="col-sm-10">
									<Radio
										name="archiveType"
										id="archiveTypeManual"
										value="manual"
										checked={props.settings.globalSettings.archiveType === "manual"}
										labelId="archiveTypeManual"
									/>
									<Radio
										name="archiveType"
										id="archiveTypeStartup"
										value="startup"
										checked={props.settings.globalSettings.archiveType === "startup"}
										labelId="archiveTypeStartup"
									/>
									<div className="pt-3" role="alert">
										{localize("globalSettingsStartupDescription")}
									</div>
								</div>
							</fieldset>
							<br />
							<div className="row">
								<div className="col-sm-2">{localize("logging")}</div>
								<div className="col-sm-10">
									<Checkbox
										name="enableInfoLogging"
										id="enableInfoLogging"
										value="enableInfoLogging"
										checked={props.settings.globalSettings.enableInfoLogging}
										labelId="enableInfoLoggingOption"
									/>
								</div>
							</div>
						</form>

						<br />
						<div className="alert alert-primary" role="alert">
							{localize("globalSettingsDescription")}
						</div>
					</div>
					{props.accounts.map((account) => (
						<div
							id={"accountContent-" + account.accountId}
							className="tab-pane fade card-body"
							role="tabpanel"
							aria-labelledby={account.accountId + "-link-tab"}
						>
							<h4>{localize("accountSettingTitle").replace("§§TITLE§§", account.accountName)}</h4>

							<div className="input-group mb-3">
								<CheckWithDays
									accountId={account.accountId}
									id="archiveUnread"
									labelId="archiveUnread"
									checked={props.settings.accountSettings[account.accountId].bArchiveUnread}
									days={props.settings.accountSettings[account.accountId].daysUnread}
								/>
							</div>

							<div className="input-group mb-3">
								<CheckWithDays
									accountId={account.accountId}
									id="archiveStarred"
									labelId="archiveStarred"
									checked={props.settings.accountSettings[account.accountId].bArchiveMarked}
									days={props.settings.accountSettings[account.accountId].daysMarked}
								/>
							</div>

							<div className="input-group mb-3">
								<CheckWithDays
									accountId={account.accountId}
									id="archiveTagged"
									labelId="archiveTagged"
									checked={props.settings.accountSettings[account.accountId].bArchiveTagged}
									days={props.settings.accountSettings[account.accountId].daysTagged}
								/>
							</div>

							<div className="input-group mb-3">
								<CheckWithDays
									accountId={account.accountId}
									id="archiveMessages"
									labelId="archiveMessages"
									checked={props.settings.accountSettings[account.accountId].bArchiveOther}
									days={props.settings.accountSettings[account.accountId].daysOther}
								/>
							</div>

							<div>{localize("settingsDescription2")}</div>
							<div className="m-3"></div>

							<div className="accordion" id={"accordionSpecialFolders-" + account.accountId}>
								<div className="accordion-item">
									<h2 className="accordion-header" id={"specialFoldersHeading-" + account.accountId}>
										<button
											className="accordion-button collapsed"
											type="button"
											data-bs-toggle="collapse"
											data-bs-target={"#collapseSpecialFolders-" + account.accountId}
											aria-expanded="false"
											aria-controls={"collapseSpecialFolders-" + account.accountId}
										>
											{localize("specialFolderSettings")}
										</button>
									</h2>
									<div
										id={"collapseSpecialFolders-" + account.accountId}
										className="accordion-collapse collapse"
										aria-labelledby={"specialFoldersHeading-" + account.accountId}
										data-bs-parent={"#accordionSpecialFolders-" + account.accountId}
									>
										<div className="accordion-body">
											<div>{localize("specialFolderSettingsDescription")}</div>
											<div className="m-3"></div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveTrashFolders"
													labelId="archiveTrashFolders"
													checked={props.settings.accountSettings[account.accountId].bArchiveTrashFolders}
												/>
											</div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveJunkFolders"
													labelId="archiveJunkFolders"
													checked={props.settings.accountSettings[account.accountId].bArchiveJunkFolders}
												/>
											</div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveOutboxFolders"
													labelId="archiveOutboxFolders"
													checked={props.settings.accountSettings[account.accountId].bArchiveOutboxFolders}
												/>
											</div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveDraftFolders"
													labelId="archiveDraftFolders"
													checked={props.settings.accountSettings[account.accountId].bArchiveDraftFolders}
												/>
											</div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveTemplateFolders"
													labelId="archiveTemplateFolders"
													checked={props.settings.accountSettings[account.accountId].bArchiveTemplateFolders}
												/>
											</div>
											<div className="input-group mb-3">
												<CheckboxNice
													accountId={account.accountId}
													id="archiveArchiveFolders"
													labelId="archiveArchiveFolders"
													labelId2="archiveArchiveFoldersHint"
													checked={props.settings.accountSettings[account.accountId].bArchiveArchiveFolders}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="m-3"></div>
			<div>
				{/*TODO: disable button and only enable on changes - or remove save button at all and save immediately (at least when valid)*/}
				{/*eslint-disable-next-line @typescript-eslint/no-misused-promises*/}
				<button className="btn btn-primary" id="button" type="button" onClick={handleSave}>
					{localize("saveSettings")}
				</button>

				<div className="m-3"></div>

				<div className={"alert alert-success " + (showToast ? "animate__animated animate__pulse" : "d-none")} role="alert">
					{localize("settingsSaved")}
				</div>
			</div>

			<div>&nbsp;</div>
			<div className="alert alert-primary" role="alert">
				{localize("usageHelp")}
			</div>
		</div>
	);
}

function input(id: string): HTMLInputElement {
	const element = document.getElementById(id);
	if (element instanceof HTMLInputElement) {
		return element;
	}

	throw Error("Element with id " + id + " is no input");
}

function inputAccount(accountId: string, name: string): HTMLInputElement {
	return input(name + "-" + accountId);
}

function radioValue(name: string): string {
	const element = document.querySelector('input[name="' + name + '"]:checked');
	if (element instanceof HTMLInputElement) {
		return element.value;
	}

	throw Error("Element with name " + name + " is no input/has no checked value");
}

function Radio(props: { name: string; id: string; value: string; checked: boolean; labelId: string }): ReactElement {
	return (
		<div className="form-check">
			<input className="form-check-input" type="radio" name={props.name} id={props.id} value={props.value} defaultChecked={props.checked} />
			<label className="form-check-label" htmlFor={props.id}>
				{localize(props.labelId)}
			</label>
		</div>
	);
}

function Checkbox(props: { name: string; id: string; value: string; checked: boolean; labelId: string }): ReactElement {
	return (
		<div className="form-check">
			<input className="form-check-input" type="checkbox" name={props.name} id={props.id} value={props.value} defaultChecked={props.checked} />
			<label className="form-check-label" htmlFor={props.id}>
				{" "}
				{localize(props.labelId)}
			</label>
		</div>
	);
}

function CheckWithDays(props: { accountId: string; id: string; labelId: string; checked: boolean; days: number }): ReactElement {
	const inputCheckboxId = props.id + "-" + props.accountId;
	return (
		<>
			<div className="input-group-text">
				<input className="form-check-input" type="checkbox" id={inputCheckboxId} defaultChecked={props.checked} />
			</div>
			<label className="input-group-text" htmlFor={inputCheckboxId}>
				{localize(props.labelId)}
			</label>
			<div className="input-group-text col-lg-1 col-md-2 col-sm-2">
				<input type="text" className="form-control" id={props.id + "Days-" + props.accountId} defaultValue={props.days.toString()} />
			</div>
			<span className="input-group-text">{localize("days")}</span>
		</>
	);
}

function CheckboxNice(props: { accountId: string; id: string; checked: boolean; labelId: string; labelId2?: string }): ReactElement {
	const inputId = props.id + "-" + props.accountId;
	return (
		<>
			<div className="input-group-text">
				<input className="form-check-input" type="checkbox" id={inputId} defaultChecked={props.checked} />
			</div>
			<label className="input-group-text text-start" htmlFor={inputId}>
				{localize(props.labelId)}
				{props.labelId2 && (
					<>
						<br />
						{localize(props.labelId2)}
					</>
				)}
			</label>
		</>
	);
}

function archiveType(value: string): ArchiveType {
	if (value === "manual" || value === "startup") {
		return value;
	}

	throw new Error("wrong ArchiveType " + value);
}
