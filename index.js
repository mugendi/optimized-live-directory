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
				firstInstanceOnly: true,

				serve: {
					// past this limit, we do not load files ti LiveDirectory
					bufferLimit: '500kb',
				},

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
		this.opts.serve.bufferLimit = this.#to_bytes(
			this.opts.serve.bufferLimit
		);

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

		let { bufferLimit } = this.opts.serve || 300000;

		this.liveDirs = [];

		// console.log(paths);
		for (let path of this.paths) {
			const liveDir = new LiveDirectory({
				path,
				ignore: (path, stats) => {
					if (!stats || stats.isDirectory()) return false;

					let resp = stats && stats.size > bufferLimit;
					// console.log(path, resp);
					return resp;
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

	#serve_file(filePath, response) {
		if (
			!response?.header ||
			!response?.stream ||
			!response?.end ||
			!response?.status ||
			!response?.type
		) {
			throw new Error('Incorrect response handler passed');
		}

		let { bufferLimit } = this.opts.serve || 300000;

		let stat = statSync(filePath);
		let extension = path.extname(filePath);

		// if we are below buffer limit
		if (bufferLimit > stat.size) {
			// we serve minified content by default
			let content = readFileSync(filePath);
			// send file content
			response.status(200).type(extension).send(content);
			this.served.mode = 'fileBuffer';
			this.served.status = 'Successful';
		} else {
			// console.log(file.content.length);
			const readable = createReadStream(filePath);

			// Handle any errors from the readable
			readable.on('error', (error) => {
				ev.emit('error', error);
			});

			// stream the file
			response.type(extension).stream(readable);
			this.served.mode = 'fileStream';
		}
	}

	get(filePath) {
		let resp = this.liveDirs
			.map((liveDir) => liveDir.get(filePath))
			.filter((f) => f !== undefined);

		// if nothing is returned
		if (resp.length == 0) return null;

		// else return first or all instances
		return this.opts.firstInstanceOnly ? resp[0] : resp;
	}

	serve(request, response) {
		let filePath = routePath(request);

		this.served = {
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
					this.served.minified = true;

					// calc optimization
					let origSize = Buffer.byteLength(file.buffer);
					let minifiedSize = Buffer.byteLength(file.minified);
					let sizeDiff = origSize - minifiedSize;

					this.served.optimization = {
						size: {
							original: bytes(origSize),
							minified: bytes(minifiedSize),
						},

						difference: bytes(sizeDiff),
						pc: ((sizeDiff / origSize) * 100).toFixed(2) + '%',
					};
				}

				this.served.status = 'Successful';
				this.served.mode = 'fileBuffer';
				this.served.fromCache = true;

				response.status(200).type(file.extension).send(content);
			} else {
				// try to find file...
				file = this.#find_file(filePath);

				if (file) {
					this.#serve_file(file, response);
				}
			}
		}

		return this.served;
	}
}

module.exports = miniLiveDir;
