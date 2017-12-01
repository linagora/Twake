angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			.state('parameters-members', {
				url: "/parameters/members",
				templateUrl: '@gviews/parameters/members.html',
				parent: "group-general"
			})
		;
	})
	.controller('parametersMembersCtrl', function ($api, $user, $confirm, $ngConfirm, $group, $rootScope) {
		$rootScope.parametersMembersCtrl = this;

		this.members = [];
		this.pending_mail = [];
		this.pending_users = [];
		this.selectedMembers = {};
		this.totalItems = 0;
		this.currentPage = 1;
		this.pageSize = 5;
		this.afficheLevelSelection = false;
		this.levels = [];
		var that = this;

		this.loadUsers = function (page) {
			var that = this;
			$api.post('/group/members/table', {
				"limit": that.pageSize,
				"offset": (page - 1) * that.pageSize,
				"groupId": $group.groupId
			}, function (res) {
				if (res.errors.length != 0) {
					//Errors
					that.errors = res.oerrors;
				} else {
					that.totalItems = res.totalItems;
					that.members = res.data.members;
					that.pending_mail = res.data.pending_mail;
					that.pending_users = res.data.pending_users;
				}
			});
		};

		this.loadLevels = function () {
			var that = this;
			$api.post("group/rights/getlevels", {groupId: $group.groupId}, function (res) {
				if (res.errors.length != 0) {
					that.errors = res.oerrors;
				} else {
					that.levels = res.data;
				}
			});
		};


		this.verifyUser = function (request) {
			var that = this;
			$api.post('/group/members/verify', {"request": request}, function (res) {
				that.newuserverified = res.status;
				that.newuserverified_value = request;
				that.newuserverified_data = res.data;
			});
		}

		this.inviteUser = function () {
			var that = this;
			$api.post('/group/members/invite', {
				"groupId": $group.groupId,
				"request": that.newuserverified_value
			}, function (res) {
				if (res.errors.indexOf('notallowed') !== -1) {
					$ngConfirm("Vous n'avez pas les droits nécessaires pour inviter un utilisateur");
				}
				else if (res.errors.length !== 0) {
					$ngConfirm("Une erreur inconnue est survenue");
				}
				else {
					that.loadUsers(that.currentPage);
					that.newuserverified = undefined;
					that.newuserverified_value = undefined;
					that.newuserinput = "";
				}
			});
		}

		this.actionSelectChange = function () {
			if (this.actionSelect == "delete") {
				this.deleteUsers();
				this.actionSelect = "";
				this.selectedMembers = {};
				this.afficheLevelSelection = false;
			}
			if (this.actionSelect == "level") {
				this.afficheLevelSelection = true;
			}
		}
		this.actionSelectChangeLevel = function () {
			if (this.actionSelectLevel >= 0) {
				that.promoteUsers(that.actionSelectLevel);
				this.afficheLevelSelection = false;
				this.actionSelect = "";
				this.actionSelectLevel = "";
				this.selectedMembers = {};

			}
		}


		this.deleteUserByMail = function (mail) {
			var that = this;
			$api.post('/group/members/delete', {"groupId": $group.groupId, "mails": [mail]}, function (res) {

				if (res.errors.indexOf('notallowed') !== -1) {
					$ngConfirm("Vous n'avez pas les droits nécessaires pour supprimer un membre");
				}
				else if (res.errors.length !== 0) {
					$ngConfirm("Une erreur inconnue est survenue");
				}
				else {
					that.loadUsers(that.currentPage);
				}
			});
		};

		this.deleteUserById = function (uid) {
			var that = this;
			$api.post('/group/members/delete', {"groupId": $group.groupId, "uids": [uid]}, function (res) {

				if (res.errors.indexOf('notallowed') !== -1) {
					$ngConfirm("Vous n'avez pas les droits nécessaires pour supprimer un membre");
				}
				else if (res.errors.length !== 0) {
					$ngConfirm("Une erreur inconnue est survenue");
				}
				else {
					that.loadUsers(that.currentPage);
				}
			});
		};

		this.quit = function () {
			$api.post('/group/members/delete', {
				"groupId": $group.groupId,
				"uids": [$user.data.uid]
			}, function (res) {
				if (res.errors.length == 0) {
					document.location.href = "/";
				}
			});
		}

		this.deleteUsers = function () {
			var that = this;
			var selectedMembersList = [];
			angular.forEach(that.selectedMembers, function (bool, i) {
				if (bool) {
					selectedMembersList.push(i);
				}
			});
			if (selectedMembersList.length == 0) {
				return;
			}
			$confirm("Voulez vous supprimer les utilisateurs selectionnés ?", function () {
				$api.post('/group/members/delete', {
					"groupId": $group.groupId,
					"uids": selectedMembersList
				}, function (res) {
					if (res.errors.indexOf('notallowed') !== -1) {
						$ngConfirm("Vous n'avez pas les droits nécessaires pour supprimer un membre");
					}
					else if (res.errors.indexOf('lastowner') !== -1) {
						$ngConfirm("Vous essayez de supprimer le dernier administrateur du groupe");
					}
					else if (res.errors.length !== 0) {
						$ngConfirm("Une erreur inconnue est survenue");
					}
					else {
						that.loadUsers(that.currentPage);
					}
				});
			});
		}

		this.promoteUsers = function (level) {
			var that = this;
			var selectedMembersList = [];
			angular.forEach(that.selectedMembers, function (bool, i) {
				if (bool) {
					selectedMembersList.push(i);
				}
			});
			if (selectedMembersList.length == 0) {
				return;
			}
			$confirm("Voulez vous changer le niveau des utilisateurs selectionnés ?", function () {
				$api.post('group/members/changelevel', {
					"groupId": $group.groupId,
					"uids": selectedMembersList,
					"levelId": level
				}, function (res) {
					that.loadUsers(that.currentPage);
					if (res.errors.indexOf('lastOwner') != -1) {
						$ngConfirm("Vous souhaitez dégrader le dernier propriétaire");
					}
					else if (res.errors.length !== 0) {
						$ngConfirm("Vous n'avez pas les droits pour modifier les droits d'un utilisateur");
					}
				});
			});
		}

		this.loadUsers(1);
		this.loadLevels();
	});
