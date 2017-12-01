angular.module('twake')
.controller('searchHeaderCtrl',function($stateParams, $scope, $api,$user, $window,$rootScope,$state){
    var that = this;
    this.groups = [];
    this.result = [];
    this.groupsSearched = "";
    this.lastActivity = Date.now();
    $rootScope.searchHeaderCtrl = this;

    this.updateGroups = function(typed){
        if(typed != ""){
            var x = Date.now()-that.lastActivity;
            if(Date.now()-that.lastActivity>=1000){
                $api.post("/group/fastsearch",{firstCharacters:typed},function(res){
                    that.result = [];
                    that.groups = res.data.groups;
                    res.data.groups.forEach(function(g){
                        that.result.push(g.name);
                    });
                    that.lastActivity = Date.now();
                });
            }
        }
    }

    this.selectGroup = function(select){
        for(var i=0;i<that.groups.length;i++){
            if(select == that.groups[i].name){
                $state.go("searchGroup",{groupId:that.groups[i].id})
            }
        }
    }

    jQuery("#searchGroup").keypress(function(e) {
        if(e.which == 13 && that.groupsSearched!="") {
            that.search();
        }
    });

    this.search = function (){
        $state.go("searchGroup");
        $rootScope.searchGroupCtrl.load(that.groupsSearched);
    }

    this.updateGroups();
});
