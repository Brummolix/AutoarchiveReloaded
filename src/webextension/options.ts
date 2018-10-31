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

function saveOptions(): void
{
	const settings: ISettings = {
		globalSettings: {
			//TODO: unsauber, wir "wissen", dass es der richtige Wert sein muss
			archiveType: $("[name=archiveType]:checked").val() as ArchiveType,
			enableInfoLogging: (document.getElementById("enableInfoLogging") as HTMLInputElement).checked,
		},
		accountSettings: {},
	};

	//fill the settings for all accounts
	$("#tabcontent").children().each((index: number, element: HTMLElement) =>
	{
		const accountId: string = $(element).data("accountId");
		if (accountId)
		{
			settings.accountSettings[accountId] = {
				bArchiveUnread: (getElementForAccount(accountId, "archiveUnread") as HTMLInputElement).checked,
				daysUnread: Number((getElementForAccount(accountId, "archiveUnreadDays") as HTMLInputElement).value),
				bArchiveMarked: (getElementForAccount(accountId, "archiveStarred") as HTMLInputElement).checked,
				daysMarked: Number((getElementForAccount(accountId, "archiveStarredDays") as HTMLInputElement).value),
				bArchiveTagged: (getElementForAccount(accountId, "archiveTagged") as HTMLInputElement).checked,
				daysTagged: Number((getElementForAccount(accountId, "archiveTaggedDays") as HTMLInputElement).value),
				bArchiveOther: (getElementForAccount(accountId, "archiveMessages") as HTMLInputElement).checked,
				daysOther: Number((getElementForAccount(accountId, "archiveMessagesDays") as HTMLInputElement).value),
			};
		}
	});

	aaHelper.savePreferencesAndSendToLegacyAddOn(settings, () =>
	{
		//TODO: show popup or similar
	});
}

function restoreOptions()
{
	aaHelper.loadCurrentSettings((settings: ISettings, accounts: IAccountInfo[]) =>
	{
		(document.getElementById("enableInfoLogging") as HTMLInputElement).checked = settings.globalSettings.enableInfoLogging;
		document.querySelectorAll<HTMLInputElement>('input[name="archiveType"]').forEach((element) =>
		{
			element.checked = (element.value === settings.globalSettings.archiveType);
		});

		//Für jeden Account die Einstellungen clonen und die gespeicherten Werte setzen
		//for (let [accountId, accountSetting] of settings.accountSettings)
		for (const accountId in settings.accountSettings)
		{
			if ( settings.accountSettings.hasOwnProperty(accountId) )
			{
				const accountSetting = settings.accountSettings[accountId];
				//TODO: as IAccountInfo ist nicht ganz sauber, wir "wissen", dass es nicht null sein kann...
				const account: IAccountInfo = aaHelper.findAccountInfo(accounts, accountId as string) as IAccountInfo;

				cloneTemplate("§§ID§§-tab", "tablist", account);
				cloneTemplate("accountContent-§§ID§§", "tabcontent", account);

				//mark this element as account
				getJQueryElementForAccount(accountId, "accountContent").data("accountId", accountId);

				(getElementForAccount(accountId, "archiveUnread") as HTMLInputElement).checked = accountSetting.bArchiveUnread;
				(getElementForAccount(accountId, "archiveUnreadDays") as HTMLInputElement).value = accountSetting.daysUnread.toString();
				(getElementForAccount(accountId, "archiveStarred") as HTMLInputElement).checked = accountSetting.bArchiveMarked;
				(getElementForAccount(accountId, "archiveStarredDays") as HTMLInputElement).value = accountSetting.daysMarked.toString();
				(getElementForAccount(accountId, "archiveTagged") as HTMLInputElement).checked = accountSetting.bArchiveTagged;
				(getElementForAccount(accountId, "archiveTaggedDays") as HTMLInputElement).value = accountSetting.daysTagged.toString();
				(getElementForAccount(accountId, "archiveMessages") as HTMLInputElement).checked = accountSetting.bArchiveOther;
				(getElementForAccount(accountId, "archiveMessagesDays") as HTMLInputElement).value = accountSetting.daysOther.toString();
			}
		}
	});
}

function getJQueryElementForAccount(accountId: string, elementId: string): JQuery
{
	const id = elementId + "-" + accountId;
	const jQueryElem = $("#" + id);
	return jQueryElem;
}

function getElementForAccount(accountId: string, elementId: string): HTMLElement
{
	return getJQueryElementForAccount(accountId, elementId)[0];
}

function cloneTemplate(cloneId: string, appendToId: string, accountInfo: IAccountInfo)
{
	const clone = $("#" + cloneId).clone(true, true);
	clone.appendTo("#" + appendToId);

	//make template visible
	clone.removeClass("d-none");

	let html = clone[0].outerHTML;
	html = html.replace(/§§ID§§/g, accountInfo.accountId);
	html = html.replace(/§§TITLE§§/g, accountInfo.accountName);
	clone[0].outerHTML = html;
}

let aaHelper: AutoarchiveReloadedWeOptionHelper = new AutoarchiveReloadedWeOptionHelper();
$(() =>
{
	restoreOptions();
	$("#button").click(saveOptions);
});