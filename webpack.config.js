// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
const { defineReactCompilerLoaderOption, reactCompilerLoader } = require('react-compiler-webpack');
const webpack = require('webpack');

module.exports = [
	{
		name: "webextension", //all "standard" webextension scripts

		//"development" does not work in Thunderbird, it will raise CSP errors because of an included "eval"
		//"production" minifies the code which I don't like because errors are all reported on line 1 then
		mode: "none",
		entry: {
			background: "./src/backgroundScript/background.ts",
			options: "./src/options/options.tsx",
			popup: "./src/popup/popup.tsx",
		},
		output: {
			path: path.resolve(__dirname, "./dist/release/"),
		},
		module: {
			rules: [
				{
					test: /\.[mc]?[jt]sx?$/i,
					exclude: /node_modules/,
					use: [
						{
							loader: reactCompilerLoader,
							options: defineReactCompilerLoaderOption({}),
						},
						{
							loader: "ts-loader",
						},
					],
				},
			],
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js"],
		},
		plugins: [new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('production')})],
		experiments: {
			css: true,
		},
	},
];
