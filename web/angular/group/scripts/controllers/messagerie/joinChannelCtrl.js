angular.module('twake')
.controller('joinChannelCtrl',function($api,$uibModal,$uibModalStack,$group,$rootScope, $msg){

    this.join = function(){
	    $api.post("discussion/channel/join", {
		    channelIds: Object.keys(that.selected),
		    gid: $group.groupId
	    }, function (res) {
            $uibModalStack.dismissAll();
            $rootScope.channelsCtrl.load();
            that.channels = $rootScope.channelsCtrl.channelsRest;
        })
    }

    this.load = function(){
        that.channels = $rootScope.channelsCtrl.channelsRest;
    }
    this.isEmpty = function(obj){
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    };




    var that = this;
    this.selected=[];
    this.load();
    this.empty = this.isEmpty(this.channels);

});
