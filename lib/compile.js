"use strict";

// This helper is used by npm prepublish hooks to compile streamline files
var babel = require('babel-core');
require('babel-plugin-streamline');
var fs = require('fs');
var fsp = require('path');

var dirMode = parseInt('777', 8);

function mkdirs(dir) {
	if (fs.existsSync(dir)) return;
	mkdirs(fsp.join(dir, '..'));
	fs.mkdirSync(dir, dirMode);
}

function transform(src, dir, dst, map, options) {
	var babelOptions = {
		plugins: options.plugins || ['streamline'],
		whitelist: options.whitelist,
		blacklist: options.blacklist || [],
		extra: options.extra || {
			streamline: {
				runtime: options.runtime,
				verbose: true,
			},
		},
	};
	if (options.runtime !== 'callbacks') babelOptions.blacklist.push('regenerator');
	babelOptions.filename = src;
	babelOptions.sourceFileName = src;
	babelOptions.sourceMaps = true;
	var source = fs.readFileSync(src, 'utf8');
	var transformed =  babel.transform(source, babelOptions);
	var code = transformed.code + '\n//# sourceMappingURL=' + map;
	console.error("creating", fsp.join(dir, dst));
	fs.writeFileSync(fsp.join(dir, dst), code, 'utf8');
	fs.writeFileSync(fsp.join(dir, map), JSON.stringify(transformed.map, null, '\t'), 'utf8');
}

function copy(src, dir, dst) {
	console.error("creating", fsp.join(dir, dst));
	fs.writeFileSync(fsp.join(dir, dst), fs.readFileSync(src, 'utf8'), 'utf8');
}

exports.compileSync = function compileSync(src, dst, options) {
	if (typeof options === 'string') options = {
		runtime: options,
	};
	fs.readdirSync(src).forEach(function(name) {
		var path = fsp.join(src, name);
		var stat = fs.statSync(path);
		mkdirs(dst);
		if (stat.isDirectory()) {
			var sub = fsp.join(dst, name);
			compileSync(path, sub, options);
		} else if (/\._?js$/.test(name)) {
			transform(path, 
				dst,
				name.replace('._js', '.js'), 
				name.replace(/\._?js$/, '.map'),
				options);			
		} else if (/\.json$/.test(name)) {
			copy(path, dst, name);
		}
	});
}
