exports.register = (endpoints, shared_data) => {
	console.log('Adding Reddit service');
	shared_data.services.push({
		name:		'Reddit'
	,	login_url:	'/initlogin/reddit'
	,	logout_url:	'https:\x2F/www.reddit.com/logout'
	});
}
