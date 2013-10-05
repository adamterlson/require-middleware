var baseRequire = module.constructor.prototype.require;
var requireMiddleware = {
	stack: [],
	use: use
};

module.constructor.prototype.require = function (m) {
	var dependency;
	var mod = {
		name: m
	};

	function run(index) {
		var middleware = requireMiddleware.stack[index];
		if (middleware && !dependency) {
			dependency = middleware.handle(mod, function (err) {
				if (err) {
					throw err;
				}
				run(++index);
			});
		}
	}
	run(0);

	return dependency || module.constructor.prototype.require.original.apply(this, [mod.name]);
};

module.constructor.prototype.require.original = function () {
	return baseRequire.apply(this, arguments);
};

function use(fn) {
	var middleware = {
		handle: fn,
		name: fn.name
	};

	requireMiddleware.stack.push(middleware);

	return {
		as: function (name) {
			middleware.name = name;
		}
	};
};

exports = module.exports = requireMiddleware;