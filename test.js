/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */



const HyperExpress = require('hyper-express');
const webserver = new HyperExpress.Server();


let optimizedLiveDir = require('.');

// determine your directories
let assetDirs = [
	'/home/mugz/projects/node/cmsish/apps/server/www/public/assets',
	'/home/mugz/projects/node/cmsish/apps/server/www/public/dist',
	'/home/mugz/projects/node/cmsish/apps/server/www/public/html',
];

let opts = {};

// this will load all the files within the directories
// you can pass options to determine how it works
let optiDir = new optimizedLiveDir(assetDirs, opts);

// Create GET route to serve 'Hello World'
webserver.get('/assets/*', (request, response) => {
	// you can serve files directly now
	let served = optiDir.serve(request, response);

	// inspect what has been served
	console.log(served);

	// if file is not found, the status is 'Failed'
	if (served.status == 'Failed') {
        // send 404
        response.status(404).end()
	}
});

// Activate webserver by calling .listen(port, callback);
webserver
	.listen(3600)
	.then((socket) => console.log('Webserver started on port 3500'))
	.catch((error) => console.log('Failed to start webserver on port 3500'));

