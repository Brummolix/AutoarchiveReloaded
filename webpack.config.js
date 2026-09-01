//development does not work in Thunderbird, it will raise CSP errors because of an included "eval"
//production minifies the code which I don't like because errors are all reported on line 1 then
const theMode = "none";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
const outputPath = path.resolve(__dirname, "./dist/release/");

const { defineReactCompilerLoaderOption, reactCompilerLoader } = require('react-compiler-webpack');
const webpack = require('webpack');

const extensions = [".tsx", ".ts", ".js"];

module.exports = [
	{
		name: "webextension", //all "standard" webextension scripts
		mode: theMode,
		entry: {
			background: "./src/backgroundScript/background.ts",
			options: "./src/options/options.tsx",
			popup: "./src/popup/popup.tsx",
		},
		output: {
			path: outputPath,
		},
		module: {
			rules: [{
				test: /\.[mc]?[jt]sx?$/i,
				exclude: /node_modules/,
				use: [
					{
						loader: reactCompilerLoader,
						options: defineReactCompilerLoaderOption({
							// React Compiler options goes here
						})
					},
					// babel-loader, swc-loader, esbuild-loader, or anything you like to transpile JSX should go here.
					// If you are using rspack, the rspack's built-in react transformation is sufficient.
					{
						loader: 'ts-loader'
					},
				]
			}],
		},
		resolve: {
			extensions: extensions,
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify('production'),
			})
		],
		experiments: {
			css: true,
		},
	}
];
