// Normal JSON conversion with two exceptions:
// Strings are prefixed by '_'
// Numbers are converted to 16-character, fixed-width, zero-padded strings
exports.JSONreplacer = (key, value) => {
	switch (typeof value) {
		case 'number':
			return ((value < 0) ? '-' : '+') + ('000000000000000' + Math.abs(value).toString(10)).slice(-15);
		case 'string':
			return '_'+ value;
		default:
			return value;
	}
};

// The reverse of the above
// Currently treats anything except -/+ as a string
exports.JSONreviver = (key, value) => {
	if (typeof value !== 'string') {
		return value;
	}
	switch (value.slice(0, 1)) {
		case '-':
		case '+':
			return parseInt(value);
			break;
		default:
			return value.slice(1);
	}
};
