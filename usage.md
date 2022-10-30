<!--
 Copyright (c) 2022 Anthony Mugendi
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

First Install using `yarn add optimized-live-directory`

```javascript
let optimizedLiveDir = require('optimized-live-directory');

const HyperExpress = require('hyper-express');
const webserver = new HyperExpress.Server();

// determine your directories
let assetDirs = ['/dir/one', '/dir/two', '/dir/three'];

let opts = {
	// This option helps us control how much memory we let LiveDirectory Gobble up.
	// If you have 1 million static file, you don't want all of them on memory
	memory: {
		// maximum memory we will allow live directory to use
		maxUsed: '500mb',
		// maximum size of file we load into live directory
		bufferLimit: '500kb',
	},

	// Filters help to determine which files we accept/whitelist for Live Directory
	filter: {
		extensions: ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.html'],
	},

	// Details on how various static files are minified
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
		// js is null because we do not minify javascript by default. 
		js: null,
		// optimize svg using defaults
		svg: {},
		// optimize png
		png: {
			quality: [0.6, 0.8],
		},
		// optimize jpg
		jpg: {},
		// optimize gif
		gif: {
			optimizationLevel: 3,
		},
	},
};

// this will load all the files within the directories
// you can pass options to determine how it works
let optiDir = new optimizedLiveDir(assetDirs, opts);

// Create GET route to serve 'Hello World'
webserver.get('/assets/*', (request, response) => {
	// you can serve files directly now
	let resp = optiDir.fetch(request);

	// show optimizations, if any, that have been done to this resource
	console.log(resp.optimization);

	// inspect if mode is fileStream, then stream
	// The library automatically determines which files will be streamed
	if (resp.mode == 'fileStream') {
		response.type(resp.extension).stream(resp.stream);
	}
	// if buffer then send
	else if (resp.mode == 'fileBuffer') {
		response.type(resp.extension).send(resp.content);
	}

	if (resp.status == 'Failed') {
		// send 404
		response.status(404).end();
	}
});

// Activate web server by calling .listen(port, callback);
webserver
	.listen(3600)
	.then((socket) => console.log('Webserver started on port 3500'))
	.catch((error) => console.log('Failed to start webserver on port 3500'));
```

## Optimizers & Minification Options
Below are the minifiers used used to minify various files. All the options used by those modules can be passed to this module via the **minify key**.

1. Css -> [clean-css](https://www.npmjs.com/package/clean-css)
2. Javascript -> [terser](https://www.npmjs.com/package/terser)
	Note: Disabled by default because most developers will already be using webpack or something similar
3. JPG/JPEG -> [imagemin-jpeg-recompress](https://www.npmjs.com/package/imagemin-jpeg-recompress)
4. GIF -> [imagemin-gifsicle](https://www.npmjs.com/package/imagemin-gifsicle)
5. PNG -> [imagemin-pngquant](https://www.npmjs.com/package/imagemin-pngquant)
6. WEBP -> [imagemin-webp](https://www.npmjs.com/package/imagemin-webp)
7. SVG -> [svgo](https://www.npmjs.com/package/svgo)
7. HTML -> [html-minifier](https://www.npmjs.com/package/html-minifier)

