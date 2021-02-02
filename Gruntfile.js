/*!
Copyright 2018-2020 Brummolix (new version AutoarchiveReloaded, https://github.com/Brummolix/AutoarchiveReloaded )

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

//this is no typescript file!
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpackConfig = require("./webpack.config.js");

module.exports = (grunt) => {
	const srcDir = "src/";
	const outDir = "built/";
	const outDirExtracted = outDir + "/release/";
	const outXpi = outDir + "/AutoArchiveReloaded.xpi";

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		clean: [outDir],
		copy: {
			main: {
				files: [
					{ expand: true, cwd: "resources/", src: ["**"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/backgroundScript/", src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/options/", src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/webexperiment/", src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, cwd: srcDir + "/popup/", src: ["**", "!**/*.ts", "!**/tsconfig*.json"], dest: outDirExtracted },
					{ expand: true, src: ["./licence.txt", "./README.md"], dest: outDirExtracted },
				],
			},
		},
		mochaTest: {
			test: {
				options: {
					reporter: "spec",
				},
				src: ["./dist/test.js"],
			},
		},
		webpack: {
			myConfig: webpackConfig,
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
		eslint: {
			target: [srcDir + "/**/*.ts", srcDir + "/**/*.js", "!src/**/libs/**/*.js"],
		},
	});

	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-webpack");
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-mocha-test");

	//tasks
	grunt.registerTask("default", ["clean", "copy", "webpack", "compress", "mochaTest", "eslint"]);
};
