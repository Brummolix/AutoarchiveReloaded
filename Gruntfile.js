/*!
Copyright 2018 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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
module.exports = function(grunt) {

	let srcDir = "src/";
	let outDir = "built/";
	let outDirExtracted = outDir + "/release/";
	let outXpi = outDir + "/AutoArchiveReloaded.xpi";

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		clean: [outDir],
		copy: {
			main: {
				files: [
					{ expand: true, cwd: "resources/", src: ["**"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/backgroundScript/",
													src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/options/",
													src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/webexperiment/",
													src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, src: ["./licence.txt", "./README.md"], dest: outDirExtracted },
				],
			},
		},
		ts: {
			background: {
				tsconfig: "./src/backgroundScript/tsconfig.json",
			},
			settings: {
				tsconfig: "./src/options/tsconfig.json",
			},
			webexperiment: {
				tsconfig: "./src/webexperiment/tsconfig.json",
			},
			release_background: {
				tsconfig: "./src/backgroundScript/tsconfig.release.json",
			},
			release_settings: {
				tsconfig: "./src/options/tsconfig.release.json",
			},
			release_webexperiment: {
				tsconfig: "./src/webexperiment/tsconfig.release.json",
			},
		},
		// make a zipfile
		compress: {
			main: {
				options: {
					archive: outXpi,
					mode: "zip",
				},
				files: [
					{ expand: true, cwd: outDirExtracted, src: ["**"], dest: "/" }, // makes all src relative to cwd
				],
			},
		},
		tslint: {
			options: {
				// can be a configuration object or a filepath to tslint.json
				configuration: "./tslint.json",
				// If set to true, tslint errors will be reported, but not fail the task
				// If set to false, tslint errors will be reported, and the task will fail
				force: false,
				fix: false,
			},
			files: {
				src: [
					srcDir + "/**/*.ts",
					srcDir + "/**/*.js",
					"!src/**/libs/**/*.js",
				],
			},
		},
	});

	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-tslint");

	// Default task(s).
	grunt.registerTask("default",
		["clean", "copy", "ts:background", "ts:settings", "ts:webexperiment", "tslint", "compress"]);
	grunt.registerTask("release",
		["clean", "copy", "ts:release_background", "ts:release_settings", "ts:release_webexperiment", "tslint", "compress"]);
};