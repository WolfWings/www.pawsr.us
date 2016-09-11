const fs = require('fs');
const path = require('path');

// Shared 'global' data for all routes/endpoints
//
// While generally frowned upon, this is the cleanest way to allow segmented
// addition of additional services supported, and other modular additions.
var shared_data = {
	services: []
};

// Endpoints uses the following structure:
//	uri: NON-REGEX uri to match against, including leading /
//	routine: Function called w/ (data, res) parameters
//
// Use a recursive loader to load in all the routes to keep things tidy
//
// Each file called MUST have a 'register' function that takes the endpoints
// array as a parameter, and updates the array however it sees fit. Usually
// this will be via a simple .push() call adding it's two-entry object, but
// it is left open in case alternative approaches become required.
var endpoints = [];
fs.readdirSync(__dirname).forEach((file) => {
	// Only load .js files in the directory non-recursively
	if (fs.statSync(path.join(__dirname, file)).isFile()
	 && (path.extname(file) === '.js')
	 && (file !== 'index.js')
	   ) {
		require(path.join(__dirname, file)).register(endpoints, shared_data);
	}
});

// Archive the shared_data into JSON format to avoid the per-request
// JSON.stringify call in the object-->JSON-->object cloning process.
exports.shared_data = JSON.stringify(shared_data);

exports.endpoints = endpoints;
