// Minimalistic filesystem-based key-value store
// Longer-term migrating this to memcache would improve matters greatly
// However 'sync' network I/O on node is nigh-impossible until await
// And the callback-hell that results would drive me to just write this
// entire application in NASM first.

const fs = require('fs');
const crypto = require('crypto');

function delete_watch() {
	if (typeof global.keyvalue_watcher !== 'undefined') {
		var temp = global.keyvalue_watcher;
		delete global.keyvalue_watcher;
		temp.close();
	}
}

function create_watch() {
	global.keyvalue_watcher = fs.watch('./keyvalue', {persistent: false}, () => {
		global.keyvalue = new Map(JSON.parse(fs.readFileSync('./keyvalue')));
	});
}

function update_file() {
	delete_watch();
	fs.writeFileSync('./keyvalue', JSON.stringify([...global.keyvalue]));
	create_watch();
}

// Register the global keyvalue Map
if (typeof global.keyvalue === 'undefined') {
	try {
		console.log('Loading key-value storage');
		global.keyvalue = new Map(JSON.parse(fs.readFileSync('./keyvalue')));
		create_watch();
	} catch (e) {
		console.log('Error: Creating blank key-value storage');
		global.keyvalue = new Map();
		update_file();
	}
}

// istanbul ignore next: Code coverage can't detect 'on exit' functions
function exitHandler(options, err) {
	if (typeof global.keyvalue !== 'undefined') {
		console.log('Disconnecting global keyvalue store on exit');
		delete global.keyvalue;
		delete_watch();
	}
	if (options.exit) {
		process.exit();
	}
}

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));

// Prevents filesystem-specific filename-based attacks
function safeKey(key) {
	var digest;
	var hash = crypto.createHash('sha256');
	hash.update(key);
	digest = hash.digest('hex');
	digest = digest.slice(0,1) + '/' + digest.slice(1,2) + '/' + digest.slice(2);
	return digest;
};

exports.set = (key, value) => {
	global.keyvalue.set(key, value);
	update_file();
};

exports.get = (key) => {
	var value = global.keyvalue.get(key);
	if (typeof value === 'undefined') {
		value = null;
	}
	return value;
}

exports.delete = (key) => {
	global.keyvalue.delete(key);
	update_file();
}
