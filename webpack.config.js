//development does not work in Thunderbird, it will raise CSP errors because of an included "eval"
//production minifies the code which I don't like because errors are all reported on line 1 then
const theMode = "none";
const path = require("path");
const outputPath = path.resolve(__dirname, "./built/release/");

module.exports = [
	{
		name: "webextension", //all "standard" webextension scripts
		mode: theMode,
		entry: {
			background: "./built/compile/backgroundScript/background.js",
			options: "./built/compile/options/options.js",
			popup: "./built/compile/popup/popup.js",
		},
		output: {
			path: outputPath,
		},
	},
	{
		name: "experiment", //the experiment needs a different output configuration
		mode: theMode,
		entry: "./built/compile/webexperiment/autoarchive-api.js",
		output: {
			filename: "autoarchive-api.js",
			path: outputPath,

			//export the default class under the variable "autoarchive"!
			library: "autoarchive",
			libraryExport: "default",
		},
	},
];