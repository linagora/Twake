angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('admins', {
			templateUrl: '@views/admin/admins/all.html',
			url: '/admins/all',
			parent : 'general'
		});
	})

	.controller("AdminsCtrl",function($api, $scope){

		var that = this;

		this.available_roles = ["AdminManager"];

		this.list = [];

		this.update = function() {
			$api.post("authentication/listUserAdmin", {}, function (res) {
				that.list = res.data;
				$scope.$apply();
			});
		};

		this.remove = function(id){
			$api.post("authentication/removeUser",{id: id},function(){
				that.update();
			});
		};

		this.add = function(id){
			$api.post("authentication/addUser",{id: id},function(){
				that.update();
			});
		};

		this.updateRoles = function(admin, op, role){
			var id = admin.id;
			var roles = admin.roles;

			//Remove role (duplicate or simple remove)
			var index = roles.indexOf(role);
			if (index > -1) {
				roles.splice(index, 1);
			}

			//Add role
			if(op == "add"){
				roles.push(role);
			}

			$api.post("authentication/updateUser",{id: id, role: roles},function(res){
				that.update();
			});

		};



		this.update();

	})
;
