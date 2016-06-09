"use strict";
// install streamline hooks (only if files are not precompiled)
Error.stackTraceLimit = 30;
if (/[\\\/]test$/.test(process.argv[3])) {
	require('streamline').register({
		babel: {
			plugins: ['flow-comments', 'transform-class-properties', 'streamline'],
		},
		extensions: ['._js', '.ts'],
	});
} 


// patch asyncTest because streamline test function needs a callback.
var original = global.asyncTest;
global.asyncTest = function(name, expect, fn) {
	if (typeof expect === 'function') {
		fn = expect;
		expect = null;
	}
	original(name, expect, function() {
		fn(function(err) {
			if (err) throw err;
		});
	});
}