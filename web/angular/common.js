/* Utils */
function base64_encode(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}
function base64_decode(value) {
	return decodeURIComponent(escape(window.atob(value)));
}

/* App common creator */

function createCommonApp(appName) {
	var app = angular.module(appName,

		/* Requires */
		[
			'pascalprecht.translate',
			'ngAnimate',
			'ngCookies',
			'ngResource',
			'ngRoute',
			'ngSanitize',
			'ngTouch',
			'ui.router',
			'720kb.socialshare',
			'ngGeolocation',
			'monospaced.elastic',
			'GosWebsocket',
			'angular-loading-bar',
			'cp.ngConfirm',
			'ngFileUpload',
			'ngTagsInput',
			'ui.bootstrap',
			'autocomplete',
			'ng-country-selector',
			'ngSanitize',
			'ngToast',
			'ui.bootstrap.contextMenu',
			'ui.ace',
			'ngDragDrop'
		]);

	app.config(['ngToastProvider', function (ngToastProvider) {
		ngToastProvider.configure({
			animation: 'slide', // or 'fade',
			dismissButton: true,
			timeout: 10000
		});
	}])

		.service("UnId", function () {

			var nextId = 1;

			this.get = function () {
				return nextId++;
			}
		})

		/* API connexions */

		.service('$api', function ($http, $rootScope, $location, $state, $window, mainloader) {

			$rootScope.api = this;

			var that = this;
			this.base = APIBASE;
			this.lastActivity = (new Date()).getTime();

			this.testConnection = function () {
				if ((new Date()).getTime() - that.lastActivity > 60 * 60 * 1000) { //60 minutes
					$window.location.reload();
				}
				if ((new Date()).getTime() - that.lastActivity > 10 * 60 * 1000) { //10 minutes
					if ($rootScope.cuser) {
						$rootScope.cuser.update();
					}
				}
			}

			this.getRealRoute = function (route) {
				route = route.replace(/\/+/g, "/");

				if (route.substring(0, 1) == "/") {
					route = route.slice(1);
				}

				if (route.substring(0, 5) == "ajax/") {
					route = route.slice(5);
				}
				return this.base + route;
			}

			this.addOErrors = function (response) {

				if (response.errors != undefined) {
					response.oerrors = {};
					angular.forEach(response.errors, function (el) {
						response.oerrors[el] = true;
					});
				}

				return response;
			}

			this.post = function (route, data, callbackSuccess) {

				that.lastActivity = (new Date()).getTime();

				$http.post(this.getRealRoute(route), data, {ignoreLoadingBar: true})
					.success(function (response) {

						response = that.addOErrors(response);

						if (response.oerrors != undefined && response.oerrors.disconnected != undefined) {
							$location.url("/");
						}

						if (response.oerrors != undefined && response.oerrors.notconnected && $rootScope.cuser && $rootScope.cuser.data && $rootScope.cuser.data.status == 'connected') {
							$state.go("disconnected");
						}

						if (callbackSuccess != undefined) {
							callbackSuccess(response);
						}

					}).error(function (error) {
						console.log(error);
					});
			};

		})

		.service('renderWatcher', function ($rootScope) {
			var stack = [];
			var enabled = false;
			this.init = function (startCallback, readyCallback) {
				$rootScope.$on('$viewContentLoading', function (event, view) {
					if (enabled) {
						stack.push(event.targetScope.$id);
					}
				});
				$rootScope.$on('$viewContentLoaded', function (event, view) {
					if (enabled) {
						stack.pop(event.targetScope.$id);
						if (!stack.length) {
							if (readyCallback) {
								readyCallback();
							}
						}
					}
				});
				$rootScope.$on('$stateChangeStart', function () {
					enabled = false;
					if (startCallback) {
						startCallback();
					}
				});
				$rootScope.$on('$stateChangeSuccess', function () {
					enabled = true;
				});
			}
		})

		.service('$ws', function ($q, $window, $location, $rootScope, $api, mainloader) {

			$rootScope.server_loaded = false;
			mainloader.start();
			$rootScope.ws = this;

			var that = this;
			this.buffered = true; //Until connected
			this.buffered_subscribes = {};
			this.buffered_publish = {};
			this.all_subscribes = {};
			that.initiated = false;
			that.timeout = setTimeout("");

			this.init = function () {

				if (this.initiated) {
					return;
				}
				that.initiated = true;

				that.hardResetSocket();

				that.testConnection();
				$($window).focus(function () {
					that.testConnection();
				});

			}

			this.echoTimeout = setTimeout("");
			this.testConnection = function () {

				$api.testConnection(); //Update session, check classic http connection


				if (!$window.webSocketSession) {
					return;
				}
				if ($rootScope.cuser.data.uid) {
					clearTimeout(that.echoTimeout);
					that.buffered = true;
					that.echoTimeout = setTimeout(function () {
						that.hardResetSocket();
					}, 2000);

					$window.webSocketSession.subscribe("echo/" + $rootScope.cuser.data.uid, function (uri, res) {

						that.resolveBuffered();

						clearTimeout(that.echoTimeout);
						that.echoTimeout = setTimeout(that.testConnection, 10000); //Force echo each 10s

						try {
							$window.webSocketSession.unsubscribe("echo/" + $rootScope.cuser.data.uid);
						}
						catch (err) {
						}

					});
					$window.webSocketSession.publish("echo/" + $rootScope.cuser.data.uid, "echo");
				}


			}

			var resetSocketShowLoaderTimeout = setTimeout("");
			this.hardResetSocket = function () {

				that.buffered = true;
				$rootScope.server_loaded = false;
				clearTimeout(resetSocketShowLoaderTimeout);
				resetSocketShowLoaderTimeout = setTimeout(function () {
					mainloader.start();
				}, 20000);

				$window.webSocket = null;
				$window.webSocketSession = null;
				if ($window.location.protocol === 'https:' || $window.standalone) {
					$window.webSocket = WS.connect("wss://" + WEBSOCKET_IP);
				} else {
					$window.webSocket = WS.connect("ws://" + WEBSOCKET_IP);
				}

				$window.webSocket.on("socket/connect", function (session) {

					clearTimeout(resetSocketShowLoaderTimeout);
					clearTimeout(that.timeout);

					$rootScope.server_loaded = true;
					if ($rootScope.view_loaded) {
						mainloader.stop();
					}

					$window.webSocketSession = session;
					that.showError("");

					$rootScope.$apply();

					//Resubscribe
					angular.forEach(that.all_subscribes, function (list, route) {
						if (route) {
							angular.forEach(list, function (obj) {
								if (obj) {
									that.subscribe(route, obj.callback);
								} else {
									console.log("No callback for " + route);
									console.log(list);
								}
							});
						}
					});

					that.resolveBuffered();
					that.testConnection();

				});

				$window.webSocket.on("socket/disconnect", function (error) {

					console.log("websocket disconnect !");

					that.buffered = true;

					$window.webSocketSession = null;
					console.log("WEBSOCKET DISCONNECTED");
					that.showError("Server lost, try to reconnect...");

					clearTimeout(that.timeout);
					that.timeout = setTimeout(that.hardResetSocket, 1000);

					$rootScope.$apply();

				});

			}

			this.resolveBuffered = function () {

				this.buffered = false;

				angular.forEach(that.buffered_subscribes, function (list, route) {
					if (route) {
						angular.forEach(list, function (obj) {
							that.subscribe(route, obj.callback, obj.onSuscribed);
						});
					}
				});
				that.buffered_subscribes = {};

				angular.forEach(that.buffered_publish, function (list, route) {
					angular.forEach(list, function (obj) {
						if (obj.data && route) {
							that.publish(route, JSON.parse(obj.data), obj.onPublished);
						}
					});
				});
				that.buffered_publish = {};

			}

			this.subscribe = function (route, callback, onSuscribed) {

				if (that.buffered) {
					console.log("buffered subscribe to " + route);

					if (!that.buffered_subscribes[route]) {
						that.buffered_subscribes[route] = [];
					}
					that.buffered_subscribes[route].push({callback: callback, onSuscribed: onSuscribed});

				} else {
					console.log("real subscribe to " + route);

					$window.webSocketSession.subscribe(route, function (a, b) {
						console.log("received from " + route);
						console.log(b);
						if (callback) {
							callback(a, b);
						}
					});
					if (onSuscribed) onSuscribed();

					if (!that.all_subscribes[route]) {
						that.all_subscribes[route] = [];
					}
					that.all_subscribes[route].push(callback);

				}

			};

			this.unsubscribe = function (route, onUnSuscribed) {

				if (that.buffered) {
					that.buffered_subscribes[route] = [];
				} else {
					try {
						$window.webSocketSession.unsubscribe(route);
					}
					catch (err) {
						console.log("failed to unsubscribe echo");
					}
				}

				if (onUnSuscribed) onUnSuscribed();
				that.all_subscribes[route] = [];

			}

			this.publish = function (route, d, onPublished) {

				if (that.buffered) {
					console.log("buffered publish to " + route + " for " + JSON.stringify(d));

					if (!that.buffered_publish[route]) {
						that.buffered_publish[route] = [];
					}
					that.buffered_publish[route].push({data: JSON.stringify(d), onPublished: onPublished});

				} else {
					console.log("real publish to " + route + " for " + JSON.stringify(d));

					$window.webSocketSession.publish(route, d);
					if (onPublished) onPublished();

				}

			}

			this.showError = function (text) {

				var $errorMessageElement = jQuery(".websocket_error_message");
				$errorMessageElement.text(text);

				if (text === "") {
					$errorMessageElement.removeClass("error_message");
				}
				else {
					$errorMessageElement.addClass("error_message");
				}
			};

		})

		.directive("dateClearFix", function () {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					jQuery($element).datepicker().on("clearDate", function (e) {
						jQuery($element).find("input").val("").trigger("change");
					});
				}
			}
		})

		/* Current user infos */
		.service('$user', function ($http, $notification, $rootScope, $state, $api, $window) {

			$rootScope.cuser = this;

			var that = this;
			this.data = {};
			this.ready = false;
			this.readyCallbacks = [];

			this.update = function () {

				var that = this;

				$api.post("users/current/get", {}, function (resp) {

					that.data = resp.data;

					if (that.data.groups) {
						that.data.groups.sort(function (a, b) {
							return a["name"].localeCompare(b["name"]);
						});
					}

					if (!that.ready) {
						that.ready = true;
						$notification.init();
						angular.forEach(that.readyCallbacks, function (func) {
							func();
						});
					}

				});

				this.logout = function () {
					$api.post("/users/logout", {}, function (result) {
						if (result.status == "success") {
							$window.location.reload();
						} else {
							jQuery("#header_connect_error").css({"display": "inline-block"});
						}
					});
				}


			};

			this.getGroup = function (gid) {
				if (!this.data || !this.data.groups) {
					return {};
				}
				for (var i = 0; i < this.data.groups.length; i++) {
					if (this.data.groups[i].id == gid)
						return this.data.groups[i];
				}
			}

			this.onReady = function (callback) {
				if (this.ready) {
					callback();
				}
				this.readyCallbacks.push(callback);
			};

		})

		.service("$href", function ($rootScope, $location, $window) {
			$rootScope.href = this;
			this.go = function (url) {
				console.log(url);
				$location.path(url);
			};

			this.goInNewTab = function (url) {

				if ($window.electron) {
					require('electron').shell.openExternal(url);
				}
				else {
					$window.open(url, '_blank');
				}
			}

			this.goInNewTabExternal = function (url) {

				if ($window.electron) {
					require('electron').shell.openExternal(url);
				}
				else {
					$window.open(url, '_blank');
				}
			}
		})
		.run(function ($href) {
		})

		/* Loading bar configuration */
		.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
			cfpLoadingBarProvider.includeSpinner = false;
			cfpLoadingBarProvider.parentSelector = '#loading-bar-container';
		}])

		/* ngConfirm */
		.service('$confirm', function ($ngConfirm) {

			return function (message, callbackOk, callbackCancel) {
				$ngConfirm({
					title: 'Confirmez votre action',
					content: message,
					buttons: {
						ok: {
							text: "Confirmer",
							btnClass: 'btn-primary',
							keys: ['enter'], // will trigger when enter is pressed
							action: function (scope) {
								if (callbackOk) {
									callbackOk();
								}
								;
							}
						},
						// short hand button definition
						close: {
							text: "Annuler",
							action: function (scope) {
								if (callbackCancel) {
									callbackCancel();
								}
							}
						}
					}
				});
			};

		})

		/* Tags */
		.run(function ($rootScope, $api, $q) {
			$rootScope.autoCompleteTags = function (q, type) {
				var deferred = $q.defer();
				$api.post("/tags/search", {"term": q, "type": type}, function (res) {
					console.log(res.data);
					deferred.resolve(res.data);
				});
				return deferred.promise;
			};
		})

		/* Are you sure ? */
		.directive('ngReallyClick', function ($confirm) {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					$element.bind('click', function () {
						var message = $attrs.ngReallyMessage;
						if (!message) {
							message = "";
						}
						$confirm(message, function () {
							$scope.$apply($attrs.ngReallyClick);
						});

					});
				}
			}
		})

		.service('$autoAttachManager', function ($rootScope) {

			$rootScope.autoAttachManager = this;

			var that = this;

			this.attached = [];

			this.update = function () {
				angular.forEach(this.attached, function (el) {

					var pos = {
						left: 0,
						top: 0
					};
					var size = {
						height: 0,
						width: 0
					};

					if ($(el.attach).length > 0) {
						pos = $(el.attach).offset();
						size = {
							height: $(el.attach).outerHeight(),
							width: $(el.attach).outerWidth()
						}
					}

					$(el.element).css({
						"position": "fixed",
						"left": pos.left,
						"top": pos.top,
						"width": size.width,
						"height": size.height
					});

				});
			}

			this.add = function (element, attach) {
				this.attached.push({
					attach: attach,
					element: element
				});

				this.update();
			}

			$(window).resize(function () {
				that.update();
			});
			$rootScope.$on("$routeChangeStart", function () {
				setTimeout(function () {
					that.update();
				}, 500);
			});
			setInterval(function () {
				that.update();
			}, 2000);


		})
		/* Html absolute over element */
		.directive('autoAttachTo', function ($autoAttachManager) {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {

					$autoAttachManager.add($element, $attrs.autoAttachTo);

				}
			}
		})

		/* ng-load replacing onload */
		.directive('ngLoad', ['$parse', function ($parse) {

			return {
				restrict: 'A',
				compile: function ($element, attr) {
					var fn = $parse(attr['ngLoad']);

					return function (scope, element, attr) {
						element.on('load', function (event) {
							scope.$apply(function () {
								fn(scope, {$event: event});
							});
						});
					};

				}
			};

		}])

		/* ng-load replacing onload */
		.directive('scrollbar', function () {

			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {

					window.iOS = window.iOS || /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
					window.android = window.android || navigator.userAgent.toLowerCase().indexOf("android") > -1;

					window.mobile = window.iOS || window.android;

					if (window.mobile) {
						$($element).addClass("mobile_scrollable");
					} else {
						$($element).mCustomScrollbar({
							theme: "minimal-dark",
							ignoreOverlay: true,
							ignoreMobile: true,
							callbacks: {
								onScroll: function () {
									$(this).trigger("scroll")
								}
							}
						});
						$($element).addClass("scrollable");
					}

				}
			};

		})

		/* Auto find view directory for @view */
		.config(function ($httpProvider) {
			//Change app root
			$httpProvider.interceptors.push(function ($q) {
				return {
					'request': function (config) {
						config.url = config.url.replace('@pviews', '/angular/public/views/');
						config.url = config.url.replace('@aviews', '/angular/administration/views/');
						config.url = config.url.replace('@gviews', '/angular/group/views/');
						config.url = config.url.replace('@views', '/angular/views/');
						return config;
					}
				};
			});
		})

		.run(function ($rootScope, $window, $user, $ws, renderWatcher, mainloader) {
			$rootScope.window = $window;

			$user.onReady(function () {
				$ws.init();
			});

			$rootScope.view_loaded = false;
			mainloader.start();
			renderWatcher.init(
				null,
				function () {
					$rootScope.view_loaded = true;
					if ($rootScope.server_loaded) {
						mainloader.stop();
					}
				}
			);

		})

		.config(function ($stateProvider) {
			$stateProvider.state('global-structure', {
				templateUrl: '@views/general.html'
			})
		})

		.config(function ($translateProvider) {

			$translateProvider.useUrlLoader(APIBASE + '/core/translate');

			var lang = navigator.language || navigator.userLanguage;

			var availableLanguages = ['fr', 'en'];

			var preferred = availableLanguages[0];//fr

			//Get preferred language
			angular.forEach(availableLanguages, function (el) {
				if (lang.startsWith(el)) {
					preferred = el;
				}
			});

			$translateProvider.preferredLanguage(preferred);

		})
	;


	return app;
}


