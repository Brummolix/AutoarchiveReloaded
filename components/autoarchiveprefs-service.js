Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function AutoarchiveManagerExtension() {
}

AutoarchiveManagerExtension.prototype = {
    name:"autoarchiveprefs",
    chromePackageName:'autoarchive',
    classID:Components.ID("{ac4f0da9-5240-487e-992c-7cf3c622a9ad}"),
    classDescription:"Autoarchive Account Manager Extension Service",
    contractID:"@mozilla.org/accountmanager/extension;1?name=autoarchiveprefs",
    _xpcom_categories:[
        {
            category:"mailnews-accountmanager-extensions"
        }
    ],
    showPanel:function (server) {
        // show Autoarchive panel for POP3, IMAP, NNTP and "movemail" (unix) account types
        switch (server.type) {
            case "nntp":
            case "imap":
            case "pop3":
            case "movemail":
                return true;
        }
        return false;
    },
    QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIMsgAccountManagerExtension])
};

if (XPCOMUtils.generateNSGetFactory) {
    // Gecko >= 2.0
    const NSGetFactory = XPCOMUtils.generateNSGetFactory([AutoarchiveManagerExtension]);
}
else {
    // Gecko <= 1.9.x
    var NSGetModule = XPCOMUtils.generateNSGetModule([AutoarchiveManagerExtension], postModuleRegisterCallback);

}

function postModuleRegisterCallback (compMgr, fileSpec, componentsArray) {
    dump("Autoarchive account manager extension registered\n");
}
