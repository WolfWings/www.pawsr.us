const fs = require('fs');
const path = require('path');

var tests = {};

fs.readdirSync(__dirname).forEach((file) => {
	// Only load .js files in the directory non-recursively
	if (fs.statSync(path.join(__dirname, file)).isFile()
	 && (path.extname(file) === '.js')
	 && (file !== 'index.js')
	   ) {
		tests[file] = require(path.join(__dirname, file));
	}
});
