module.exports = function pluginTwo( when, config ) {
	return when( {
		title: config.title
	} );
};