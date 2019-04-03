/*!
Copyright 2013-2019 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )
Copyright 2012 Alexey Egorov (original version Autoarchive, http://code.google.com/p/autoarchive/ )

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
class ToolbarCustomizationDetection
{
	private bIsInToolbarCustomize: boolean = false;

	get isInToolbarCustomize(): boolean
	{
		return this.bIsInToolbarCustomize;
  }

	public registerToolbarCustomizationListener(window: Window): void
	{
		if (!window)
		{
			return;
		}

		window.addEventListener("aftercustomization", this.afterCustomize.bind(this));
		window.addEventListener("beforecustomization", this.beforeCustomize.bind(this));
	}

	//TODO: how to remove?
	//event is still registered after AddOn is deactivated
	//if AddOn is reactivated, 2 listners are registered
	//- using browser.runtime.onSuspend in background script did not work, onSuspend does not exist
	//- using browser.runtime.getBackgroundPage().addListener("unload"), unload event is fired, but web experiment api can not be called
	// @ts-ignore: noUnusedLocals
	private removeToolbarCustomizationListener(window: Window): void
	{
		if (!window)
		{
			return;
		}

		window.removeEventListener("aftercustomization", this.afterCustomize);
		window.removeEventListener("beforecustomization", this.beforeCustomize);
	}

	private beforeCustomize(e: Event): void
	{
		log.info("toolbar customization detected");
		this.bIsInToolbarCustomize = true;
		console.log(this.bIsInToolbarCustomize);
	}

	private afterCustomize(e: Event): void
	{
		log.info("toolbar customization ended");
		this.bIsInToolbarCustomize = false;
	}
}