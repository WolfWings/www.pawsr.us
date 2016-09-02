var fs = require('fs');
var loggedout = fs.readFileSync('./static/homepage/loggedout.html');;
var loggedin = fs.readFileSync('./static/homepage/loggedin.html');

exports.register = (endpoints) => {
	console.log('Registering /');
	endpoints.push({
		uri: '/'
	,	routine: (query, session, res) => {



if (session.hasOwnProperty('userID')) {
	res.write(loggedin);
} else {
	res.write(loggedout);
}



		}
	});
};