/* App run */

/* webRTC adapter */
window.URL = window.URL || window.mozURL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

/* WebSocket */
var webSocket;
var webSocketSession = null;

/*jQuery(function() {

 console.log("go");

 ///resetSocket();

 webSocket.on("socket/connect", function (session) {
 webSocketSession = session;
 console.log("Connected to socket !");

 webSocket.subscriptionsInfo.forEach(function(e) {
 webSocket.subscribe(e.route, e.callback, e.onSuscribed);
 });
 });

 webSocket.on("socket/disconnect", function (error) {
 webSocketSession = null;
 console.log("Disconnected for " + error.reason + " with code " + error.code);
 });

 });*/


/* Window utils */
var windowstate = {
	original: document.title,
	focused: true,
	tabmessage: function (newMsg, howManyTimes) {

		console.log(newMsg);

		var that = this;

		function step() {
			document.title = (document.title == that.original) ? newMsg : that.original;

			if (--howManyTimes > 0) {
				that.timeout = setTimeout(step, 1000);
			}
			;
		};

		howManyTimes = parseInt(howManyTimes);

		if (isNaN(howManyTimes)) {
			howManyTimes = 500000;
		}
		;

		this.tabcancel(this.timeout);
		step();
	},
	tabcancel: function () {
		clearTimeout(this.timeout);
		document.title = this.original;
	}
};
$(window).focus(function () {
	windowstate.focused = true;
	windowstate.tabcancel();
})
	.blur(function () {
		windowstate.focused = false;
	});
