"use strict";

// This helper is used by npm prepublish hooks to compile streamline files
var babel = require('babel-core');
require('babel-plugin-streamline');
var fs = require('fs');
var fsp = require('path');
var ts = require('typescript');

var dirMode = parseInt('777', 8);

function mkdirs(dir) {
	if (fs.existsSync(dir)) return;
	mkdirs(fsp.join(dir, '..'));
	fs.mkdirSync(dir, dirMode);
}

function tsCompile(source, path, options) {
	var tsOptions = {
		compilerOptions: options.typescript || {
			target: ts.ScriptTarget.ES2015,
			module: ts.ModuleKind.ES2015,
			sourceMap: true,
		},
		fileName: path,
	};
	return ts.transpileModule(source, tsOptions);
}

function transform(src, dir, dst, map, options) {
	// add options to streamline plugin
	var plugins = (options.plugins || ['streamline']).map(function(plugin) {
		return plugin === 'streamline' ? ['streamline', {
				runtime: options.runtime,
				verbose: true,			
		}] : plugin;
	});
	// hack regenerator plugin options (last one in es2015 preset)
	var es2015 = require('babel-preset-es2015');
	var regeneratorPlugin = es2015.plugins[es2015.plugins.length - 1];
 	if (options.runtime === 'generators') {
		regeneratorPlugin[1].generators = false;
	}
	var babelOptions = {
		plugins: plugins,
		presets: options.presets || es2015,
	};
	babelOptions.filename = src;
	babelOptions.sourceFileName = src;
	babelOptions.sourceMaps = true;
	var source = fs.readFileSync(src, 'utf8');
	if (/\.ts$/.test(src)) {
		var transpiled = tsCompile(source, src, options);
		source = transpiled.outputText;
		babelOptions.inputSourceMap = JSON.parse(transpiled.sourceMapText);
	}
	var transformed =  babel.transform(source, babelOptions);
	var code = transformed.code + '\n//# sourceMappingURL=' + map;
	delete regeneratorPlugin[1].generators;
	if (options.isTest) code = code.replace(/require\("\.\.\/\.\.\/src\//g, 'require("../../lib/' + options.runtime + '/');
	console.log("creating", fsp.join(dir, dst));
	fs.writeFileSync(fsp.join(dir, dst), code, 'utf8');
	fs.writeFileSync(fsp.join(dir, map), JSON.stringify(transformed.map, null, '\t'), 'utf8');
}

function copy(src, dir, dst) {
	console.log("creating", fsp.join(dir, dst));
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
		} else if (/\._?[jt]s$/.test(name)) {
			transform(path, 
				dst,
				name.replace(/\._?[jt]s$/, '.js'), 
				name.replace(/\._?[jt]s$/, '.map'),
				options);			
		} else if (/\.json$/.test(name)) {
			copy(path, dst, name);
		}
	});
}
