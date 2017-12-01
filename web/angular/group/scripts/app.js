'use strict';

createCommonApp('TwakeGroupApp');


angular.module('twake')


	/* Auto find view directory for @view */
	.config(function ($httpProvider) {
		//Change app root
		$httpProvider.interceptors.push(function ($q) {
			return {
				'request': function (config) {
					config.url = config.url.replace('@gviews', '/angular/group/views');
					return config;
				}
			};
		});
	})


	.config(function ($stateProvider, $locationProvider, $urlRouterProvider) {
		$stateProvider
			.state('group-general', {
				parent: 'global-structure',
				templateUrl: '@gviews/general.html',
				url: '/group/:gid',
				controller: 'groupMainCtrl'
			})
			.state('group-home', {
				template: '',
				parent: 'group-general',
				url: '/',
				controller: function ($group, $state) {
					$group.onReady(function () {
						$state.go("messages-auto");
					});
				}
			})
		;
	})

	.directive("groupAutocomplete", function ($group, $api) {
		return {
			restrict: 'A',
			link: function ($scope, $element, $attrs) {
				$($element).textcomplete([{
					match: /([\-+\w]*)$/,
					search: function (term, callback) {

						var result = [];

						$api.post("group/fastsearch", {limit: 10, offset: 0, firstCharacters: term}, function (res) {

							result = res.data.groups;
							callback(result);
						});
					},
					template: function (group) {
						return group.name;
					},
					replace: function (group) {
						return group.name;
					},
					index: 1,
					maxCount: 10
				}
				], {}).on({
					'textComplete:select': function (e, value, strategy) {
						eval("$scope." + $attrs.data + " = {name:  value.name, id:  value.id};");
					}
				});
			}
		}
	})

	.service('$group', function ($api, $rootScope, $ws) {

		var that = this;
		$rootScope.cgroup = this;
		$rootScope.parametersMembersCtrl = null;

		this.clear = function () {
			this.data = {};
			this.groupId = -1;
			this.readyCallbacks = [];
			this.updateCallbacks = [];
			this.ready = false;
			this.wsinit = false;
			this.members = [];
			this.readyMembersCallbacks = [];
			this.readyMembers = false;
		}

		this.clear();

		this.onMembersReady = function (callback) {

			that.readyMembersCallbacks.push(callback);
			if (that.readyMembers) {
				callback();
			}
		};

		this.unload = function () {
			that.members = [];
			that.groupId = -1;
		}

		this.update = function () {

			window.localStorage.setItem("lastGroupId", $rootScope.cgroup.groupId);

			$api.post('group/members/table', {groupId: $rootScope.cgroup.groupId}, function (res) {
				that.members = res.data.members;
				that.readyMembers = true;
				that.readyMembersCallbacks.forEach(function (e) {
					e();
				});
			});

			that.ready = false;
			$api.post("/group/get", {"groupId": this.groupId}, function (res) {
				that.data = res.data;
				that.updateFilesTypes();
				that.ready = true;
				that.executeReadyCallbacks();
				that.executeUpdateCallbacks();
			});
			if (!this.wsinit) {
				this.wsinit = true;
				this.initWS();
			}
		};

		this.updateFilesTypes = function () {
			var apps = that.data.apps;
			var ft = {};
			for (var i = 0; i < apps.length; i++) {

				that.data.apps[i].data = base64_encode(JSON.stringify({internal: apps[i].internal, url: apps[i].url}));

				if (apps[i].filestypes && apps[i].filestypes["main"]) {
					for (var j = 0; j < apps[i].filestypes["main"].length; j++) {
						ft[apps[i].filestypes["main"][j]] = apps[i];
					}
				}
				if (apps[i].filestypes && apps[i].filestypes["other"]) {
					for (j = 0; j < apps[i].filestypes["other"].length; j++) {
						if (!ft[apps[i].filestypes["other"][j]]) {
							ft[apps[i].filestypes["other"][j]] = apps[i];
						}
					}
				}
			}
			that.data.apps_filestypes = ft;
		}

		this.onReady = function (callback) {

			that.readyCallbacks.push(callback);

			if (that.ready) {
				that.executeReadyCallbacks();
			}
		};

		this.onUpdate = function (callback) {

			that.updateCallbacks.push(callback);
		};

		this.executeReadyCallbacks = function () {
			that.readyCallbacks.forEach(function (func) {
				func();
			});
			that.readyCallbacks = [];
		};

		this.executeUpdateCallbacks = function () {
			that.updateCallbacks.forEach(function (func) {
				func();
			});
		};

		this.getRight = function (right) {

			var decomposedRight = right.split(':');
			var currentNode = that.data.right;

			decomposedRight.forEach(function (el) {
				if (currentNode === undefined || currentNode[el] === undefined) {
					return false;
				}
				currentNode = currentNode[el];
			});

			if (typeof currentNode === 'boolean') {
				return currentNode;
			}
			return false;
		}
		//Initialisation des websockets pour les updates
		this.initWS = function () {
			$ws.subscribe(this.SocketRouteFromId(this.groupId), function (uri, payload) {
				that.update();
				if ($rootScope.parametersMembersCtrl != null) {
					$rootScope.parametersMembersCtrl.loadUsers($rootScope.parametersMembersCtrl.currentPage);
				}
			});
		}

		this.SocketRouteFromId = function (id) {
			return "group/" + id;
		}

	})

	.controller('groupMainCtrl', function ($rootScope, $api, $ngConfirmDefaults, $ngConfirm, $user, $group, $stateParams, $location, $state, $scope) {

		$rootScope.cgroup.groupId = $stateParams.gid;

		/* Set confirm themes */
		$ngConfirmDefaults.theme = "dark";
		$ngConfirmDefaults.animationSpeed = 200;
		$ngConfirmDefaults.animation = "opacity";
		$ngConfirmDefaults.closeAnimation = "opacity";

		/* Update user once */
		$user.update();
		$group.update();

		$scope.$on('$stateChangeStart', function ($event, next, current) {
			if (next.parent != "group-general") {
				$group.clear();
			}
		});

		this.redirectIfNotAllowed = function (groupId) {
			var userIsInGroup = false;

			angular.forEach($user.data.groups, function (e) {

				if (e.id === parseInt(groupId)) {
					userIsInGroup = true;
				}
			});

			if (!userIsInGroup) {
				$location.url("/");
			}
		}

		if ($user.ready) {
			this.redirectIfNotAllowed($rootScope.cgroup.groupId);
		}
		else {
			$user.onReady(function () {
				redirectIfNotAllowed($rootScope.cgroup.groupId);
			})
		}

	});
