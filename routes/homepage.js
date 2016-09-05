exports.register = (endpoints, shared_data) => {
	const fs = require('fs');
	const loggedout_html = fs.readFileSync('./static/homepage/loggedout.html').toString('utf8');
	const loggedin_html = fs.readFileSync('./static/homepage/loggedin.html').toString('utf8');
	const loggedout_css = fs.readFileSync('./static/homepage/loggedout.css').toString('utf8');
	const loggedin_css = fs.readFileSync('./static/homepage/loggedin.css').toString('utf8');

	console.log('Registering /');
	endpoints.push({
		uri: '/'
	,	routine: (data, res) => {



res.write(data.boilerplate.pretitle);
res.title('www.pawsr.us');
if (data.session.hasOwnProperty('userid')) {
	res.stylesheet(loggedin_css);
	res.write(data.boilerplate.prebody);
	res.write(loggedin_html);
} else {
	res.stylesheet(loggedout_css);
	res.write(data.boilerplate.prebody);
	res.write(loggedout_html);
}
res.write(data.boilerplate.postbody);



		}
	});
};
