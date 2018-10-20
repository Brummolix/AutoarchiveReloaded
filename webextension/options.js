function saveOptions(e) {
  //e.preventDefault();
  browser.storage.local.set({
    color: document.querySelector("#color").value
  });
 
console.log("save Options");
}

function restoreOptions() {

  function setCurrentChoice(result) {
    console.log("option " + result.color);
    document.querySelector("#color").value = result.color;// || "blue";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.local.get("color");
  getting.then(setCurrentChoice, onError);

 console.log("restoreOptions");
}

console.log("options.js is here");

/*var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
console.log(prefs);
console.log(prefs.getBranch("extensions.AutoarchiveReloaded.").getCharPref("archiveType"));
*/

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("button").addEventListener("click",saveOptions)
//document.querySelector("form").addEventListener("submit", saveOptions);