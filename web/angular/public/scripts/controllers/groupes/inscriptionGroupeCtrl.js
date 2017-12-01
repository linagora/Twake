angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			.state('inscriptionGroupe', {
				url: '/groups/create',
				templateUrl: '@pviews/groupes/creation.html',
				parent: 'general',
				controller: 'inscriptionGroupeCtrl'
			})
	})
	.controller('inscriptionGroupeCtrl', function ($scope, $rootScope, $api, $window) {

		this.type = "none"

		this.data = {
			"name": "",
			"type": "P",
			"privacy": "Q"
		};

		this.errors = {"emptyName": false};


		this.submit = function () {

			var that = this;
			$api.post("group/create", that.data, function (res) {
				if (res.errors.length === 0) {
					$window.location.href = "group/" + res.gid + "/parameters/members";
					that.errors = {"emptyName": false, "parentNotFound": false, "badPrivacy": false};
				}
				else {
					for (var i = 0; i < res.errors.length; i++) {
						that.errors[res.errors[i]] = true;
					}
				}
			});
		};


	});
