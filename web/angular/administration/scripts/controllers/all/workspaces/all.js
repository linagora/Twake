angular.module('TwakeAdministration')
.config(function($stateProvider){
  $stateProvider.state('workspace-all', {
	  templateUrl: '@views/admin/workspaces/all.html',
      url: '/workspaces/all',
      parent : 'general'
  });
})
.controller('WorkspacesCtrl', function($api, $scope, $state, $timeout){

		var that = this;

		this.list = [];
		this.pages = [1];
		this.total = 0;

		this.page = 1;
		this.perpage = 50;

		this.update = function(){
			$api.post("authentication/listTwakeGroups", {
				page: this.page,
				per_page: this.perpage,
				filter: document.getElementById("searchText").value
			}, function (res) {
                console.log(res);
				that.list = res.data.workspaces;
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
		this.getWorkspaceView = function(workspaceId){
            $state.go("workspace-sheet", {id: workspaceId})
		}
		this.update();

    var tempFilterText = '',
        filterTextTimeout;
    $scope.$watch('searchText', function (val) {
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);

        tempFilterText = val;
        filterTextTimeout = $timeout(function() {
            that.update();
        }, 500); // delay 500 ms
    })
});
