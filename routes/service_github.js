module.exports = (endpoints, shared_data) => {
	console.log('Adding GitHub service');
	shared_data.services.push({
		name:		'GitHub'
	,	login_url:	'/initlogin/github'
	,	logout_url:	'https:\x2F/www.github.com/logout'
	});
}
