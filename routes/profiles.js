module.exports = (endpoints, shared_data) => {
	console.log('Registering /profiles');
	endpoints.push({
		uri: '/profiles'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.write(global.templates.profiles({
		title: 'www.pawsr.us'
	,	userid: data.session.userid
	}));
	res.end();
	resolve();
});



		}
	});
};
