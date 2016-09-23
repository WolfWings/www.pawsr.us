global.database = require('../utils/database.js');

const fs = require('fs');
const path = require('path');

var files = [];
fs.readdirSync(__dirname).forEach((file) => {
	// Only load .js files in the directory non-recursively
	if (fs.statSync(path.join(__dirname, file)).isFile()
	 && (path.extname(file) === '.js')
	 && (file !== 'index.js')
	   ) {
		files.push(file);
	}
});

console.log(files);

console.log('Waiting 1 second for database to stabilize...');
setTimeout(do_test, 1000, 0);

function do_test(index) {
	if (index >= files.length) {
		console.log('Waiting 5 seconds to allow tests to complete.');
		setTimeout(process.exit, 5000, 0);
		return;
	}
	require(path.join(__dirname, files[index]));
	setImmediate(do_test, index + 1);
}
