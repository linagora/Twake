angular.module('twake')
.controller('creationChannelCtrl',function($api,$uibModal,$uibModalStack,$group,$rootScope,$msg){
    this.name="";
    this.menuLeftCtrl = {};
    this.privacy = false;
    var that = this;

    this.create = function(){
	    $api.post("discussion/channel/create", {
		    name: that.name,
		    groupId: $group.groupId,
		    privacy: that.privacy
	    }, function (res) {
		    $uibModalStack.dismissAll();
		    $rootScope.channelsCtrl.load();
        })

    }

		that.cancel = function () {
			$uibModalStack.dismissAll();
		}
});
