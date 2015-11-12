"use strict";
var fs = require('fs');
var fsp = require('path');

exports.runTests = function(options) {
	if (!options || !options.root) throw new Error("Cannot run tests: options.root missing");
	var tests = [];
	(options.subdirs || ['.']).forEach(function(subdir) {
		var dir = fsp.join(options.root, subdir);
		fs.readdirSync(dir).filter(function(file) {
			return /\.js$/.test(file);
		}).forEach(function(file) {
			return tests.push(fsp.join(dir, file));
		});	
	});

	var qunit = require("qunit");

	qunit.run({
		code: fsp.join(__dirname, 'qunit-wrapper.js'),
	    tests: tests,
	    maxBlockDuration: 10 * 1000,
	}, function(err) {
		if (err) throw err;
	});
}
