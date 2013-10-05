Require Middleware
============

This library will give you the capabilities of middleware in calls to require.  It's super handy for unit testing and dependency injection, but could be used for broader application purposes as well.

This is heavily inspired by, and modeled after, Connect middleware.

##Installation

Use `--save` if using in your core app, `--save-dev` if using for testing

``````
npm install [--save/--save-dev] require-middleware
``````

##Basic Usage

```````javascript
// Remember this is going to hijack all require calls to follow!
// That also means that you might want to load it first

var requireMiddleware = require('require-middleware');
requireMiddleware.use(function myMiddleware(req, next) {
	if (req.name === 'something') {
		// Transparent dependency replacement
		return require('somethingelse');
	}
	next();
});
````````

If next is not called or a result not given, the dependency will be resolved as null.

## Throwing errors

Simply pass a return value to next and that will be thrown as an exception

```````javascript
function myMiddleware(req, next) {
	if (req.name === 'fs') {
		next('Sorry dude, no fs for you.');
	}
}
```````

# Fiddling with registered middleware

The middleware stack is exposed on `requireMiddleware.stack`.

##Naming your middleware

```````javascript
requireMiddleware.use(function myMiddleware() { });
// OR
requireMiddleware.use(function () { }).as('myMiddleware');
```````

The stack, after registering this middleware would look like:

```````javascript
[
	{ handle: Function myMiddleware, name: 'myMiddleware' }
]
```````



