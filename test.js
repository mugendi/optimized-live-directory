/**
 * Copyright (c) 2022 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

let miniLiveDir = require('.');
let assetDirs = [
	'/home/mugz/projects/node/cmsish/apps/server/www/public/assets',
	'/home/mugz/projects/node/cmsish/apps/server/www/public/dist',
	'/home/mugz/projects/node/cmsish/apps/server/www/public/html',
];

let liveDir = new miniLiveDir(assetDirs);

(async function () {
	let file = await liveDir.get('/vids/1.mp4');

	// console.log(file && file.stat);

	// file.stream().pipe(process.stdout);
})();

const HyperExpress = require('hyper-express');
const webserver = new HyperExpress.Server();
// const { middleWare: routesPathMw } = require('hyper-express-route-path');

// webserver.use(routesPathMw);

// Create GET route to serve 'Hello World'
webserver.get('/api/*', (request, response) => {
	// console.log(request);
	// response.send('Hello World');
	// let filePath = '/vids/1.mp4';

	// console.log({liveDir});

	let served = liveDir.serve(request, response);

	console.log(served);
});

// Activate webserver by calling .listen(port, callback);
webserver
	.listen(3600)
	.then((socket) => console.log('Webserver started on port 3500'))
	.catch((error) => console.log('Failed to start webserver on port 3500'));
