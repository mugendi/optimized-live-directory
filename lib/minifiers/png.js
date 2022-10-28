/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const imagemin = require('imagemin');
//  const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

async function run(file, opts) {
	// minimize
	try {

		let optimizedBuffer = await imagemin.buffer(file.buffer, {
			plugins: [
				imageminPngquant(opts),
			],
		});

		file.minified = optimizedBuffer;
	} catch (error) {
		// console.error(error);
	}
}

module.exports = run;
