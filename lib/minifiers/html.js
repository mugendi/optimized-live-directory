/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const minify = require('html-minifier').minify;

function run(file, opts) {
	// minimize
	try {      
		let result = minify(file.content, opts);
		// if done without error add minified key
        file.minified = Buffer.from(result);
	} catch (error) {
		// console.error(error.message);
	}
}

module.exports = run;
