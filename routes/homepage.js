module.exports = (endpoints, shared_data) => {
	console.log('Registering /');
	endpoints.push({
		uri: '/'
	,	routine: (data, res) => {



res.write(global.templates.homepage({
	title: 'www.pawsr.us'
,	userid: data.session.userid
}));
res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing / with logged-out session');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {userid: 0};
			console.log('Testing / with logged-in session');
			routine(data, res);
		}
	});
};
