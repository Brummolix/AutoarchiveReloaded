ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

//Attention it HAVE TO be var, otherwise the extension api is not working
// tslint:disable-next-line: no-var-keyword
var autoarchive = class extends ExtensionCommon.ExtensionAPI {
	public getAPI(context: any)
	{
		return {
			autoarchive: {
				alert: async (title: string, text: string): Promise<any> =>
				{
					getThePromptService().alert(null, title, text);
					//Services.wm.getMostRecentWindow("mail:3pane").alert("Hello " + name + "!");
				},
			},
		};
	}
};

function getThePromptService(): Ci.nsIPromptService
{
	return Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
}