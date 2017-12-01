angular.module('twake')
.controller('menuRightCtrl', function($api, $user, $rootScope, $msg, $group){
	this.config = {
		autoHideScrollbar: false,
		theme: 'light',
		advanced:{
			updateOnContentResize: true
		},
		setHeight: 200,
		scrollInertia: 0
	};


	var that = this;
	this.mode = 'group';	// "contacts", "channel" ou "group"
  this.contacts = [];
  this.groupMembers = [];
	this.channelsMembers;
	this.channelId;
	$rootScope.rightmenugroup = this;

    this.initContactDiscussion = function(contact) {
    	$msg.init("user", contact.id);
    };


	that.contacts = $msg.user_contacts;

	this.load = function(){
        $group.onMembersReady(function() {
            that.groupMembers = $group.members;
        });

		/*$api.post('group/members/table', {groupId: $rootScope.cgroup.groupId}, function(res) {
	        that.groupMembers = res.data.members;
		});*/
		if($msg.current.key){
			$api.post('discussion/channel/table', {channelId: $msg.current.key}, function (res) {
		  		that.channelsMembers = res.data;
		  	});
		}
	}

	this.addMembers = function(id){
		that.channelId = id;
        $rootScope.openModaladdMembers();
	}
	this.setChannel = function(id){
		that.channelId = id;
		$rootScope.openModalSetChannel();
	}
	this.load();

});
