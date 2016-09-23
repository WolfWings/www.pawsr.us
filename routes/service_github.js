exports.register = (endpoints, shared_data) => {
	console.log('Adding Github service');
	shared_data.services.push({
		name:		'Github'
	,	login_url:	'/initlogin/github'
//	,	logout_url:	'https:\x2F/www.github.com/logout'
	});
}
