const routes = require('../routes');

const fake_res = {
	setHeader: (header, value) => {
//		console.log('res.SetHeader: ' + header + ': ' + value);
	}
,	write: (content) => {
//		if (typeof content === 'undefined') {
//			console.log('res.Write');
//		} else {
//			console.log('res.Write: ' + content.length + ' bytes');
//		}
	}
,	end: (content) => {
//		if (typeof content === 'undefined') {
//			console.log('res.End');
//		} else {
//			console.log('res.End: ' + content.length + ' bytes');
//		}
	}
,	destroy: () => {
//		console.log('res.destroy');
	}
,	saveSession: (session) => {
//		console.log('res.saveSession---------');
//		console.log(session);
	}
};

console.log('Running tests.');

routes.endpoints.forEach((route) => {
	if (typeof route.test_code_coverage === 'function') {
		console.log('Testing ' + route.uri);
		setImmediate(route.test_code_coverage, route.routine, fake_res, routes.shared_data);
	}
});
