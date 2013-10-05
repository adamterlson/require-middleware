var preloadedfs = require('fs');
var requireMiddleware = require('../index');
var sandbox;

describe('require-middleware', function() {
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		requireMiddleware.stack = [];
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe('use', function () {
		it('should add middleware to the stack', function () {
			// arrange
			var middleware = function () { };

			// act
			requireMiddleware.use(middleware);

			// assert
			expect(requireMiddleware.stack[0].handle).to.equal(middleware);
		});

		it('should name middleware based on function name by default', function () {
			// arrange
			var middleware = function myname() { };

			// act
			requireMiddleware.use(middleware);

			// assert
			expect(requireMiddleware.stack[0].handle).to.equal(middleware);
			expect(requireMiddleware.stack[0].name).to.equal('myname');
		});

		describe('as', function () {
			it('should change the middlewares name', function () {
				// arrange
				var middleware = function myname() { };

				// act
				requireMiddleware.use(middleware).as('newname');

				// assert
				expect(requireMiddleware.stack[0].handle).to.equal(middleware);
				expect(requireMiddleware.stack[0].name).to.equal('newname');
			});
		});
	});

	describe('require', function () {
		var requireStub;

		beforeEach(function () {
			requireStub = sandbox.stub(module.constructor.prototype.require, 'original');
		});

		it('should do nothing with no registered middleware', function () {
			require('somemodule', function () {
				requireStub.should.have.been.calledWithExactly('somemodule');
			});
		});

		it('should execute middleware with the required module', function () {
			var myMiddleware = sinon.spy();

			requireMiddleware.use(myMiddleware);

			require('foo');

			expect(myMiddleware.getCall(0).args[0]).to.deep.equal({ name: 'foo' });
		});

		it('should execute middleware even on the preloaded native module', function () {
			var myMiddleware = sinon.spy();

			requireMiddleware.use(myMiddleware);

			require('fs');

			expect(myMiddleware.getCall(0).args[0]).to.deep.equal({ name: 'fs' });
		});

		it('should execute the entire middleware stack', function () {
			var firstMiddleware = function first (mod, next) {
				next();
			};
			var secondMiddleware = function second (mod, next) {
				next();
			};
			var thirdMiddleware = sinon.spy();

			requireMiddleware.use(firstMiddleware);
			requireMiddleware.use(secondMiddleware);
			requireMiddleware.use(thirdMiddleware);

			require('foo');

			thirdMiddleware.should.have.been.called;
		});

		it('should execute the entire middleware stack followed by require', function () {
			var firstCalled = false;
			var secondCalled = false;

			var firstMiddleware = function first (mod, next) {
				firstCalled = true;
				next();
			};
			var secondMiddleware = function second (mod, next) {
				secondCalled = true;
				next();
			};

			requireMiddleware.use(firstMiddleware);
			requireMiddleware.use(secondMiddleware);

			require('foo');

			expect(firstCalled).to.be.ok;
			expect(secondCalled).to.be.ok;
			requireStub.should.have.been.called;
		});

		it('should not call additional middleware if next is not called', function () {
			var firstMiddleware = function (mod, next) {
				// do nothing
			};
			var secondMiddleware = sinon.spy();

			requireMiddleware.use(firstMiddleware);
			requireMiddleware.use(secondMiddleware);

			var res = require('foo');

			secondMiddleware.should.not.have.been.called;
			expect(res).to.not.be.ok;
		});

		it('should stop executing middleware and throw if an error is passed', function () {
			var firstMiddleware = function (mod, next) {
				next('omg error');
			};
			var secondMiddleware = sinon.spy();

			requireMiddleware.use(firstMiddleware);
			requireMiddleware.use(secondMiddleware);

			expect(function () { require('foo'); }).to.throw();
			secondMiddleware.should.not.have.been.called;
		});

		it('should pass any changes to the module object to the next layer of middleware', function () {
			var firstMiddleware = function (mod, next) {
				mod.name = 'new name';
				next();
			};
			var secondMiddleware = sinon.spy();

			requireMiddleware.use(firstMiddleware);
			requireMiddleware.use(secondMiddleware);

			require('foo');

			expect(secondMiddleware.getCall(0).args[0].name).to.equal('new name');
		});

		it('should resolve the dependency with the return value, if given', function () {
			var newModule = {};
			requireMiddleware.use(function (module, next) {
				if (module.name === 'foo') {
					return newModule;
				}
			});

			var dep = require('foo');

			expect(dep).to.equal(newModule);
			requireStub.should.not.have.been.called;
		});
	});
});