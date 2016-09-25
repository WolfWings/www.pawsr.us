const routes = require('../routes');

const fake_res = {
	setHeader: (header, value) => {
	}
,	write: (content) => {
	}
,	end: (content) => {
	}
,	destroy: () => {
	}
,	saveSession: (session) => {
	}
};

console.log('Running tests.');

routes.endpoints.forEach((route) => {
	if (typeof route.test_code_coverage === 'function') {
		console.log('Testing ' + route.uri);
		setImmediate(route.test_code_coverage, route.routine, fake_res, routes.shared_data);
	}
});
