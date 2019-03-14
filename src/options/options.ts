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

async function saveOptions(): Promise<void>
{
	try
	{
		const settings: ISettings = {
			globalSettings: {
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

		await aaHelper.savePreferencesAndSendToLegacyAddOn(settings);
		//show toast
		($ as any).notify({
			// options
			message: "__MSG_settingsSaved__",
		}, {
				// settings
				type: "success",
				allow_dismiss: false,
				placement: {
					from: "top",
					align: "center",
				},
				animate: {
					enter: "animated bounceInDown",
					exit: "animated bounceOutUp",
				},
			});

		//update translations...
		l10n.updateDocument();
	}
	catch (e)
	{
		AutoarchiveReloaded.loggerWebExtension.errorException(e);
		throw e;
	}

}

async function restoreOptions()
{
	const settings: ISettings = await aaHelper.loadCurrentSettings();
	(document.getElementById("enableInfoLogging") as HTMLInputElement).checked = settings.globalSettings.enableInfoLogging;
	document.querySelectorAll<HTMLInputElement>('input[name="archiveType"]').forEach((element) =>
	{
		element.checked = (element.value === settings.globalSettings.archiveType);
	});

	//Für jeden Account die Einstellungen clonen und die gespeicherten Werte setzen
	const accounts: IAccountInfo[] = await aaHelper.askForAccounts();
	const accountsSorted: IAccountInfos[] = [];
	for (const accountId in settings.accountSettings)
	{
		if (settings.accountSettings.hasOwnProperty(accountId))
		{
			accountsSorted.push({
				account: aaHelper.findAccountInfo(accounts, accountId) as IAccountInfo,
				accountSetting: settings.accountSettings[accountId],
			});
		}
	}

	accountsSorted.sort((a: IAccountInfos, b: IAccountInfos): number =>
	{
		if (a.account.order === b.account.order)
		{
			return 0;
		}

		if (a.account.order < b.account.order)
		{
			return -1;
		}

		return 1;
	});

	accountsSorted.forEach((accountInfos) =>
	{
		const account = accountInfos.account;
		const accountId = accountInfos.account.accountId;
		const accountSetting = accountInfos.accountSetting;
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

async function onLoad()
{
	try
	{
		await restoreOptions();
		$("#button").click(saveOptions);
	}
	catch (e)
	{
		AutoarchiveReloaded.loggerWebExtension.errorException(e);
		throw e;
	}
}
let aaHelper: AutoarchiveReloaded.OptionHelper = new AutoarchiveReloaded.OptionHelper();
$(onLoad);