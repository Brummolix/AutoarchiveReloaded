Development hints:

- typescript is used to translate files to javascript
- npm is used to install needed dependencies
- grunt is used to build everything
- Visual Studio Code can be used for editing

- how to install?
	- install Visual Studio code
	- install node (on windows also make sure to to install the native build tools that comes with the node installer)
	- install needed node packages
		- open shell at project dir or open terminal in visual studio code
		- run "npm install"
	- now you should be able to build with grunt and/or visual studio code
		npx grunt

- how to install a new npm/grunt module?
	npm install MODULENAME --save-dev
		- it will refresh package.json und package-lock.json
		- it will install the module under node_modules (which is excluded from git)

- module system
	Typescript code uses import/export statements
	The code is translated from typescript to Js and then packed with webpack to single js files including all needed modules.
- directory structure
	src/sharedWebextension - contains all sources used by the webextension scripts
	src/options - contains the sources for the option page
		uses sharedWebextension
	src/backgroundScript - contains the sources for the backgroundScript
		uses sharedWebextension
	src/resources - contains all files that are needed additionally