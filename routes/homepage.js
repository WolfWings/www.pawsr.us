module.exports = (endpoints, shared_data) => {
	console.log('Registering /');
	endpoints.push({
		uri: '/'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.write(global.templates.homepage({
		title: 'www.pawsr.us'
	,	userid: data.session.userid
	}));
	res.end();
	resolve();
});



		}
	});
};
