angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('searchGroup', {
        url:'/groups/search',
        templateUrl: '@pviews/groupes/search.html',
        parent: 'general',
        controller: 'searchGroupCtrl'
      })
})
.controller('searchGroupCtrl',function($scope, $api, $window,$rootScope){

        var that = this;
        this.listGroup = [];
        $rootScope.searchGroupCtrl = this;

        this.load = function(typed){
            console.log(typed);
            $api.post("/group/fastsearch",{firstCharacters:typed},function(res){
                    that.listGroup = [];
                    that.listGroup = res.data.groups;
            });
        }


});
