const fs = require('fs');
const path = require('path');

// Shared 'global' data for all routes/endpoints
var shared_data = {
	services: []
};

// Endpoints uses the following structure:
//	uri: NON-REGEX uri to match against, including leading /
//	routine: Function called w/ (data, res) parameters
//
// Use a recursive loader to load in all the routes to keep things tidy
//
// Each file called export have a 'register' function that takes the data &
// endpoints arrays as parameters, and updates the arrays however it wants.
// Usually this will be via a simple .push() call adding it's entry, but it
// is left open in case alternative approaches become required.
var endpoints = [];
fs.readdirSync(__dirname).forEach((file) => {
	// Only load .js files in the directory non-recursively
	if (fs.statSync(path.join(__dirname, file)).isFile()
	 && (path.extname(file) === '.js')
	 && (file !== 'index.js')
	   ) {
		require(path.join(__dirname, file))(endpoints, shared_data);
	}
});

// Archive the shared_data into JSON format to avoid the per-request
// JSON.stringify call in the object-->JSON-->object cloning process.
exports.shared_data = JSON.stringify(shared_data);

exports.endpoints = endpoints;
