/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');

async function run(file, opts) {
	// minimize
	try {

		let optimizedBuffer = await imagemin.buffer(file.buffer, {
			plugins: [
				imageminGifsicle(opts),
			],
		});

		file.minified = optimizedBuffer;
	} catch (error) {
		// console.error(error);
	}
}

module.exports = run;
