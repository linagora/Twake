'use strict';

var appadmin = angular.module("TwakeAdministration",

	/* Requires */
	[
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ui.router',
		'cp.ngConfirm',
		'chart.js'
	])

	.service("UnId", function () {

		var nextId = 1;

		this.get = function () {
			return nextId++;
		}
	})

	/* API connexions */

	.service('$api', function ($http, $rootScope, $location, $state, $window) {

		$rootScope.api = this;

		var that = this;
		this.base = APIBASE;
		this.base = this.base.replace(/\/ajax/, "") + "administration/ajax/";
		this.lastActivity = (new Date()).getTime();
		this.token = window.localStorage.getItem("adminToken");
		this.user = {};

		this.setToken = function(token){
			this.token = token;
			window.localStorage.setItem("adminToken", token);
		}

		this.getRealRoute = function (route) {
			route = route.replace(/\/+/g, "/");

			if (route.substring(0, 1) == "/") {
				route = route.slice(1);
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

			if (!this.token || this.token==null || this.token == "") {
				$state.go("loginpage");
				return;
			}

			$.ajax({
				type: "POST",
				url: this.getRealRoute(route),
				headers: {
					'Authorization': 'Token ' + this.token
				},
				dataType: 'json',
				data: data,
				success: function (response) {

					response = that.addOErrors(response);

					if (response.oerrors != undefined && response.oerrors.disconnected) {
						$state.go("loginpage");
						return;
					}

					if (callbackSuccess != undefined) {
						callbackSuccess(response);
					}

				}
			});
		};

	})

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

	/* Auto find view directory for @view */
	.config(function ($httpProvider) {
		//Change app root
		$httpProvider.interceptors.push(function ($q) {
			return {
				'request': function (config) {
					config.url = config.url.replace('@views', '/angular/administration/views/');
					return config;
				}
			};
		});
	})

	.run(function ($rootScope, $window) {
		$rootScope.window = $window;
	})

	.config(function ($stateProvider, $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true);
		$urlRouterProvider
			.otherwise('/');
		$stateProvider
			.state('general', {
				templateUrl: '@views/general.html',
				controller: function ($api, $rootScope) {
					$("#app").find("div").hide();
					$rootScope.cadmin = {};
					$api.post("authentication/currentUser", {}, function (res) {
						$rootScope.cadmin = res.data;
						$("#app").find("div").show();
					});
				}
			})
			.state('home', {
				url: "/",
				parent: "general",
				controller: function ($state) {
					$state.go("user-all");
				}
			});
	})

	.run(function ($rootScope, $api, $ngConfirmDefaults) {


	});
