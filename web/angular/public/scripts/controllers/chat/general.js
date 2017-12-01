angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('chat-public-parent', {
		    parent: 'global-structure',
		    templateUrl: '@pviews/chat/general.html',
		    controller: 'ChatUserMenuCtrl'
    })
    .state('chat', {
        url:'/messages',
        templateUrl: '@pviews/chat/chatindex.html',
        parent: 'chat-public-parent',
        controller: function($state, $msg, $api,$scope) {
          if($msg.user_contacts.length>0){
            var contactAuto = $msg.user_contacts[0].username;
            $state.go("chat_user", {username:contactAuto});
          }
        }
    })
    .state('chat_user', {
        url:'/messages/:username',
		    templateUrl: '@views/user_chat.html',
        parent: 'chat-public-parent'
    })
});
