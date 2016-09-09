// Minimalistic filesystem-based key-value store
// Longer-term migrating this to memcache would improve matters greatly
// However 'sync' network I/O on node is nigh-impossible
// And the callback-hell that results would drive me to just write this
// entire application in NASM first.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

var stats;
try {
	stats = fs.statSync('./keyvalue');
} catch (err) {
	stats = err;
}

if (stats instanceof Error) {
	if (stats.code === 'ENOENT') {
		fs.mkdirSync('./keyvalue');
		stats = fs.statSync('./keyvalue');
	} else {
		throw stats;
	}
} else if (stats.isDirectory() === false) {
	throw Error('keyvalue exists, but is not a directory!');
}

var purged = false;
function exitHandler(options, err) {
	if (purged === false) {
		purged = true;
		if (err) console.log(err.stack);
		console.log('Purging keyvalues');
		fs.readdirSync('./keyvalue/').forEach((file) => {
//			console.log(file);
			fs.unlinkSync('./keyvalue/' + file);
		});
		if (options.exit) process.exit();
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
//	console.log(key + ' ~= ' + digest);
	return digest;
};

exports.set = (key, value) => {
	var trueKey = safeKey(key);
	// Unsafe to use fs.writeFile without waiting for the callback
	// So we're stuck with the sync version for this use-case
	try {
		fs.writeFileSync('./keyvalue/' + trueKey, value);
	} catch (err) {
		return;
	}
};

exports.get = (key) => {
	var value = null;
	var trueKey = safeKey(key);
	try {
		value = fs.readFileSync('./keyvalue/' + trueKey).toString('utf8');
	} catch (err) {
		value = null;
	}
	return value;
}

exports.delete = (key) => {
	var trueKey = safeKey(key);
	// THIS we can do async at least, huzzah!
	fs.unlink('./keyvalue/' + trueKey, (err) => {
		return;
	});
}
