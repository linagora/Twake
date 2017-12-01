angular.module('twake')
.controller('addMembersCtrl',function($api,$uibModal,$uibModalStack,$group,$rootScope,$msg,$user){
    this.members = [];
    this.selectedMembers = {};
		this.channelId = $msg.current.id;
		var that = this;
    this.loadUsers = function(page){
        $group.onMembersReady(function() {
            that.groupMembers = $group.members;
            for(var i=0; i<$group.members.length; i++){
	            for (var j = 0; j < $msg.channels[that.channelId].members.length; j++) {
		            if ($msg.channels[that.channelId].members[j].id == $group.members[i].id) {
			            that.selectedMembers[$group.members[i].id] = true;
                        break;
		            }
                }
                that.members.push($group.members[i]);
            }
        });

    };

    this.invite = function(id){
        var selectedMembersList = [];
        if(!id){
	        $api.post('discussion/channel/invite', {
		        channelId: that.channelId,
		        gid: $group.groupId,
		        uids: that.selectedMembers
	        }, function () {
		        $rootScope.channelsCtrl.load();
                $uibModalStack.dismissAll();
                that.selectedMembers = {};
            });
        }
    };

    this.loadUsers();
});
