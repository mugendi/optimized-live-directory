/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const fs = require('fs'),
	path = require('path'),
	{ assign: merge } = Object;

const minifiersDir = path.join(__dirname, './minifiers');
const minifiers = fs
	.readdirSync(minifiersDir)
	.map((f) => {

		let nameArr = f.replace('.js', '').split('|').map(s=>s.trim());
		let reqFile = require(path.join(minifiersDir, f))

		return nameArr.map(n=>({[n]:reqFile}))
	})
	.reduce((a,b)=>a.concat(b),[])
	.reduce((a, b) => merge(a, b), {});



class Minifier {
	async minify(file) {
		// if we have a corresponding minifier
		if (file.extension in minifiers) {
			let opts =
				this.opts &&
				this.opts.minify &&
				this.opts.minify[file.extension];

			// if opts is set to false, skip file_type
			if (opts !== null) {
				// console.log(opts);
				await minifiers[file.extension](file, opts);
			}
		}
	}
}

module.exports = Minifier;
