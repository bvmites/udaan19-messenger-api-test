const jwt = require('jsonwebtoken');

module.exports = (request, response, next) => {
	try {
		console.log("###############################################################################");
		console.log(request.body);
		const token = request.header('Authorization');
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		request.user = decoded.user;
		next();
	} catch (e) {
		response.status(401).json({message: 'unauthorized'});
	}
};
