/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const CleanCSS = require('clean-css');

function run(file, opts) {
	// minimize
	try {      
		let result = new CleanCSS(opts).minify(file.content);
		// if done without error add minified key
        file.minified = Buffer.from(result.styles);
	} catch (error) {
		// console.error(error);
	}
}

module.exports = run;
