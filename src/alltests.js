/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

//bundle all tests into on file, see https://github.com/webpack/webpack/issues/370

//context is a webpack enhancement without types, therefore use any...
//see https://webpack.js.org/guides/dependency-management/#requirecontext
//see https://webpack.js.org/guides/dependency-management/#context-module-api
const testContext = require.context("./", true, /test\.ts$/);
testContext.keys().forEach(testContext);
