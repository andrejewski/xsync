Xsync
=====

Xsync aims to be the expert witness to the seemingly simple question "Is a given function a/synchronous?"

Due to many problems with JavaScript such as a wild west type system, non-deterministic function parameters and arguments, the different patterns of asynchronicity such as callbacks and promises, the question is very hard to answer for any function definitively.

Xsync is an collaborative effort to solve this question as correctly as possible. The code does not have to be blazing fast just so long as the answers are valid.

## Installation

```bash
npm install xsync
```

## Usage

```javascript
var xsync = require('xsync'),
	assert = require('assert');

function(a, b, callback) {
	callback(null, a + b);
}

xsync.isAsync(fn, function(error, async) {
	assert.ok(async);
});
xsync.isSync(fn, function(error, sync) {
	assert.ok(!sync);
});
```

Xsync is a collection of function tests run in order to produce the single Boolean determining whether a given function is asynchronous. Each of these `isAsync` tests is exposed as function with a `isSync` counterpart solely for convenience. If it is not asynchronous, it must be synchronous. 

## Coverage and Todo

Currently, Xsync is in v0. Despite that, I believe it can accurately infer up to 80% of all functions. This is because the JavaScript community, whether we realize it or not, have written our callback soup with tons of conventions.

1. Callbacks are almost always the last argument to a function.
2. Callbacks are named `done`, `next`, `cb`, or `callback`. (If you use your own standard naming scheme, Xsync can be extended to cover those via `xsync.argsFlagsAsync`).
3. Callbacks are called. Xsync processes (without evaluating) the source code of a given function, checking if any of the provided arguments are called or `.call()`ed, or `.apply()`ed. 
4. Often functions that are explicitly synchronous end with `Sync`, for example `fs.readFileSync()`.

So functions that quack like they use callbacks will easily to caught by Xsync in its current version. (These are only assumptions Xsync makes by default. For the most accurate results, assumptions can be removed as configured.)

Xsync aims for 100% determinism. There are tons of special cases that need to be addressed. What follows is a list of such concerns.

### Functions that delegate callbacks

```javascript
function b(done) {
	fs.readFile('README.md', done);
}
```

Currently, Xsync cannot infer that `done` will be used as a callback if `{convention: false}` is set in the options. By default it is `true`.

We should build the JavaScript AST using [node-falafel](https://github.com/substack/node-falafel) and recursively find `done`. From there we find the function to which it is an argument `fs.readFile`. And from there we can reuse Xsync to test the asynchronicity of `fs.readFile`, which we then can use to infer that `b()` is asynchronous. (See `xsync.isAsyncBySourceAnalysis`.)

### Functions that use Arguments

```javascript
function a() {
	fs.readFile('README.md', arguments[0]);
}
```

Honestly, this one has me perplexed as it is so much harder to derive intent here. This function may have to be solved by evaluation. (See `xsync.isAsyncByEvaluation()`.) 

### Promises

With promises landing in ES6, Xsync is in dire need of promise support. This might be possible at the AST level if [Esprima](https://github.com/ariya/esprima) allows this level of analysis. (See `xsync.isAsyncBySourceAnalysis`.)

### And so many more possibilities

Xsync is desperately needed for JavaScript because all of these special cases cannot be addressed in a single code snippet. The community needs a highly accurate a/synchronicity checker.

## Contributing

Contributions are incredibly welcome as long as they are standardly applicable and pass the tests (or break bad ones). Tests are written in Mocha and assertions are done with the Node.js core `assert` module.

```bash
# running tests
npm run test
npm run test-spec # spec reporter
```

Follow me on [Twitter](https://twitter.com/compooter) for updates or just for the lolz and please check out my other [repositories](https://github.com/andrejewski) if I have earned it. I thank you for reading.


