"use strict";
var fs = require('fs');
var fsp = require('path');
var ts = require('typescript');

function listFiles(dir, result) {
	fs.readdirSync(dir).forEach(function(name) {
		var sub = fsp.join(dir, name);
		if (fs.statSync(sub).isDirectory()) listFiles(sub, result);
		else if (/\.ts$/.test(name)) result.push(sub);
	});
	return result;
}

function tsCompile(options) {
	var typingsDir = fsp.join(options.root, 'typings');
	var srcDir = fsp.join(options.root, 'src');
	var outDir = fsp.join(options.root, 'out');
    var program = ts.createProgram(listFiles(srcDir, listFiles(typingsDir, [])), {
		target: ts.ScriptTarget.ES2015,
		module: ts.ModuleKind.CommonJS,
		moduleResolution: ts.ModuleResolutionKind.NodeJs,
		declaration: true,
		outDir: outDir,
	});
    var emitResult = program.emit();
    var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(function(diagnostic)  {
		if (diagnostic.file) {
			var loc = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
			var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
			console.log(diagnostic.file.fileName + ':' + (loc.line + 1) + ':' + (loc.character + 1) + ': ' + message);
		} else {
			console.log(diagnostic.messageText);
		}
    });
	
	if (emitResult.emitSkipped) {
	    console.log("Typescript compilation failed. Exiting...");
		process.exit(1);
	}
	console.log("Typescript compilation succeeded.");
}

function dtsCompile(options) {
	var dts = require('dts-bundle');
	var dtsOutput = fsp.join(options.root, options.dts;

	var result = dts.bundle({
		name: options.name,
		main: fsp.join(options.root, options.main),
		out: dtsOutput,
	});
	if (!result.emitted) {
	    console.log("DTS generation failed. Exiting...");
		process.exit(1);		
	}
	console.log("created " + dtsOutput);	
}

exports.compile = function(options) {
	tsCompile(options);
	dtsCompile(options);
}
