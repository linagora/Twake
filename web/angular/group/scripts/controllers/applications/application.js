angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			.state('application', {
				url: "/application/:name/:data",
				controller: 'ApplicationGeneralCtrl',
				parent: "group-general"
			})
			.state('app', {
				url: "/app/:name/:data",
				controller: 'IframeAppCtrl',
				parent: "group-general",
				templateUrl: '@gviews/applications/iframe.html'
			})
	})
	.controller('ApplicationGeneralCtrl', function ($state, $stateParams) {

		var additionalData = {};
		if ($stateParams.data) {
			additionalData = JSON.parse(base64_decode($stateParams.data));
		}

		if (!additionalData.internal) {

			var data = "";
			console.log(additionalData.open);
			if (additionalData.open) {
				data = $stateParams.data;
			}

			$state.go('app', {name: $stateParams.name, data: data});
		} else {
			$state.go(additionalData.url, {});
		}

	})
	.controller('IframeAppCtrl', function ($http, $api, $state, $stateParams, $scope, $group, $user, ApplicationBridge) {

		this.additionalData = {};
		if ($stateParams.data) {
			this.additionalData = JSON.parse(base64_decode($stateParams.data));
		}

		$scope.IFrameApp = this;
		var that = this;
		this.applicationName = $stateParams.name;
		this.application = {};

		this.getApplication = function (applicationName) {

			var application = null;

			$group.data.apps.forEach(function (e) {
				if (e.name === applicationName) {
					application = e;
				}
			});

			return application;
		};

		var initIframe = function (iframe) {
			var iframeWindow = jQuery(iframe)[0].contentWindow;
			window.onmessage = function (msg) {
				var data = JSON.parse(msg.data);
				var token = data.token;
				var route = data.route;
				var options = data.options;

				ApplicationBridge.call(that, route, options, function (data) {
					data.token = token;
					var compiled = JSON.stringify(data);
					iframeWindow.postMessage(compiled, "*");

				});
			};
		};

		$group.onReady(function () {

			that.application = that.getApplication(that.applicationName);

			$api.post("market/user/gettoken", {groupId: $group.groupId, appId: that.application.id}, function (res) {

				if (res.errors.length === 0) {
					var token = res.data.token;

					var loginUrl = that.application.url;
					if (loginUrl.indexOf("?") !== -1) {
						loginUrl += "&token=" + token;
					} else {
						loginUrl += "?token=" + token;
					}

					loginUrl += "&groupId=" + $group.groupId;

					jQuery(".iframe-app").attr("src", loginUrl);
					initIframe(".iframe-app");
				}
			});
		});

	})
	.controller('applicationActionCtrl', function ($filePopup) {

		$filePopup.onUpdate(function () {
			console.log($filePopup.result);
		});
	});
