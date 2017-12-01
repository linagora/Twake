angular.module('TwakeAdministration')
.config(function($stateProvider){
  $stateProvider.state('user-all', {
	  templateUrl: '@views/admin/users/all.html',
      url: '/users/all',
      parent : 'general'
  });
})
.controller('UsersCtrl', function($api, $scope){

		var that = this;

		this.list = [];
		this.pages = [1];
		this.total = 0;

		this.page = 1;
		this.perpage = 50;

		this.update = function(){
			$api.post("authentication/listTwakeUsers", {
				page: this.page,
				per_page: this.perpage
			}, function (res) {
				that.list = res.data.users;
				that.total = res.data.total;

				that.pages = [];
				var totalPages = Math.ceil(that.total/that.perpage);
				for(var i=Math.max(1, that.page-4); i<=Math.min(totalPages, that.page+4); i++){
					that.pages.push(i);
				}

				$scope.$apply();
			});
		};

		this.setPage = function(page){
			this.page = page;
			this.update();
		}

		this.setNbPerPage = function(perpage){
			this.perpage = perpage;
			this.update();
		}

		this.update();

});
