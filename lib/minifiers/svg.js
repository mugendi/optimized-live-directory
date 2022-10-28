/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const { optimize } = require('svgo');

async function run(file, opts) {
	// minimize
	try {
		// console.log(file.content.length);
		const result = optimize(file.content, {
			// optional but recommended field
			path: file.path,
			// all config fields are also available here
			multipass: true,
		});

		let optimizedSvgString = result.data;

		file.minified = Buffer.from(optimizedSvgString);
	} catch (error) {
		// console.error(error);
	}
}

module.exports = run;
