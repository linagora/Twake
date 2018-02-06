!function (e, t) {
	"object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.JitsiMeetExternalAPI = t() : e.JitsiMeetExternalAPI = t()
}(this, function () {
	return function (e) {
		function t(r) {
			if (n[r])return n[r].exports;
			var i = n[r] = {i: r, l: !1, exports: {}};
			return e[r].call(i.exports, i, i.exports, t), i.l = !0, i.exports
		}

		

		var n = {};
		return t.m = e, t.c = n, t.d = function (e, n, r) {
			t.o(e, n) || Object.defineProperty(e, n, {configurable: !1, enumerable: !0, get: r})
		}, t.n = function (e) {
			var n = e && e.__esModule ? function () {
				return e.default
			} : function () {
				return e
			};
			return t.d(n, "a", n), n
		}, t.o = function (e, t) {
			return Object.prototype.hasOwnProperty.call(e, t)
		}, t.p = "/libs/", t(t.s = 2)
	}([function (e, t, n) {
		"use strict";
		function r(e) {
			var t = new RegExp("^" + c + "+", "gi"), n = t.exec(e);
			if (n) {
				var r = n[n.length - 1].toLowerCase();
				"http:" !== r && "https:" !== r && (r = "https:"), e = e.substring(t.lastIndex), e.startsWith("//") && (e = r + e)
			}
			return e
		}

		function i() {
			var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, t = [];
			for (var n in e)try {
				t.push(n + "=" + encodeURIComponent(JSON.stringify(e[n])))
			} catch (e) {
				console.warn("Error encoding " + n + ": " + e)
			}
			return t
		}

		function s(e) {
			var t = {toString: o}, n = void 0, r = void 0;
			if (n = new RegExp("^" + c, "gi"), r = n.exec(e), r && (t.protocol = r[1].toLowerCase(), e = e.substring(n.lastIndex)), n = new RegExp("^" + l, "gi"), r = n.exec(e)) {
				var i = r[1].substring(2);
				e = e.substring(n.lastIndex);
				var s = i.indexOf("@");
				-1 !== s && (i = i.substring(s + 1)), t.host = i;
				var a = i.lastIndexOf(":");
				-1 !== a && (t.port = i.substring(a + 1), i = i.substring(0, a)), t.hostname = i
			}
			n = new RegExp("^" + u, "gi"), r = n.exec(e);
			var h = void 0;
			if (r && (h = r[1], e = e.substring(n.lastIndex)), h ? h.startsWith("/") || (h = "/" + h) : h = "/", t.pathname = h, e.startsWith("?")) {
				var f = e.indexOf("#", 1);
				-1 === f && (f = e.length), t.search = e.substring(0, f), e = e.substring(f)
			} else t.search = "";
			return t.hash = e.startsWith("#") ? e : "", t
		}

		function o(e) {
			var t = e || this, n = t.hash, r = t.host, i = t.pathname, s = t.protocol, o = t.search, a = "";
			return s && (a += s), r && (a += "//" + r), a += i || "/", o && (a += o), n && (a += n), a
		}

		function a(e) {
			var t = s(r(e.url || ""));
			if (!t.protocol) {
				var n = e.protocol || e.scheme;
				n && (n.endsWith(":") || (n += ":"), t.protocol = n)
			}
			var o = t.pathname;
			if (!t.host) {
				var a = e.domain || e.host || e.hostname;
				if (a) {
					var l = s(r("org.jitsi.meet://" + a)), u = l.host, c = l.hostname, h = l.pathname, f = l.port;
					u && (t.host = u, t.hostname = c, t.port = f), "/" === o && "/" !== h && (o = h)
				}
			}
			var v = e.roomName || e.room;
			!v || !t.pathname.endsWith("/") && t.pathname.endsWith("/" + v) || (o.endsWith("/") || (o += "/"), o += v), t.pathname = o;
			var d = e.jwt;
			if (d) {
				var p = t.search;
				-1 === p.indexOf("?jwt=") && -1 === p.indexOf("&jwt=") && (p.startsWith("?") || (p = "?" + p), 1 === p.length || (p += "&"), p += "jwt=" + d, t.search = p)
			}
			for (var g = t.hash, m = ["config", "interfaceConfig"], y = 0; y < m.length; y++) {
				var _ = m[y], b = i(e[_ + "Overwrite"] || e[_] || e[_ + "Override"]);
				if (b.length) {
					var w = _ + "." + b.join("&" + _ + ".");
					g.length ? w = "&" + w : g = "#", g += w
				}
			}
			return t.hash = g, t.toString() || void 0
		}

		t.a = a;
		var l = ("function" == typeof Symbol && Symbol.iterator, "(//[^/?#]+)"), u = "([^?#]*)", c = "([a-z][a-z0-9\\.\\+-]*:)"
	}, function (e, t) {
		function n() {
			var e = {
				methodName: "",
				fileLocation: "",
				line: null,
				column: null
			}, t = new Error, n = t.stack ? t.stack.split("\n") : [];
			if (!n || n.length < 1)return e;
			var r = null;
			return n[3] && (r = n[3].match(/\s*at\s*(.+?)\s*\((\S*)\s*:(\d*)\s*:(\d*)\)/)), !r || r.length <= 4 ? (0 === n[2].indexOf("log@") ? e.methodName = n[3].substr(0, n[3].indexOf("@")) : e.methodName = n[2].substr(0, n[2].indexOf("@")), e) : (e.methodName = r[1], e.fileLocation = r[2], e.line = r[3], e.column = r[4], e)
		}

		function r() {
			var e = arguments[0], t = arguments[1], r = Array.prototype.slice.call(arguments, 2);
			if (!(s[t] < e.level))for (var i = n(), a = o.concat(e.transports), l = 0; l < a.length; l++) {
				var u = a[l], c = u[t];
				c && "function" == typeof c && c.bind(u, e.id ? "[" + e.id + "]" : "", "<" + i.methodName + ">: ").apply(u, r)
			}
		}

		function i(e, t, n, i) {
			this.id = t, this.format = i, this.transports = n, this.transports || (this.transports = []), this.level = s[e];
			for (var o = Object.keys(s), a = 0; a < o.length; a++)this[o[a]] = r.bind(null, this, o[a])
		}

		var s = {trace: 0, debug: 1, info: 2, log: 3, warn: 4, error: 5};
		i.consoleTransport = console;
		var o = [i.consoleTransport];
		i.addGlobalTransport = function (e) {
			-1 === o.indexOf(e) && o.push(e)
		}, i.removeGlobalTransport = function (e) {
			var t = o.indexOf(e);
			-1 !== t && o.splice(t, 1)
		}, i.prototype.setLevel = function (e) {
			this.level = s[e]
		}, e.exports = i, i.levels = {
			TRACE: "trace",
			DEBUG: "debug",
			INFO: "info",
			LOG: "log",
			WARN: "warn",
			ERROR: "error"
		}
	}, function (e, t, n) {
		e.exports = n(3).default
	}, function (e, t, n) {
		"use strict";
		Object.defineProperty(t, "__esModule", {value: !0}), function (e) {
			function r(e, t) {
				var n = {};
				for (var r in e)t.indexOf(r) >= 0 || Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]);
				return n
			}

			function i(e, t) {
				if (!(e instanceof t))throw new TypeError("Cannot call a class as a function")
			}

			function s(e, t) {
				if (!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
				return !t || "object" != typeof t && "function" != typeof t ? e : t
			}

			function o(e, t) {
				if ("function" != typeof t && null !== t)throw new TypeError("Super expression must either be null or a function, not " + typeof t);
				e.prototype = Object.create(t && t.prototype, {
					constructor: {
						value: e,
						enumerable: !1,
						writable: !0,
						configurable: !0
					}
				}), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t)
			}

			function a(e, t) {
				e._numberOfParticipants += t
			}

			function l(e) {
				var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
				return Object(v.a)(y({}, t, {url: (t.noSSL ? "http" : "https") + "://" + e + "/#jitsi_meet_external_api_id=" + x}))
			}

			function u(e) {
				if (!e.length)return {};
				var t = e[0];
				switch (void 0 === t ? "undefined" : m(t)) {
					case"string":
					case void 0:
						var n = g(e, 8);
						return {
							roomName: n[0],
							width: n[1],
							height: n[2],
							parentNode: n[3],
							configOverwrite: n[4],
							interfaceConfigOverwrite: n[5],
							noSSL: n[6],
							jwt: n[7]
						};
					case"object":
						return e[0];
					default:
						throw new Error("Can't parse the arguments!")
				}
			}

			function c(e) {
				var t = void 0, n = /([0-9]*\.?[0-9]+)(em|pt|px|%)$/;
				return "string" == typeof e && null !== String(e).match(n) ? t = e : "number" == typeof e && (t = e + "px"), t
			}

			var h = n(4), f = n.n(h), v = n(0), d = n(5), p = function () {
				function e(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value"in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
					}
				}

				return function (t, n, r) {
					return n && e(t.prototype, n), r && e(t, r), t
				}
			}(), g = function () {
				function e(e, t) {
					var n = [], r = !0, i = !1, s = void 0;
					try {
						for (var o, a = e[Symbol.iterator](); !(r = (o = a.next()).done) && (n.push(o.value), !t || n.length !== t); r = !0);
					} catch (e) {
						i = !0, s = e
					} finally {
						try {
							!r && a.return && a.return()
						} finally {
							if (i)throw s
						}
					}
					return n
				}

				return function (t, n) {
					if (Array.isArray(t))return t;
					if (Symbol.iterator in Object(t))return e(t, n);
					throw new TypeError("Invalid attempt to destructure non-iterable instance")
				}
			}(), m = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
				return typeof e
			} : function (e) {
				return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
			}, y = Object.assign || function (e) {
					for (var t = 1; t < arguments.length; t++) {
						var n = arguments[t];
						for (var r in n)Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
					}
					return e
				}, _ = n(7).getLogger(e), b = ["css/all.css", "libs/alwaysontop.min.js"], w = {
				avatarUrl: "avatar-url",
				displayName: "display-name",
				email: "email",
				hangup: "video-hangup",
				toggleAudio: "toggle-audio",
				toggleChat: "toggle-chat",
				toggleContactList: "toggle-contact-list",
				toggleFilmStrip: "toggle-film-strip",
				toggleShareScreen: "toggle-share-screen",
				toggleVideo: "toggle-video"
			}, L = {
				"audio-availability-changed": "audioAvailabilityChanged",
				"audio-mute-status-changed": "audioMuteStatusChanged",
				"display-name-change": "displayNameChange",
				"incoming-message": "incomingMessage",
				"outgoing-message": "outgoingMessage",
				"participant-joined": "participantJoined",
				"participant-left": "participantLeft",
				"video-ready-to-close": "readyToClose",
				"video-conference-joined": "videoConferenceJoined",
				"video-conference-left": "videoConferenceLeft",
				"video-availability-changed": "videoAvailabilityChanged",
				"video-mute-status-changed": "videoMuteStatusChanged"
			}, x = 0, k = function (e) {
				function t(e) {
					i(this, t);
					for (var n = s(this, (t.__proto__ || Object.getPrototypeOf(t)).call(this)), r = arguments.length, o = Array(r > 1 ? r - 1 : 0), a = 1; a < r; a++)o[a - 1] = arguments[a];
					var c = u(o), h = c.roomName, f = void 0 === h ? "" : h, v = c.width, p = void 0 === v ? "100%" : v, g = c.height, m = void 0 === g ? "100%" : g, y = c.parentNode, _ = void 0 === y ? document.body : y, b = c.configOverwrite, w = void 0 === b ? {} : b, L = c.interfaceConfigOverwrite, k = void 0 === L ? {} : L, O = c.noSSL, E = void 0 !== O && O, j = c.jwt, S = void 0 === j ? void 0 : j;
					return n._parentNode = _, n._url = l(e, {
						configOverwrite: w,
						interfaceConfigOverwrite: k,
						jwt: S,
						noSSL: E,
						roomName: f
					}), n._baseUrl = (E ? "http" : "https") + "://" + e + "/", n._createIFrame(m, p), n._transport = new d.b({
						backend: new d.a({
							postisOptions: {
								scope: "jitsi_meet_external_api_" + x,
								window: n._frame.contentWindow
							}
						})
					}), n._numberOfParticipants = 1, n._setupListeners(), x++, n
				}

				return o(t, e), p(t, [{
					key: "_createIFrame", value: function (e, t) {
						var n = "jitsiConferenceFrame" + x;
						this._frame = document.createElement("iframe"), this._frame.allow = "camera; microphone", this._frame.src = this._url, this._frame.name = n, this._frame.id = n, this._setSize(e, t), this._frame.setAttribute("allowFullScreen", "true"), this._frame.style.border = 0, this._frame = this._parentNode.appendChild(this._frame)
					}
				}, {
					key: "_getAlwaysOnTopResources", value: function () {
						var e = this;
						return b.map(function (t) {
							return e._baseUrl + t
						})
					}
				}, {
					key: "_setSize", value: function (e, t) {
						var n = c(e), r = c(t);
						void 0 !== n && (this._frame.style.height = n), void 0 !== r && (this._frame.style.width = r)
					}
				}, {
					key: "_setupListeners", value: function () {
						var e = this;
						this._transport.on("event", function (t) {
							var n = t.name, i = r(t, ["name"]);
							"participant-joined" === n ? a(e, 1) : "participant-left" === n && a(e, -1);
							var s = L[n];
							return !!s && (e.emit(s, i), !0)
						})
					}
				}, {
					key: "addEventListener", value: function (e, t) {
						this.on(e, t)
					}
				}, {
					key: "addEventListeners", value: function (e) {
						for (var t in e)this.addEventListener(t, e[t])
					}
				}, {
					key: "dispose", value: function () {
						this._transport.dispose(), this.removeAllListeners(), this._frame && this._frame.parentNode.removeChild(this._frame)
					}
				}, {
					key: "executeCommand", value: function (e) {
						for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)n[r - 1] = arguments[r];
						if (!(e in w))return void _.error("Not supported command name.");
						this._transport.sendEvent({data: n, name: w[e]})
					}
				}, {
					key: "executeCommands", value: function (e) {
						for (var t in e)this.executeCommand(t, e[t])
					}
				}, {
					key: "isAudioAvailable", value: function () {
						return this._transport.sendRequest({name: "is-audio-available"})
					}
				}, {
					key: "isAudioMuted", value: function () {
						return this._transport.sendRequest({name: "is-audio-muted"})
					}
				}, {
					key: "getIFrame", value: function () {
						return this._frame
					}
				}, {
					key: "getNumberOfParticipants", value: function () {
						return this._numberOfParticipants
					}
				}, {
					key: "isVideoAvailable", value: function () {
						return this._transport.sendRequest({name: "is-video-available"})
					}
				}, {
					key: "isVideoMuted", value: function () {
						return this._transport.sendRequest({name: "is-video-muted"})
					}
				}, {
					key: "removeEventListener", value: function (e) {
						this.removeAllListeners(e)
					}
				}, {
					key: "removeEventListeners", value: function (e) {
						var t = this;
						e.forEach(function (e) {
							return t.removeEventListener(e)
						})
					}
				}]), t
			}(f.a);
			t.default = k
		}.call(t, "modules/API/external/external_api.js")
	}, function (e, t) {
		function n() {
			this._events = this._events || {}, this._maxListeners = this._maxListeners || void 0
		}

		function r(e) {
			return "function" == typeof e
		}

		function i(e) {
			return "number" == typeof e
		}

		function s(e) {
			return "object" == typeof e && null !== e
		}

		function o(e) {
			return void 0 === e
		}

		e.exports = n, n.EventEmitter = n, n.prototype._events = void 0, n.prototype._maxListeners = void 0, n.defaultMaxListeners = 10, n.prototype.setMaxListeners = function (e) {
			if (!i(e) || e < 0 || isNaN(e))throw TypeError("n must be a positive number");
			return this._maxListeners = e, this
		}, n.prototype.emit = function (e) {
			var t, n, i, a, l, u;
			if (this._events || (this._events = {}), "error" === e && (!this._events.error || s(this._events.error) && !this._events.error.length)) {
				if ((t = arguments[1])instanceof Error)throw t;
				var c = new Error('Uncaught, unspecified "error" event. (' + t + ")");
				throw c.context = t, c
			}
			if (n = this._events[e], o(n))return !1;
			if (r(n))switch (arguments.length) {
				case 1:
					n.call(this);
					break;
				case 2:
					n.call(this, arguments[1]);
					break;
				case 3:
					n.call(this, arguments[1], arguments[2]);
					break;
				default:
					a = Array.prototype.slice.call(arguments, 1), n.apply(this, a)
			} else if (s(n))for (a = Array.prototype.slice.call(arguments, 1), u = n.slice(), i = u.length, l = 0; l < i; l++)u[l].apply(this, a);
			return !0
		}, n.prototype.addListener = function (e, t) {
			var i;
			if (!r(t))throw TypeError("listener must be a function");
			return this._events || (this._events = {}), this._events.newListener && this.emit("newListener", e, r(t.listener) ? t.listener : t), this._events[e] ? s(this._events[e]) ? this._events[e].push(t) : this._events[e] = [this._events[e], t] : this._events[e] = t, s(this._events[e]) && !this._events[e].warned && (i = o(this._maxListeners) ? n.defaultMaxListeners : this._maxListeners) && i > 0 && this._events[e].length > i && (this._events[e].warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[e].length), "function" == typeof console.trace && console.trace()), this
		}, n.prototype.on = n.prototype.addListener, n.prototype.once = function (e, t) {
			function n() {
				this.removeListener(e, n), i || (i = !0, t.apply(this, arguments))
			}

			if (!r(t))throw TypeError("listener must be a function");
			var i = !1;
			return n.listener = t, this.on(e, n), this
		}, n.prototype.removeListener = function (e, t) {
			var n, i, o, a;
			if (!r(t))throw TypeError("listener must be a function");
			if (!this._events || !this._events[e])return this;
			if (n = this._events[e], o = n.length, i = -1, n === t || r(n.listener) && n.listener === t)delete this._events[e], this._events.removeListener && this.emit("removeListener", e, t); else if (s(n)) {
				for (a = o; a-- > 0;)if (n[a] === t || n[a].listener && n[a].listener === t) {
					i = a;
					break
				}
				if (i < 0)return this;
				1 === n.length ? (n.length = 0, delete this._events[e]) : n.splice(i, 1), this._events.removeListener && this.emit("removeListener", e, t)
			}
			return this
		}, n.prototype.removeAllListeners = function (e) {
			var t, n;
			if (!this._events)return this;
			if (!this._events.removeListener)return 0 === arguments.length ? this._events = {} : this._events[e] && delete this._events[e], this;
			if (0 === arguments.length) {
				for (t in this._events)"removeListener" !== t && this.removeAllListeners(t);
				return this.removeAllListeners("removeListener"), this._events = {}, this
			}
			if (n = this._events[e], r(n))this.removeListener(e, n); else if (n)for (; n.length;)this.removeListener(e, n[n.length - 1]);
			return delete this._events[e], this
		}, n.prototype.listeners = function (e) {
			return this._events && this._events[e] ? r(this._events[e]) ? [this._events[e]] : this._events[e].slice() : []
		}, n.prototype.listenerCount = function (e) {
			if (this._events) {
				var t = this._events[e];
				if (r(t))return 1;
				if (t)return t.length
			}
			return 0
		}, n.listenerCount = function (e, t) {
			return e.listenerCount(t)
		}
	}, function (e, t, n) {
		"use strict";
		function r(e, t) {
			var n = {};
			for (var r in e)t.indexOf(r) >= 0 || Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]);
			return n
		}

		function i(e, t) {
			if (!(e instanceof t))throw new TypeError("Cannot call a class as a function")
		}

		function s(e) {
			if (Array.isArray(e)) {
				for (var t = 0, n = Array(e.length); t < e.length; t++)n[t] = e[t];
				return n
			}
			return Array.from(e)
		}

		function o(e, t) {
			if (!(e instanceof t))throw new TypeError("Cannot call a class as a function")
		}

		var a = function (e) {
			var t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "hash", r = "search" === n ? e.search : e.hash, i = {};
			return r && r.substr(1).split("&").forEach(function (e) {
				var n = e.split("="), r = n[0];
				if (r) {
					var s = void 0;
					try {
						s = n[1], t || (s = JSON.parse(decodeURIComponent(s).replace(/\\&/, "&")))
					} catch (e) {
						var o = "Failed to parse URL parameter value: " + String(s);
						return console.warn(o, e), void(window.onerror && window.onerror(o, null, null, null, e))
					}
					i[r] = s
				}
			}), i
		}(window.location).jitsi_meet_external_api_id, l = (n(0), n(6)), u = n.n(l), c = Object.assign || function (e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n)Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
				}
				return e
			}, h = function () {
			function e(e, t) {
				for (var n = 0; n < t.length; n++) {
					var r = t[n];
					r.enumerable = r.enumerable || !1, r.configurable = !0, "value"in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
				}
			}

			return function (t, n, r) {
				return n && e(t.prototype, n), r && e(t, r), t
			}
		}(), f = {window: window.opener || window.parent}, v = ["avatar-url", "display-name", "email", "toggle-audio", "toggle-chat", "toggle-contact-list", "toggle-film-strip", "toggle-share-screen", "toggle-video", "video-hangup"], d = ["display-name-change", "incoming-message", "outgoing-message", "participant-joined", "participant-left", "video-conference-joined", "video-conference-left", "video-ready-to-close"], p = "message", g = function () {
			function e() {
				var t = this, n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, r = n.enableLegacyFormat, s = n.postisOptions;
				i(this, e), this.postis = u()(c({}, f, s)), this._enableLegacyFormat = r, this._enableLegacyFormat && v.forEach(function (e) {
					return t.postis.listen(e, function (n) {
						return t._legacyMessageReceivedCallback(e, n)
					})
				}), this._receiveCallback = function () {
				}, this.postis.listen(p, function (e) {
					return t._receiveCallback(e)
				})
			}

			return h(e, [{
				key: "_legacyMessageReceivedCallback", value: function (e) {
					var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
					this._receiveCallback({data: {name: e, data: t}})
				}
			}, {
				key: "_sendLegacyMessage", value: function (e) {
					var t = e.name, n = r(e, ["name"]);
					t && -1 !== d.indexOf(t) && this.postis.send({method: t, params: n})
				}
			}, {
				key: "dispose", value: function () {
					this.postis.destroy()
				}
			}, {
				key: "send", value: function (e) {
					this.postis.send({
						method: p,
						params: e
					}), this._enableLegacyFormat && this._sendLegacyMessage(e.data || {})
				}
			}, {
				key: "setReceiveCallback", value: function (e) {
					this._receiveCallback = e
				}
			}]), e
		}(), m = g, y = function () {
			function e(e, t) {
				for (var n = 0; n < t.length; n++) {
					var r = t[n];
					r.enumerable = r.enumerable || !1, r.configurable = !0, "value"in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
				}
			}

			return function (t, n, r) {
				return n && e(t.prototype, n), r && e(t, r), t
			}
		}(), _ = function () {
			function e() {
				var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, n = t.backend;
				o(this, e), this._listeners = new Map, this._requestID = 0, this._responseHandlers = new Map, this._unprocessedMessages = new Set, this.addListener = this.on, n && this.setBackend(n)
			}

			return y(e, [{
				key: "_disposeBackend", value: function () {
					this._backend && (this._backend.dispose(), this._backend = null)
				}
			}, {
				key: "_onMessageReceived", value: function (e) {
					var t = this;
					if ("response" === e.type) {
						var n = this._responseHandlers.get(e.id);
						n && (n(e), this._responseHandlers.delete(e.id))
					} else"request" === e.type ? this.emit("request", e.data, function (n, r) {
						t._backend.send({type: "response", error: r, id: e.id, result: n})
					}) : this.emit("event", e.data)
				}
			}, {
				key: "dispose", value: function () {
					this._responseHandlers.clear(), this._unprocessedMessages.clear(), this.removeAllListeners(), this._disposeBackend()
				}
			}, {
				key: "emit", value: function (e) {
					for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)n[r - 1] = arguments[r];
					var i = this._listeners.get(e), s = !1;
					return i && i.size && i.forEach(function (e) {
						s = e.apply(void 0, n) || s
					}), s || this._unprocessedMessages.add(n), s
				}
			}, {
				key: "on", value: function (e, t) {
					var n = this, r = this._listeners.get(e);
					return r || (r = new Set, this._listeners.set(e, r)), r.add(t), this._unprocessedMessages.forEach(function (e) {
						t.apply(void 0, s(e)) && n._unprocessedMessages.delete(e)
					}), this
				}
			}, {
				key: "removeAllListeners", value: function (e) {
					return e ? this._listeners.delete(e) : this._listeners.clear(), this
				}
			}, {
				key: "removeListener", value: function (e, t) {
					var n = this._listeners.get(e);
					return n && n.delete(t), this
				}
			}, {
				key: "sendEvent", value: function () {
					var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
					this._backend && this._backend.send({type: "event", data: e})
				}
			}, {
				key: "sendRequest", value: function (e) {
					var t = this;
					if (!this._backend)return Promise.reject(new Error("No transport backend defined!"));
					this._requestID++;
					var n = this._requestID;
					return new Promise(function (r, i) {
						t._responseHandlers.set(n, function (e) {
							var t = e.error, n = e.result;
							void 0 !== n ? r(n) : i(void 0 !== t ? t : new Error("Unexpected response format!"))
						}), t._backend.send({type: "request", data: e, id: n})
					})
				}
			}, {
				key: "setBackend", value: function (e) {
					this._disposeBackend(), this._backend = e, this._backend.setReceiveCallback(this._onMessageReceived.bind(this))
				}
			}]), e
		}(), b = _;
		n.d(t, "a", function () {
			return m
		}), n.d(t, "b", function () {
			return b
		});
		var w = {};
		"number" == typeof a && (w.scope = "jitsi_meet_external_api_" + a), (function () {
			return window.JitsiMeetJS || (window.JitsiMeetJS = {}), window.JitsiMeetJS.app || (window.JitsiMeetJS.app = {}), window.JitsiMeetJS.app
		}()).setExternalTransportBackend = function (e) {
			return (void 0).setBackend(e)
		}
	}, function (e, t) {
		function n(e) {
			var t, n = e.scope, r = e.window, i = e.windowForEventListening || window, s = {}, o = [], a = {}, l = !1, u = function (e) {
				var t;
				try {
					t = JSON.parse(e.data)
				} catch (e) {
					return
				}
				if (t.postis && t.scope === n) {
					var r = s[t.method];
					if (r)for (var i = 0; i < r.length; i++)r[i].call(null, t.params); else a[t.method] = a[t.method] || [], a[t.method].push(t.params)
				}
			};
			i.addEventListener("message", u, !1);
			var c = {
				listen: function (e, t) {
					s[e] = s[e] || [], s[e].push(t);
					var n = a[e];
					if (n)for (var r = s[e], i = 0; i < r.length; i++)for (var o = 0; o < n.length; o++)r[i].call(null, n[o]);
					delete a[e]
				}, send: function (e) {
					var t = e.method;
					(l || "__ready__" === e.method) && r && "function" == typeof r.postMessage ? r.postMessage(JSON.stringify({
						postis: !0,
						scope: n,
						method: t,
						params: e.params
					}), "*") : o.push(e)
				}, ready: function (e) {
					l ? e() : setTimeout(function () {
						c.ready(e)
					}, 50)
				}, destroy: function (e) {
					clearInterval(t), l = !1, i && "function" == typeof i.removeEventListener && i.removeEventListener("message", u), e && e()
				}
			}, h = +new Date + Math.random() + "";
			return t = setInterval(function () {
				c.send({method: "__ready__", params: h})
			}, 50), c.listen("__ready__", function (e) {
				if (e === h) {
					clearInterval(t), l = !0;
					for (var n = 0; n < o.length; n++)c.send(o[n]);
					o = []
				} else c.send({method: "__ready__", params: e})
			}), c
		}

		e.exports = n
	}, function (e, t, n) {
		var r = n(1), i = n(8), s = {}, o = [], a = r.levels.TRACE;
		e.exports = {
			addGlobalTransport: function (e) {
				r.addGlobalTransport(e)
			}, removeGlobalTransport: function (e) {
				r.removeGlobalTransport(e)
			}, getLogger: function (e, t, n) {
				var i = new r(a, e, t, n);
				return e ? (s[e] = s[e] || [], s[e].push(i)) : o.push(i), i
			}, setLogLevelById: function (e, t) {
				for (var n = t ? s[t] || [] : o, r = 0; r < n.length; r++)n[r].setLevel(e)
			}, setLogLevel: function (e) {
				a = e;
				for (var t = 0; t < o.length; t++)o[t].setLevel(e);
				for (var n in s) {
					var r = s[n] || [];
					for (t = 0; t < r.length; t++)r[t].setLevel(e)
				}
			}, levels: r.levels, LogCollector: i
		}
	}, function (e, t, n) {
		function r(e, t) {
			this.logStorage = e, this.stringifyObjects = !(!t || !t.stringifyObjects) && t.stringifyObjects, this.storeInterval = t && t.storeInterval ? t.storeInterval : 3e4, this.maxEntryLength = t && t.maxEntryLength ? t.maxEntryLength : 1e4, Object.keys(i.levels).forEach(function (e) {
				this[i.levels[e]] = function (e) {
					this._log.apply(this, arguments)
				}.bind(this, e)
			}.bind(this)), this.storeLogsIntervalID = null, this.queue = [], this.totalLen = 0, this.outputCache = []
		}

		var i = n(1);
		r.prototype.stringify = function (e) {
			try {
				return JSON.stringify(e)
			} catch (e) {
				return "[object with circular refs?]"
			}
		}, r.prototype.formatLogMessage = function (e) {
			for (var t = "", n = 1, r = arguments.length; n < r; n++) {
				var s = arguments[n];
				!this.stringifyObjects && e !== i.levels.ERROR || "object" != typeof s || (s = this.stringify(s)), t += s, n != r - 1 && (t += " ")
			}
			return t.length ? t : null
		}, r.prototype._log = function () {
			var e = this.formatLogMessage.apply(this, arguments);
			if (e) {
				var t = this.queue.length ? this.queue[this.queue.length - 1] : void 0;
				("object" == typeof t ? t.text : t) == e ? "object" == typeof t ? t.count += 1 : this.queue[this.queue.length - 1] = {
					text: e,
					count: 2
				} : (this.queue.push(e), this.totalLen += e.length)
			}
			this.totalLen >= this.maxEntryLength && this._flush(!0, !0)
		}, r.prototype.start = function () {
			this._reschedulePublishInterval()
		}, r.prototype._reschedulePublishInterval = function () {
			this.storeLogsIntervalID && (window.clearTimeout(this.storeLogsIntervalID), this.storeLogsIntervalID = null), this.storeLogsIntervalID = window.setTimeout(this._flush.bind(this, !1, !0), this.storeInterval)
		}, r.prototype.flush = function () {
			this._flush(!1, !0)
		}, r.prototype._flush = function (e, t) {
			this.totalLen > 0 && (this.logStorage.isReady() || e) && (this.logStorage.isReady() ? (this.outputCache.length && (this.outputCache.forEach(function (e) {
				this.logStorage.storeLogs(e)
			}.bind(this)), this.outputCache = []), this.logStorage.storeLogs(this.queue)) : this.outputCache.push(this.queue), this.queue = [], this.totalLen = 0), t && this._reschedulePublishInterval()
		}, r.prototype.stop = function () {
			this._flush(!1, !1)
		}, e.exports = r
	}])
});
//# sourceMappingURL=external_api.min.map