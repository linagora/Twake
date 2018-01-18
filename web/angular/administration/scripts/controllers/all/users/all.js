angular.module('TwakeAdministration')
.config(function($stateProvider){
  $stateProvider.state('user-all', {
	  templateUrl: '@views/admin/users/all.html',
      url: '/users/all',
      parent : 'general'
  });
})
.controller('UsersCtrl', function($api, $scope, $state){

		var that = this;

		this.list = [];
		this.pages = [1];
		this.total = 0;
		this.connectedUser = 0;

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

            $api.post("authentication/numberOfUserCurrentlyConnected", null, function (res) {
            	console.log(res);
            	that.connectedUser = res.data;
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
		this.getProfileView = function(userId){
            $state.go("user-sheet", {id: userId})
		}
		this.search = function () {
			// Declare variables
			var input, filter, table, tr, td, i, j;
			input = document.getElementById("search");
			filter = input.value.toUpperCase();
			table = document.getElementById("users_table");
			tr = table.getElementsByTagName("tr");

			// Loop through all table rows, and hide those who don't match the search query
			for (i = 1; i < table.rows.length; i++) {
				for(j = 0; j < table.rows[i].cells.length; j++)
				{
                    td = table.rows[i].cells[j];
                    if (td) {
                        if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                            tr[i].style.display = "";
                            break;
                        } else {
                            tr[i].style.display = "none";
                        }
                    }
				}
			}
		}
		this.update();

});
