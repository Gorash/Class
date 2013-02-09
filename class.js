/**
* Class.js
* MIT licensed
* Christophe Matthieu
* tof.matthieu@gmail.com
* If you use self software, please send me an email.

"Class" is a class builder with managment of multiple inheritance.
Each method can access its parent using the "Super" method (eg. this.Super(arg1, arg2);).
If a class has multiple inheritance, where Super is called, all inherit methods are tested (starting by the last one).
If the method does not exist in the direct inheritance, Super is called again on the last inherit class.
You can call a specific ancestor using: Class("class name").Super.apply(this, [arg1, arg2]).
All class create, generate an unique Id on object.
Reserved on the class: 
* Super (method "Super"),
* Constructor (constructor of the class),
* Name (class name), 
* Id (class id), 
* Methods (object contains methods), 
* Inherits (array of inherit classes)

@Debug_mode:
Add #debug; to the url to display error message

Class(argument):
@Return: Class contructor
@Value: STRING or OBJECT {
	Object.Name: STRING // required unique class name
	Object.Class: OBJECT // contains methods and variables
	Object.Class.Constructor: FUNCTION // optionnal constructor of the class
	Object.Inherits: ARRAY // optionnal list of inherits class
	Object.Interfaces: ARRAY // optionnal list of interface class
}

@Example:
var t1 = Class({
	Name: 'class name $"%',
	Class: {
		v0: 0,
		m1: function () {
			console.log(0);
			this.Super();
		},
		Constructor: function (a) {
			this.v01 = a;
		}
	}
});

Class({
	Name: 'other name',
	Class: {
		v1: 1,
		m1: function () {
			console.log(1);
			this.Super();
		}
	}
});

Class({
	Name: 'test',
	Class: {
		v2: 2,
		m1: function () {
			console.log(2);
			this.Super();
		}
	},
	Inherits: [t1, 'other name']
});
var a = Class('test')(33);
var b = Class(3)(33);
var c = new (Class('test'))(33);

*/
var Class = function (opts) {
	function ErrorDispatch(name, msg) {
		if(window.location.hash.match(/(^|[#;,])debug([,;]|$)/))
			console.debug((msg ? name : "Error")+': '+(msg || name));
		return null;
	};
	
	if (!Class._Ids) Class._Ids = [];
	if (this !== window) {
		return ErrorDispatch("CallError", "Create an instance of 'Class' (don't use \'new\') for call the class builder: '"+(opts && opts.Name ? opts.Name : opts)+"'");
	}
	if (!isNaN(+opts)) {
		return Class._Ids[+opts] || ErrorDispatch("IdError", "Cannot find the Class Id '"+opts+"'");
	}
	if (typeof opts === "string") {
		for(var key = 0; key < Class._Ids.length ; key++)
			if (Class._Ids[key].Name == opts)
				return Class._Ids[key];
		return ErrorDispatch("NameError", "Cannot find the ClassName '"+opts+"'");
	}
	
	/* init variables */
	var _Id = Class._Ids.length;
	var _Name = opts.Name;
	var _Class = opts.Class || {};
	var _Inherits = opts.Inherits || (opts.Inherit ? [opts.Inherit] : []);
	var _Interfaces = opts.Interfaces || (opts.Interface ? [opts.Interface] : []);
	
	/* check */
	if (!_Name) {
		ErrorDispatch("Warning", "No ClassName");
	} else {
		for (var key = 0; key < Class._Ids.length ; key++) {
			if (_Name && Class._Ids[key].Name == _Name)
				return ErrorDispatch("NameError", "ClassName '"+_Name+"' already exists");
		}
	}
	for (var key = 0; key < _Inherits.length ; key++) {
		var _Inherit = _Inherits[key];
		var hasClass = false;
		for(var k = 0; k < Class._Ids.length ; k++)
			if (Class._Ids[k] === _Inherit || Class._Ids[k].Name === _Inherit) {
				_Inherits[key] = Class._Ids[k]
				hasClass = true;
			}
		if (!hasClass)
			return ErrorDispatch("ValueError", "One Inherit is undefined. (Inherits["+key+"])");
	}
	for (var key = 0; key < _Interfaces.length ; key++) {
		var _Interface = _Interfaces[key];
		var hasClass = false;
		for(var k = 0; k < Class._Ids.length ; k++)
			if (Class._Ids[k] === _Interface || Class._Ids[k].Name === _Interface) {
				_Interfaces[key] = Class._Ids[k]
				hasClass = true;
			}
		if (!hasClass)
			return ErrorDispatch("ValueError", "One Inherit is undefined. (Inherits["+key+"])");
	}
	
	/* init constructor */
	var _Constructor = (_Class.hasOwnProperty('Constructor') && typeof _Class.Constructor === 'function' ? _Class.Constructor : false) || 
						(opts.hasOwnProperty('Constructor') && typeof opts.Constructor === 'function' ? opts.Constructor : false) || 
						(_Inherits.length ? _Inherits[_Inherits.length-1].Constructor : false) ||
						function () {};
	
	/* create class */
	var newClass = eval('var object={}; object[\'"'+(_Name||_Id)+'"\'] = function() {var self = this;'+
		'if(!(this instanceof Class._Ids['+_Id+'])){var self = {}; self.__proto__ = Class._Ids['+_Id+'].prototype;}'+
		'Class._Ids['+_Id+'].Constructor.apply(self, Array.prototype.slice.call(arguments,0));'+
		'return self;'+
	'}');
	newClass.toString = function () {return '[Class: '+(_Name||_Id)+']';};
	newClass.Inherits = _Inherits;
	newClass.Constructor = _Constructor;
	newClass.Methods = {};
	newClass.Name = _Name;
	newClass.Id = _Id;
	
	/* add inherits variables and methods */
	for (var key = 0; key < _Inherits.length ; key++) {
		var _Inherit = _Inherits[key];
		for (var method in _Inherit.prototype)
			if (_Inherit.prototype.hasOwnProperty(method))
				newClass.prototype[method] = _Inherit.prototype[method];
		for (var method in _Inherit.methods)
			if (_Inherit.methods.hasOwnProperty(method))
				newClass.methods[method] = _Inherit.methods[method];
	}
	
	/* overwrite ClassName */
	newClass.prototype.ClassName = _Name;
	
	/* add variables and methods */
	for (var method in _Class) {
		if (method === "Super")
			return ErrorDispatch("NameError", "Overwrite 'Super' method of the Class '"+_Name+"'");
		if (method === "constructor")
			return ErrorDispatch("NameError", "Overwrite 'constructor' of the Class '"+_Name+"', please use 'Constructor' instead");
		
		if (_Class.hasOwnProperty(method) && method != 'Constructor' && typeof _Class[method] === 'function') {
			newClass.Methods[method] = _Class[method];
			var method_deco = eval('(method_deco = function(){var args = Array.prototype.slice.call((arguments.length && arguments[arguments.length-1].__InheritTransaction) ? arguments.slice(0, -1) : arguments); return Class['+_Id+'].Methods.'+method+'.apply(this, args);})');
			method_deco.toString = eval('(function () {return Class['+_Id+'].Methods.'+method+' + "";})');
			newClass.prototype[method] = method_deco;
		} else if (typeof _Class[method] !== 'function'){
			newClass.prototype[method] = _Class[method];
		}
	}
	
	/* add methods Super */
	newClass.prototype.Super = function () {
		var args =  Array.prototype.slice.call(arguments);
		var fn = this.Super.caller;
		var _Inherits = newClass.Inherits;
		var _getter = false;
		
		if (args.length && args[args.length-1].__InheritTransaction) {
			
			var __InheritTransaction = args[args.length-1].__InheritTransaction;
			var _Inherits = __InheritTransaction.Inherit.Inherits;
			var _getter = __InheritTransaction.Method;
			var args =  args.slice(0, -1);
			
		} if(fn.arguments.length && fn.arguments[fn.arguments.length-1].__InheritTransaction) {
			
			var __InheritTransaction = fn.arguments[fn.arguments.length-1].__InheritTransaction;
			_Inherits = __InheritTransaction.Inherit.Inherits;
			_getter = __InheritTransaction.Method;
			
		} else {
			
			fn = fn.caller;
			for (method in this)
				if (this[method] === fn) {
					_getter = method;
					break;
				}
			
			if (!_getter && fn.arguments.length && fn.arguments[fn.arguments.length-1].__InheritTransaction) {
				var __InheritTransaction = fn.arguments[fn.arguments.length-1].__InheritTransaction;
				_Inherits = __InheritTransaction.Inherit.Inherits;
				_getter = __InheritTransaction.Method;
			}
			
		}
		
		var result = null;
		if (_Inherits.length) {
			var _Inherit = false;
			for (var key=_Inherits.length-1; key>=0; key--) {
				_Inherit = _Inherits[key];
				if (typeof _Inherit.Methods[_getter] === 'function' && _Inherit.Methods[_getter] !== fn) {
					args.push({__InheritTransaction: {Method: _getter, Inherit: _Inherit}});
					return _Inherit.Methods[_getter].apply(this, args);
				}
			}
			_Inherit = _Inherits[_Inherits.length-1];
			if(typeof _Inherit.prototype.Super === 'function') {
				args.push({__InheritTransaction: {Method: _getter, Inherit: _Inherit}});
				return _Inherit.prototype.Super.apply(this, args);
			}
		}
		
		return;
	};
	newClass.prototype.Super.toString = function () { return '[native function]'; };
	newClass.Super = newClass.prototype.Super;
	
	/* check interfaces */
	for (var key in _Interfaces) {
		if (_Interfaces.hasOwnProperty(key)) {
			var _Interface = _Interfaces[key];
			for (var method in _Interface.prototype)
				if (_Interface.hasOwnProperty(method) && 
					((!typeof _Class[method] === 'function' || 
					  !typeof newClass.prototype[method] === 'function') ||
					 (!typeof _Class[method] !== 'function' || 
					  !typeof newClass.prototype[method] !== 'function'))) {
					return ErrorDispatch("Interface", "Cannot find the method or variable '"+method+"' of the interface '"+(_Interface.Name || _Interface)+"'");
				}
		}
	}
	
	Class._Ids.push(newClass);
	return Class[_Id] = newClass;
};
