var fs = require('fs');
var loggedout = fs.readFileSync('./static/homepage/loggedout.html');;
var loggedin = fs.readFileSync('./static/homepage/loggedin.html');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /');
	endpoints.push({
		uri: '/'
	,	routine: (data, res) => {



if (data.session.hasOwnProperty('userid')) {
	res.write(loggedin);
} else {
	res.write(loggedout);
}



		}
	});
};
