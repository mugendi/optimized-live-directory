<!--
 Copyright (c) 2022 Anthony Mugendi

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# optimized-live-directory

```javascript
let optimizedLiveDir = require('optimized-live-directory');

const HyperExpress = require('hyper-express');
const webserver = new HyperExpress.Server();

// determine your directories
let assetDirs = ['/dir/one', '/dir/two', '/dir/three'];

let opts = {};

// this will load all the files within the directories
// you can pass options to determine how it works
let optiDir = new optimizedLiveDir(assetDirs, opts);

// Create GET route to serve 'Hello World'
webserver.get('/assets/*', (request, response) => {
	// you can serve files directly now
	let resp = optiDir.fetch(request);

	// sho optimizations, if any, that have been done to this resource
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

// Activate webserver by calling .listen(port, callback);
webserver
	.listen(3600)
	.then((socket) => console.log('Webserver started on port 3500'))
	.catch((error) => console.log('Failed to start webserver on port 3500'));
```
