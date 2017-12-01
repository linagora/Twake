angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			.state('groupsUser', {
				url: 'account/groups',
				templateUrl: '@pviews/user/groups.html',
				parent: 'general'
			});
	})
	.controller('groupsUserCtrl', function ($api, $user, $rootScope) {
		$rootScope.groupUserCtrl = this;
		this.groups = {};
		this.pending = {};
		this.loading = true;
		this.pendingCount = 0;
		this.noOrga = false;
		var that = this;
		this.init = function () {

			$api.post("group/user/alllist", {}, function (res) {
				if (res.errors.length == 0) {
					pendinginit = [];
					groupsinit = [];
					that.noOrga = true;

					res.data.forEach(function (group) {
						if (group.status == "P") {
							pendinginit.push(group.orga);
							that.pendingCount++;
						} else {
							groupsinit.push(group.orga);
							that.noOrga = false;
						}
					});
					that.groups = groupsinit;
					that.pending = pendinginit;

					that.groups.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					});
					that.pending.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					});
				}
				;
				if ($rootScope.$root.$$phase !== '$apply' && $rootScope.$root.$$phase !== '$digest') {
					$rootScope.$apply();
				}
				that.loading = false;
			});
		}


		this.accept = function (id) {
			$api.post("group/members/invite/accept", {"groupId": id}, function (res) {
				if (res.errors.length == 0) {
					that.groups[id] = that.pending[id];
					that.noOrga = false;
					that.pendingCount--;
					delete(that.pending[id]);
				}
			});
		}

		this.refuse = function (id) {
			$api.post("group/members/invite/refuse", {"groupId": id}, function (res) {
				if (res.errors.length == 0) {
					that.pendingCount--;
					delete(that.pending[id]);
				}
			});
		}

		this.init();
	}
);
