// Minimalistic filesystem-based key-value store
// Longer-term migrating this to memcache would improve matters greatly
// However 'sync' network I/O on node is nigh-impossible
// And the callback-hell that results would drive me to just write this
// entire application in NASM first.

const fs = require('fs');
const crypto = require('crypto');

// Requires a './docstore/[0-9a-f]/[0-9a-f]/ directory structure to exist
// This is a very minimalistic approach:
//	Try to blindly create the entire tree.
//	If we get any EEXIST error, assume the tree exists already.
try {
	fs.mkdirSync('./docstore');
	'0123456789abcdef'.split('').forEach((first) => {
		fs.mkdirSync('./docstore/' + first);
		'0123456789abcdef'.split('').forEach((second) => {
			fs.mkdirSync('./docstore/' + first + '/' + second);
		});
	});
} catch (err) {
	if (err.code !== 'EEXIST') {
		throw err;
	}
}

var purged = false;
function exitHandler(options, err) {
	if (purged === false) {
		purged = true;
		if (err) console.log(err.stack);
		console.log('Purging docstores');
		'0123456789abcdef'.split('').forEach((first) => {
			'0123456789abcdef'.split('').forEach((second) => {
				fs.readdirSync('./docstore/' + first + '/' + second + '/').forEach((file) => {
					fs.unlinkSync('./docstore/' + first + '/' + second + '/' + file);
				});
				fs.rmdirSync('./docstore/' + first + '/' + second);
			});
			fs.rmdirSync('./docstore/' + first);
		});
		fs.rmdirSync('./docstore');
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
	digest = digest.slice(0,1) + '/' + digest.slice(1,2) + '/' + digest.slice(2);
//	console.log(key + ' ~= ' + digest);
	return digest;
};

exports.set = (key, value) => {
	var trueKey = safeKey(key);
	// Unsafe to use fs.writeFile without waiting for the callback
	// So we're stuck with the sync version for this use-case
	try {
		fs.writeFileSync('./docstore/' + trueKey, value);
	} catch (err) {
		return;
	}
};

exports.get = (key) => {
	var value = null;
	var trueKey = safeKey(key);
	try {
		value = fs.readFileSync('./docstore/' + trueKey).toString('utf8');
	} catch (err) {
		value = null;
	}
	return value;
}

exports.delete = (key) => {
	var trueKey = safeKey(key);
	// THIS we can do async at least, huzzah!
	fs.unlink('./docstore/' + trueKey, (err) => {
		return;
	});
}

exports.lock = (key) => {
	var trueKey = safeKey(key);
	var unique = crypto.randomBytes(4).toString('hex');
	try {
		fs.symlinkSync('./docstore/' + trueKey, './docstore/' + trueKey + '.lock');
		fs.symlinkSync('./docstore/' + trueKey, './docstore/' + trueKey + '.lock.' + unique);
		return unique;
	} catch (err) {
		return null;
	}
}

exports.unlock = (key, unique) => {
	var trueKey = safeKey(key);
	try {
		fs.unlink('./docstore/' + trueKey + '.lock.' + unique);
		fs.unlink('./docstore/' + trueKey + '.lock');
		return true;
	} catch (err) {
		return false;
	}
}
