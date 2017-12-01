angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('members', {
        url: "/members",
        templateUrl: '@gviews/members/members.html',
        parent: "group-general"
    })
		;
})
.controller('membersCtrl', function($api, $group){
		var that = this;
		this.members = {};
		this.nomembers = 0;
		this.errors = {};
  this.getMembers = function(){
    var that = this;
    $api.post('/group/members/table',{"limit":0, "offset":0, "groupId":$group.groupId}, function(res){
      if (res.errors.length != 0){
        //Errors
        that.errors = res.oerrors;
      } else {
        that.members = res.data.members;
        that.noMembers = Object.keys(that.members).length;
      }
    });
  };

  this.getMembers()
});
