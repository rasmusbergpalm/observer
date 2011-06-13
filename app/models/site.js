exports.Site = {
	'name'       : 'Site',
	'dataSource' : 'mysql',
	'belongsTo'  : {
		'User' : null
	},
	'hasMany'   : {
	    'Check': null
	}
};
