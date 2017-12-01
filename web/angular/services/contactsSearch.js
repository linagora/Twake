function contactsSearchCtrlGlobal(app){
  return app.controller('contactsSearchCtrl', function($rootScope, $msg, $api, $window, $stateParams, $scope, $user, $group){

      var that = this;
      this.searchValue = "";
      this.contacts = [];
      this.timer = null;
      this.working = false;

      this.search = function(searchValue) {
          if(!searchValue){
            searchValue = that.searchValue;
          }
          this.working = true;
	      $api.post("group/members/search", {
		      limit: 10,
		      offset: 0,
		      search: searchValue,
		      groupId: $group.groupId < 1 ? 0 : $group.groupId
	      }, function (res) {
              that.contacts = res.data;
              that.working = false;
              console.log(res.data)
          });
      };

      this.delayedSearch = function() {

          if (that.timer !== null) {
              clearTimeout(that.timer);
          }
          var searchValue = that.searchValue;
          that.timer = setTimeout(function() {
            if(that.working){
              that.delayedSearch(searchValue);
            }else{
              that.search(searchValue);
            }
          }, 200);
      };
  })
}
