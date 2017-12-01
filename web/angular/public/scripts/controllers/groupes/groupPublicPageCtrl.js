angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('groupPublicPage', {
        url:'/groups/{groupId:[0-9]+}',
        templateUrl: '@pviews/groupes/public.html',
        parent: 'account-menu-left',
        controller: 'groupPublicPageCtrl'
      })
})
.controller('groupPublicPageCtrl',function($stateParams, $scope, $api,$user, $window,$rootScope){

    var that = this;
    this.groupId = $stateParams.groupId;
    this.group = {};
    this.fctOnReady = undefined;
    this.canSub = true;
    this.isSub = false;
    this.page = 1;

    this.load = function(){
	    $api.post("group/get", {groupId: that.groupId}, function (res) {
            that.group = res.data;
            console.log(that.group);
            if(that.fctOnReady){
                console.log(that.groupId+","+true)
                that.fctOnReady(that.groupId,true);
            }
		    angular.forEach($user.data.groups, function (e) {
                console.log("test : "+e.id);
                if(e.id==that.groupId){
                    that.canSub = false;
                    console.log("sub ! "+that.canSub);
                }
            });
		    $api.post("users/subscription/get", {userId: $user.data.uid}, function (res) {
                res.data.forEach(function(e){
                    if(e.id==that.groupId){
                        that.isSub=true;
                    }
                })
            });
        });
    }

    this.follow = function(){
	    $api.post("users/current/subscription/set", {groupId: that.group.id}, function (res) {
            that.isSub=!that.isSub;
        });
    }

    this.load();

});
