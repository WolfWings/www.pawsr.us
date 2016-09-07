var global.store = {};

exports.set = (key, value) => {
	global.store[key] = value;
};

exports.get = (key) => {
	if (global.store.hasOwnProperty(key)) {
		return store[key];
	} else {
		return null;
	}
}

exports.delete = (key) => {
	if (global.store.hasOwnProperty(key)) {
		delete global.store[key];
	}
}
