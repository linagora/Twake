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
		this.noWorkspace = false;
		var that = this;
		this.init = function () {

			$api.post("group/user/alllist", {}, function (res) {
				if (res.errors.length == 0) {
					pendinginit = [];
					groupsinit = [];
					that.noWorkspace = true;

					res.data.forEach(function (group) {
						if (group.status == "P") {
							pendinginit.push(group.workspace);
							that.pendingCount++;
						} else {
							groupsinit.push(group.workspace);
							that.noWorkspace = false;
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
					that.noWorkspace = false;
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
