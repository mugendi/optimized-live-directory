/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const LiveDirectory = require('live-directory'),
	{ existsSync, statSync, createReadStream, readFileSync } = require('fs'),
	path = require('path'),
	{ assign: merge } = Object,
	Events = require('events'),
	ev = new Events(),
	Minifier = require('./lib/minifier'),
	{ routePath } = require('hyper-express-route-path'),
	braceExpand = require('brace-expansion'),
	bytes = require('bytes');

function arrify(v) {
	if (v === undefined) return [];
	return Array.isArray(v) ? v : [v];
}
function is_object(value) {
	if (!value) return false;
	return value.toString() === '[object Object]';
}

class miniLiveDir extends Minifier {
	constructor(paths, opts = {}) {
		super(paths, opts);

		if (!is_object(opts)) throw new Error('Options arg must be an object');

		this.opts = merge(
			{
				// Memory used by live directory
				memory: {
					// maximum memory we will allow live directory to use
					maxUsed: '500mb',
					// maximum size of file we load into live directory
					bufferLimit: '500kb',
				},

				// Filters
				filter: {
					extensions: [
						'.js',
						'.css',
						'.webp',
						'.png',
						'.jpg',
						'.jpeg',
						'.gif',
						'.svg',
						'.html',
					],
				},

				// How we handle minification
				minify: {
					// minify html
					html: {
						collapseWhitespace: true,
						conservativeCollapse: true,
						continueOnParseError: false,
						keepClosingSlash: true,
						removeComments: true,
						removeScriptTypeAttributes: true,
						sortAttributes: true,
						sortClassName: true,
					},
					// minify css with default options
					css: {},
					// do not minify javascript by default
					js: null,
					// optimize svg using defaults
					svg: {},
					png: {
						quality: [0.6, 0.8],
					},
					jpg: {},
					gif: {
						optimizationLevel: 3,
					},
				},
			},
			opts
		);

		this.paths = arrify(paths).filter(
			(f) => typeof f == 'string' && existsSync(f)
		);

		// format buffer limit
		this.opts.memory.bufferLimit = this.#to_bytes(
			this.opts.memory.bufferLimit
		);

		this.opts.memory.maxUsed = this.#to_bytes(this.opts.memory.maxUsed);

		this.#init();
	}

	#to_bytes(val) {
		let b = bytes(val);
		if (isNaN(Number(b))) {
			b = bytes(b);
		}

		return b;
	}

	async #init() {
		if (this.liveDirs) return;

		let { bufferLimit, maxUsed } = this.opts.memory || 300000;

		this.liveDirs = [];

		this.memoryUsed = 0;

		// console.log(paths);
		for (let path of this.paths) {
			const liveDir = new LiveDirectory({
				path,
				keep: {
					extensions: this.opts.filter?.extensions || [],
					// We only want to serve files with these extensions
				},
				ignore: (path, stats) => {
					// Allow directories
					if (!stats || stats.isDirectory()) return false;

					// 1. Filter by path

					// 2. Filter by

					// if we have reached the max memory
					// return true to ignore
					if (maxUsed < this.memoryUsed) {
						return true;
					}

					// if file size is above our buffer limit,
					// then we must return true to ignore
					if (stats.size > bufferLimit) {
						return true;
					} else {
						this.memoryUsed += stats.size;
						return false;
					}
				},
			});

			liveDir.on('file_reload', (file) => {
				// console.log(file.path);

				this.#enrich_file(file);

				this.minify(file);
			});

			await liveDir.ready();

			this.liveDirs.push(liveDir);
		}
	}

	#enrich_file(file) {
		// add important aspects of the file like size
		// 1. stat
		file.stat = statSync(file.path);
		// 2. add a convenient function to start streaming with
		file.stream = () => createReadStream(file.path);
	}

	#find_file(filePath) {
		// generate possible paths
		let possiblePaths = braceExpand(`{${this.paths.join(',')}}${filePath}`);
		// console.log(possiblePaths);
		let existingPaths = possiblePaths.filter(existsSync);

		if (existingPaths.length) return existingPaths[0];
		return null;
	}

	#serve_file(filePath) {
		let { bufferLimit } = this.opts.memory || 300000;

		let stat = statSync(filePath);
		let extension = path.extname(filePath).replace(/^\./, '');

		// console.log(bufferLimit , stat.size);
		this.static.path = filePath;
		this.static.name = path.basename(filePath);
		this.static.extension = extension;

		// if we are below buffer limit
		if (bufferLimit > stat.size) {
			// we serve minified content by default
			let content = readFileSync(filePath);

			this.static.content = content;
			this.static.mode = 'fileBuffer';
			this.static.status = 'Successful';
		} else {
			// console.log(file.content.length);
			const readable = createReadStream(filePath);

			// Handle any errors from the readable
			readable.on('error', (error) => {
				ev.emit('error', error);
			});

			// stream the file
			// response.type(extension).stream(readable);
			this.static.extension = extension;
			this.static.stream = readable;
			this.static.mode = 'fileStream';
		}
	}

	get(filePath) {
		let resp = this.liveDirs
			.map((liveDir) => liveDir.get(filePath))
			.filter((f) => f !== undefined);

		// if nothing is returned
		if (resp.length == 0) return null;

		// else return first or all instances
		return resp[0] || null;
	}

	fetch(request) {
		let filePath = routePath(request);

		this.static = {
			status: 'Failed',
			fromCache: false,
			minified: false,
			optimization: {},
		};

		if (filePath) {
			let file = this.get(filePath);

			if (file) {
				// Use minified content whenever possible
				let content = file.buffer;
				if (file.minified) {
					content = file.minified;

					// show is minified
					this.static.minified = true;

					// calc optimization
					let origSize = Buffer.byteLength(file.buffer);
					let minifiedSize = Buffer.byteLength(file.minified);
					let sizeDiff = origSize - minifiedSize;

					this.static.optimization = {
						size: {
							original: bytes(origSize),
							minified: bytes(minifiedSize),
						},

						difference: bytes(sizeDiff),
						pc: ((sizeDiff / origSize) * 100).toFixed(2) + '%',
					};
				}

				this.static.extension = file.extension;
				this.static.status = 'Successful';
				this.static.mode = 'fileBuffer';
				this.static.fromCache = true;
				this.static.content = content;
				this.static.path = file.path;
				this.static.name = file.name;
			} else {
				// try to find file...
				file = this.#find_file(filePath);

				if (file) {
					this.#serve_file(file);
				}
			}
		}

		return this.static;
	}
}

module.exports = miniLiveDir;
