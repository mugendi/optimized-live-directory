/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const { minify } = require('terser');

async function run(file, opts) {
	// minimize
	try {
		let result = await minify(file.content, opts);
		// if done without error add minified key
		file.minified = Buffer.from(result.code);
	} catch (error) {
		// console.error(error);
	}
}

module.exports = run;
