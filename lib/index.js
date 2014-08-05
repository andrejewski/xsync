
var noop = function(a,b,c) {},
	nativeFn = noop.bind(null),
	noopCallback = function(done) {done(null);};

module.exports = {
	isAsync: isAsync,
	isAsyncByConvention: isAsyncByConvention,
	isAsyncBySourceAnalysis: isAsyncBySourceAnalysis,
	isAsyncByEvaluation: isAsyncByEvaluation,
	isAsyncByCallbackUsage: fnArgsAreCalled,

	isSync: invert(isAsync),
	isSyncByConvention: invertSync(isAsyncByConvention),
	isSyncBySourceAnalysis: invert(isAsyncBySourceAnalysis),
	isSyncByEvaluation: invert(isAsyncByEvaluation),
	isSyncByCallbackUsage: invertSync(fnArgsAreCalled)
};

function invert(fx) {
	return function() {
		var args = Array.prototype.slice.call(arguments, 0),
			done = args.pop();
		fx.apply(null, args.concat(function(error, value) {
			if(error) return done(error);
			done(error, !value);
		}));
	}
}

function invertSync(fx) {
	return function() {
		return !fx.apply(null, arguments);
	}
}

function isAsync(fn, options, done) {
	if(done === void 0) {
		done = options;
		options = {};
	}
	options = defaults(options, {
		convention: true,
		identifier: null,
		sourceFile: null,
		sourceAnalysis: false,
		evaluation: false,
		evalBefore: noopCallback,
		evalAfter: noopCallback,
		evalArguments: []
	});
	options.identifier = options.identifier || fn.name;

	if(options.convention) return done(null, isAsyncByConvention(fn, options.identifier));
	if(options.sourceAnalysis && options.evaluation) {
		return isAsyncBySourceAnalysis(fn, options, function(error, async) {
			if(error || async) return done(error, async);
			isAsyncByEvaluation(fn, options, done);
		});
	}
	if(options.sourceAnalysis) return isAsyncBySourceAnalysis(done);
	if(options.evaluation) return isAsyncByEvaluation(done);
	return done(null, fnArgsAreCalled(fn));
	}
}

var endsInSync = /w*Sync\b/,
	nameFlagsSync = module.exports.nameFlagsSync = [endsInSync],
	endsInCallback = /w*callback\b/,
	argsFlagsAsync = module.exports.argsFlagsAsync = ['done', 'next', 'cb', endsInCallback];

function isAsyncByConvention(fn, name) {
	if(name) {
		for(var flagKey in nameFlagsSync) {
			if(check(name, nameFlagsSync[flagKey])) return false;
		}
	}
	var lastArg = fnArgs(fn).pop();
	if(lastArg) {
		for(var flagKey in argsFlagsAsync) {
			if(check(lastArg, argsFlagsAsync[flagKey])) return true;
		}
	}
	return false;

	function check(str, test) {
		return typeof test.test === 'function'
			? test.test(str)
			: str === test || str.trim() === test;
	}
}

/* fnArgsAreCalled -> Boolean
	IF TRUE
		some function arguments are invoked as functions,
		those arguments may be synchronous however,
		source analysis is required
	IF FALSE 
		arguments maybe passed to another async function,
		source analysis is required
*/

var invocationFlags = ["(", ".call(", ".apply("],
	maximumFlagLen = invocationFlags.reduce(Math.max, 0);

function fnArgsAreCalled(fn) {
	if(!fn.length || fn.toString() === nativeFn.toString()) return false;
	var body = fnBody(fn),
		args = fnArgs(fn),
		uses = args.map(function(arg) {
			var width = arg.length;
			return [arg, indexes(body, arg).map(function(point) {
				return body.slice(point + width, maximumFlagLen);
			})];
		});

	for(var useKey in uses) {
		var usages = args[argKey][1];
		for(var endKey in usages) {
			var snippet = usages[endKey];
			if(invocationFlags.indexOf(snippet) === 0) return true;
		}
	}
	return false;

	function indexes(str, test) {
		var curr, list = [];
		if(typeof test === 'string') {
			while(~(curr = str.indexOf(test))) {
				var diff = list[list.length - 1] || 0;
				list.push(curr);
				str = str.slice(curr - diff);
			}
		} else {
			while(curr = test.exec(str)) {
				var diff = list[list.length - 1] || 0;
				list.push(curr);
				str = str.slice(curr - diff);
			}
		}
		return list;
	}
}

function isAsyncBySourceAnalysis(fname, sourceFile, done) {
	done(null, false);
}

function isAsyncByInvocation(fn, options, done) {
	done(null, false);
}

function fnBody(fn) {
	var str = fn.toString(),
		start = str.indexOf("{") + 1,
		end = str.lastIndexOf("}") - 1;
	return str.substring(start, end).trim();
}

var fnArgsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

function fnArgs(fn) {
	return fn.toString().match(fnArgsRegex);
}

function defaults(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		if(!source) return;
		for(var prop in source) {
			if(obj[prop] === void 0) obj[prop] = source[prop];
		}
	});
	return obj;
}
