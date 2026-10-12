/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

(/**
 * @param {Window} window
 * @param {undefined} undefined
 */
function (window, undefined)
{
	/** @constructor */
	function CDocumentMacros()
	{
		this.Id = "_macrosGlobalId";//AscCommon.g_oIdCounter.Get_NewId();

		this.Lock = new AscCommon.CLock();

		this.Data = "";

		AscCommon.g_oTableId.Add(this, this.Id);
	}
	CDocumentMacros.prototype.SetData = function(sData)
	{
		AscCommon.History.Add(new CChangesDocumentMacrosData(this, this.Data, sData));
		this.Data = sData;
	};
	CDocumentMacros.prototype.GetData = function()
	{
		return this.Data;
	};
	CDocumentMacros.prototype.Get_Id = function()
	{
		return this.Id;
	};
	CDocumentMacros.prototype.CheckLock = function()
	{
		this.Lock.Check(this.Id);
	};
	CDocumentMacros.prototype.Write_ToBinary2 = function(Writer)
	{
		Writer.WriteLong(AscDFH.historyitem_type_DocumentMacros);

		// String2 : Id
		// String2 : Data

		Writer.WriteString2("" + this.Id);
		Writer.WriteString2(this.Data);
	};
	CDocumentMacros.prototype.Read_FromBinary2 = function(Reader)
	{
		// String2 : Id
		// String2 : Data

		this.Id   = Reader.GetString2();
		this.Data = Reader.GetString2();
	};

	CDocumentMacros.prototype.Refresh_RecalcData = function()
	{
	};

	CDocumentMacros.prototype.runAuto = function()
	{
		try
		{
			var obj = JSON.parse(this.Data);
			if (!obj["macrosArray"])
				return;
			for (var i = 0; i < obj["macrosArray"].length; i++)
			{
				if (true !== obj["macrosArray"][i]["autostart"])
					continue;

				AscCommon.safeMacroEval(obj["macrosArray"][i]["value"]);
			}
		}
		catch (err)
		{
			console.error(err);
		}
	};
	CDocumentMacros.prototype.run = function(sGuid)
	{
		try
		{
			var obj = JSON.parse(this.Data);
			if (!obj["macrosArray"])
				return;
			for (var i = 0; i < obj["macrosArray"].length; i++)
			{
				if (sGuid === obj["macrosArray"][i]["guid"])
				{
					AscCommon.safeMacroEval(obj["macrosArray"][i]["value"]);
					break;
				}
			}
		}
		catch (err)
		{
			console.error(err);
		}
	};
	CDocumentMacros.prototype.getGuidByName = function(sName)
	{
		try
		{
			var obj = JSON.parse(this.Data);
			if (!obj["macrosArray"])
				return;
			for (var i = 0; i < obj["macrosArray"].length; i++)
			{
				if (sName === obj["macrosArray"][i]["name"])
				{
					return obj["macrosArray"][i]["guid"];
				}
			}
		}
		catch (err)
		{
		}
		return "";
	};
	CDocumentMacros.prototype.getNameByGuid = function(sGuid)
	{
		try
		{
			var obj = JSON.parse(this.Data);
			if (!obj["macrosArray"])
				return;
			for (var i = 0; i < obj["macrosArray"].length; i++)
			{
				if (sGuid === obj["macrosArray"][i]["guid"])
				{
					return obj["macrosArray"][i]["name"];
				}
			}
		}
		catch (err)
		{
		}
		return "";
	};
	CDocumentMacros.prototype.getAllNames = function()
	{
		try
		{
			var obj = JSON.parse(this.Data);
			if (!obj["macrosArray"])
				return [];
			var oNamesMap = {};
			var aNames = [];
			for (var i = 0; i < obj["macrosArray"].length; i++)
			{
				var sName = obj["macrosArray"][i]["name"];
				if(!oNamesMap[sName])
				{
					oNamesMap[sName] = true;
					aNames.push(sName);
				}
			}
			return aNames;
		}
		catch (err)
		{
		}
		return [];
	};
    CDocumentMacros.prototype.isExistAuto = function()
    {
        try
        {
            var obj = JSON.parse(this.Data);
            if (!obj["macrosArray"])
                return;
            for (var i = 0; i < obj["macrosArray"].length; i++)
            {
                if (true === obj["macrosArray"][i]["autostart"])
                    return true;
            }
        }
        catch (err)
        {
        }
        return false;
    };

	function VbaProject() {
		this.filename = null;
		this.vbaXml = null;
		this.vbaDataXml = null;
	}
	VbaProject.prototype.toStream = function (s) {
		s.WriteUChar(AscCommon.g_nodeAttributeStart);
		s._WriteString2(0, this.filename);
		s.WriteUChar(AscCommon.g_nodeAttributeEnd);

		s.WriteRecord2(0, this.vbaXml, function(val){
			s.WriteString2(val);
		});
		s.WriteRecord2(1, this.vbaDataXml, function(val){
			s.WriteString2(val);
		});
	};
	VbaProject.prototype.fromStream = function (s) {
		var _len = s.GetULong();
		var _start_pos = s.cur;
		var _end_pos = _len + _start_pos;
		var _at;
// attributes
		s.GetUChar();
		while (true)
		{
			_at = s.GetUChar();
			if (_at === AscCommon.g_nodeAttributeEnd)
				break;
			switch (_at)
			{
				case 0: {
					this.filename = s.GetString2();
					break;
				}
				default:
					s.Seek2(_end_pos);
					return;
			}
		}
//members
		var _type;
		while (true)
		{
			if (s.cur >= _end_pos)
				break;
			_type = s.GetUChar();
			switch (_type)
			{
				case 0:
				{
					s.GetULong();//len
					this.vbaXml = s.GetString2();
					break;
				}
				case 1:
				{
					s.GetULong();//len
					this.vbaDataXml = s.GetString2();
					break;
				}
				default:
				{
					s.SkipRecord();
					break;
				}
			}
		}
		s.Seek2(_end_pos);
	};

	AscDFH.changesFactory[AscDFH.historyitem_DocumentMacros_Data]     = CChangesDocumentMacrosData;
	AscDFH.changesRelationMap[AscDFH.historyitem_DocumentMacros_Data] = [AscDFH.historyitem_DocumentMacros_Data];

	/**
	 * @constructor
	 * @extends {AscDFH.CChangesBaseStringProperty}
	 */
	function CChangesDocumentMacrosData(Class, Old, New)
	{
		AscDFH.CChangesBaseStringProperty.call(this, Class, Old, New);
	}
	CChangesDocumentMacrosData.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
	CChangesDocumentMacrosData.prototype.constructor = CChangesDocumentMacrosData;
	CChangesDocumentMacrosData.prototype.Type = AscDFH.historyitem_DocumentMacros_Data;
	CChangesDocumentMacrosData.prototype.private_SetValue = function(Value)
	{
		this.Class.Data = Value;
	};

	function customXMLHttpRequest() {
		this._headers = [];
		var t = this;

		this.open = function(method, url, async, user, password) {
			this._url = url;
			this._method = method;
			this._async = async;
			this._user = user;
			this._password = password;
		};

		this.setRequestHeader = function(name, value) {
			this._headers.push({name: name, value: value});
		};

		this.send = function(body) {
			setTimeout(function() {
				window.g_asc_plugins.api.asc_getUserPermissionToMakeRequestFromMacros(t._url, sendRequest);		
				function sendRequest (permission) {
					if (permission) {
						var xhr = new XMLHttpRequest();

						if (t.timeout)
							xhr.timeout = t.timeout;

						if (t.responseType)
							xhr.responseType = t.responseType;

						if ( t.hasOwnProperty('withCredentials') )
							xhr.withCredentials = t.withCredentials;

						xhr.open(t._method, t._url, t._async, t._user, t._password);

						t._headers.forEach(function(el) {
							xhr.setRequestHeader(el.name, el.value);
						});

						xhr.onload = function() {
							t.status = xhr.status;
							t.statusText = xhr.statusText;
							t.response = xhr.response;
							t.responseText = xhr.responseText;
							t.responseURL = xhr.responseURL;
							t.responseXML = xhr.responseXML;
							t.onload &&	t.onload();
						};

						xhr.onprogress = function(event) {
							t.onprogress && t.onprogress(event);
						};

						xhr.onreadystatechange = function() {
							t.readyState = this.readyState;
							t.onreadystatechange && t.onreadystatechange();
						};

						xhr.onerror = function(error) {
							t.onerror && t.onerror(error || "User doesn't allow this request.");
						};

						xhr.ontimeout = function(event) {
							t.ontimeout && t.ontimeout(event);
						};

						xhr.onloadstart = function(event) {
							t.onloadstart && t.onloadstart(event);
						};

						xhr.onloadend = function(event) {
							t.onloadend && t.onloadend(event);
						};

						xhr.onabort = function(event) {
							t.onabort && t.onabort(event);
						};

						if (typeof t.upload == 'object') {
							xhr.upload.onabort = function(event) {
								t.upload.onabort && t.upload.onabort(event);
							};

							xhr.upload.onerror = function(event) {
								t.upload.onerror && t.upload.onerror(event);
							};

							xhr.upload.onload = function(event) {
								t.upload.onload && t.upload.onload(event);
							};

							xhr.upload.onloadend = function(event) {
								t.upload.onloadend && t.upload.onloadend(event);
							};

							xhr.upload.onloadstart = function(event) {
								t.upload.onloadstart && t.upload.onloadstart(event);
							};

							xhr.upload.onprogress = function(event) {
								t.upload.onprogress && t.upload.onprogress(event);
							};

							xhr.upload.ontimeout = function(event) {
								t.upload.ontimeout && t.upload.ontimeout(event);
							};
						}

						t.getResponseHeader = function(name) {
							return xhr.getResponseHeader(name);
						};

						t.getAllResponseHeaders = function() {
							return xhr.getAllResponseHeaders();
						};

						t.abort = function() {
							xhr.abort();
						}

						xhr.send(body || null);

					} else if (t.onerror)  {
						t.onerror("User doesn't allow this request.");
					}
				}
			});
		};
	}

	window['AscCommon'] = window['AscCommon'] || {};
	window["AscCommon"].CDocumentMacros = CDocumentMacros;
	window['AscCommon'].VbaProject = VbaProject;

	// Functions built from strings by the Function, AsyncFunction, generator
	// constructors run in the global scope, where the real window and the
	// native desktop bridge live. Code from documents (macros) and plugins
	// reaches those constructors through ".constructor" of any function, so
	// replace them for good. Editor code calls the global Function directly,
	// which is unaffected.
	(function lockFunctionConstructors()
	{
		function makeBlocked(name)
		{
			let blocked = function() { throw new Error("Security: creating functions from strings is not allowed"); };
			try { Object.defineProperty(blocked, "name", {value: name}); } catch (err) {}
			return blocked;
		}
		let prototypes = [["Function", "function(){}"], ["AsyncFunction", "async function(){}"],
			["GeneratorFunction", "function*(){}"], ["AsyncGeneratorFunction", "async function*(){}"]];
		for (let i = 0; i < prototypes.length; i++)
		{
			try
			{
				// eval here only creates an empty function of the given kind
				let proto = Object.getPrototypeOf(eval("(" + prototypes[i][1] + ")"));
				Object.defineProperty(proto, "constructor", {value: makeBlocked(prototypes[i][0]), writable: false, configurable: false});
			}
			catch (err)
			{
			}
		}
	})();

	// A macro must reach nothing but the Api object and plain JavaScript:
	// every other global name (window, document, the desktop bridge, editor
	// internals, jQuery, ...) is bound to undefined around the macro's code.
	// Unlike swapping globals for the duration of a call, this also holds
	// inside callbacks and async functions the macro defines.
	const _macro_allowed_globals = ["undefined", "NaN", "Infinity", "Object", "Array", "String", "Number", "Boolean",
		"Symbol", "BigInt", "Math", "JSON", "Date", "RegExp", "Map", "Set", "WeakMap", "WeakSet", "Promise", "Proxy",
		"Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "EvalError", "URIError", "AggregateError",
		"ArrayBuffer", "DataView", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array",
		"Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array", "Intl",
		"parseInt", "parseFloat", "isNaN", "isFinite", "encodeURI", "encodeURIComponent", "decodeURI",
		"decodeURIComponent", "escape", "unescape", "console", "clearTimeout", "clearInterval",
		"Api", "Function", "alert", "setTimeout", "setInterval"];
	let _macro_shadowed_names = null;
	function getMacroShadowedNames()
	{
		if (_macro_shadowed_names)
			return _macro_shadowed_names;
		let names = {};
		for (let obj = window; obj && obj !== Object.prototype; obj = Object.getPrototypeOf(obj))
		{
			let props = Object.getOwnPropertyNames(obj);
			for (let i = 0; i < props.length; i++)
				names[props[i]] = true;
		}
		let extra = ["eval", "Reflect", "globalThis", "window", "self", "top", "parent", "frames", "opener",
			"document", "location", "navigator", "AscDesktopEditor", "fetch", "XMLHttpRequest", "WebSocket", "Worker",
			"SharedWorker", "EventSource", "importScripts", "indexedDB", "localStorage", "sessionStorage", "open",
			"postMessage", "WebAssembly"];
		for (let i = 0; i < extra.length; i++)
			names[extra[i]] = true;
		for (let i = 0; i < _macro_allowed_globals.length; i++)
			delete names[_macro_allowed_globals[i]];

		_macro_shadowed_names = [];
		for (let name in names)
		{
			if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
				_macro_shadowed_names.push(name);
		}
		return _macro_shadowed_names;
	}
	const _safe_macro_closure = new Function("Function", "Api", "alert", "setTimeout", "setInterval", "value", "return eval(value);");

	function _safeMacroEval(value)
	{
		value = "" + value;
		if (/\bimport\s*\(/.test(value) || /\bimport\s+/.test(value))
			throw new Error("Security: import is not allowed in macros");

		// Compile the macro on its own first (without running it): if it is
		// a valid function body it cannot close the wrapper below early.
		new Function("\"use strict\";\n" + value);

		const wrapped = "(function() {\nvar " + getMacroShadowedNames().join(", ") + ";\n" +
			"return (function() { \"use strict\";\n" + value + "\n}).call(undefined);\n})();";

		const timeout = function(cb, delay) {
			var args = Array.prototype.slice.call(arguments, 2);
			return setTimeout(function() {
				if (typeof cb === "function")
					cb.apply(undefined, args);
			}, delay);
		};
		const interval = function(cb, delay) {
			var args = Array.prototype.slice.call(arguments, 2);
			return setInterval(function() {
				if (typeof cb === "function")
					cb.apply(undefined, args);
			}, delay);
		};

		const Api = window.g_asc_plugins.api.getJsApi();
		delete Api.parsedJSDoc;
		if (value.includes('AddCustomFunction') && value.includes('@customfunction'))
		{
			const countOfAdding = (value.match(/\.AddCustomFunction\(/g) || []).length;
			Api.parsedJSDoc = AscCommon.parseJSDoc(value);
			if (Api.parsedJSDoc.length > countOfAdding)
				Api.parsedJSDoc.length = countOfAdding;
		}

		return _safe_macro_closure.call(undefined, undefined, Api, function(){}, timeout, interval, wrapped);
	}

	var _safe_eval_closure = new Function("Function", "Api", "window", "AscDesktopEditor", "alert", "document", "XMLHttpRequest", "self", "globalThis", "setTimeout", "setInterval", "value", "return eval(\"\\\"use strict\\\";\\r\\n\" + value)");
	function _safePluginEval(value) {
		// The Function/AsyncFunction/generator constructors are locked for good
		// at load time (see lockFunctionConstructors).

		const timeout = function(cb, delay) {
			var args = Array.prototype.slice.call(arguments, 2);
			return setTimeout(function() {
				cb.apply({}, args);
			}, delay);
		};
		const interval = function(cb, delay) {
			var args = Array.prototype.slice.call(arguments, 2);
			return setInterval(function() {
				cb.apply({}, args);
			}, delay);
		};
		const Api = window.g_asc_plugins.api.getJsApi();
		// clear this field on each run
		delete Api.parsedJSDoc;
		// check if we add a custom function into this macros we will parse a jsdoc
		if (value.includes('AddCustomFunction') && value.includes('@customfunction')) {
			// calculate how any times the function of adding will be called
			const countOfAdding = (value.match(/\.AddCustomFunction\(/g) || []).length;
			// parse JSDOC and put it to Api
			Api.parsedJSDoc = AscCommon.parseJSDoc(value);
			// remove extra parsed JSDOC
			if (Api.parsedJSDoc.length > countOfAdding)
				Api.parsedJSDoc.length = countOfAdding;
		}

		function _sanitizeCode(value) {
			if (/\bimport\s*\(/.test(value)) {
				throw new Error("Security: dynamic import() is not allowed in macros");
			}
			if (/\bimport\s+/.test(value)) {
				throw new Error("Security: static import is not allowed in macros");
			}
			return value;
		}
		value = _sanitizeCode(value);
		const result = _safe_eval_closure.call(null, {}, Api, {}, {}, function(){}, {}, customXMLHttpRequest, {}, {}, timeout, interval, value);
		return result;
	};
	window['AscCommon'].safeMacroEval = function(value){
		let result;
		let isCheckSymbols = AscFonts.IsCheckSymbols;
		AscFonts.IsCheckSymbols = true;
		try
		{
			result = _safeMacroEval(value);
		}
		catch (err)
		{
			console.error(err);
		}
		AscFonts.IsCheckSymbols = isCheckSymbols;
		return result;
	};
	window['AscCommon'].safePluginEval = function(value){
		let result;
		let isCheckSymbols = AscFonts.IsCheckSymbols;
		AscFonts.IsCheckSymbols = true;
		try
		{
			result = _safePluginEval(value);
		}
		catch (err)
		{
			result = undefined;
			console.error(err);
		}
		AscFonts.IsCheckSymbols = isCheckSymbols;
		return result;
	};

})(window);
