angular.module('twake')
.controller('setChannelCtrl',function($api,$uibModal,$uibModalStack,$group,$rootScope, $msg){
    var that = this;
		this.channel = $msg.channels[$rootScope.cmsg.current.id];

    this.save = function(){
	    $api.post("discussion/channel/set", {
		    channelId: that.channel.id,
		    gid: $group.groupId,
		    name: that.channel.name,
		    privacy: that.channel.privacy
	    }, function (res) {
            $uibModalStack.dismissAll();
            $rootScope.channelsCtrl.load();
        })

    }
});
