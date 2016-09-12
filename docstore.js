// Minimalistic filesystem-based key-value store
// Longer-term migrating this to memcache would improve matters greatly
// However 'sync' network I/O on node is nigh-impossible
// And the callback-hell that results would drive me to just write this
// entire application in NASM first.

const fs = require('fs');
const crypto = require('crypto');

// A terse wrapper function to ignore 'EEXIST' errors on the fs.mydirSync call
function mkdirSafe(dir) {
	try {
		fs.mkdirSync(dir);
	} catch (err) {
		if (err.code !== 'EEXIST') {
			throw err;
		}
	}
}

// Requires a './docstore/[0-9a-f]/[0-9a-f]/ directory structure to exist
// This is a very minimalistic approach, just blindly create the entire tree.

console.log('Verifying document storage exists');
mkdirSafe('./docstore');
'0123456789abcdef'.split('').forEach((first) => {
	mkdirSafe('./docstore/' + first);
	'0123456789abcdef'.split('').forEach((second) => {
		mkdirSafe('./docstore/' + first + '/' + second);
	});
});

// UNLIKE Key-Value storage, we do NOT register or run a purging funciton
// As Document Storage is meant to be persistent.

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

var lockCounter = 0;

exports.unlock = (key, unique) => {
	var trueKey = safeKey(key);
	var uniqueInt = parseInt(unique, 36);
	try {
		fs.unlink('./docstore/' + trueKey + '.lock.' + unique);
		fs.unlink('./docstore/' + trueKey + '.lock');
		return true;
	} catch (err) {
		return false;
	}
}

exports.lock = (key) => {
	var trueKey = safeKey(key);
	var unique = lockCounter.toString(36);
	lockCounter = lockCounter + 1;

	try {
		fs.symlinkSync('./docstore/' + trueKey, './docstore/' + trueKey + '.lock');
		fs.symlinkSync('./docstore/' + trueKey, './docstore/' + trueKey + '.lock.' + unique);
		return unique;
	} catch (err) {
		return null;
	}
}
