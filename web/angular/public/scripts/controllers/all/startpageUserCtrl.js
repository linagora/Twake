angular.module('twake')
	.controller('startpageUserCtrl', function ($api, $user, $state, $rootScope) {
		$rootScope.startpageUserCtrl = this;

		$user.onReady(function () {

			if ($user.data.groups.length == 0) {

				$state.go('inscriptionGroupe');

			} else {

				$state.go('group-home', {gid: window.localStorage.getItem("lastGroupId") || $user.data.groups[0].id});

			}

		});

		/*
		 this.hasNoFriend = false;
		 var that = this;
		$api.post("users/get", {username: $user.data.susername}, function (res) {
		 that.hasNoFriend = res.data.contacts.length == 0;
		 });

		 this.select = function (type) {
		 that.typeCreation = type;
		 $state.go('inscriptionGroupe');
		 }
		 */

	});
