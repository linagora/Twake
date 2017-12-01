angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('publicGroup', {
        url: "/home",
        templateUrl: '@gviews/public/general.html',
        parent: "group-general"
    })
		;
})
.controller('publicGroupCtrl', function($api, $group, $scope, Upload){
    var that = this;
    this.fctOnReady = undefined;

    this.load = function(){
        if(that.fctOnReady){
            that.fctOnReady($group.groupId,true);
        }
    }


});
