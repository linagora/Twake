angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('messages', {
        url:'/messages/:type/:id',
        templateUrl: '@gviews/messages/general.html',
        parent: 'group-general',
        controller: 'messagesCtrl'
      })
      .state('messages-auto', {
        url:'/messages/',
        template: '',
        parent: 'group-general',
        controller: 'messagesAutoCtrl'
      })
  })
  .controller('messagesAutoCtrl',function($rootScope, $msg, $state, $api, $group){

		$api.post("/ajax/discussion/channels/get", {all: false, gid: $group.groupId}, function (res) {
			console.log(res);
			if (!res.data.channels) {
				return;
			}

			if (Object.keys(res.data.channels).length > 0) {
				var id = res.data.channels[Object.keys(res.data.channels)[0]].id;
				$state.go('messages', {id: id, type: 'channel'});
			}

		});

  })
  .controller('messagesCtrl',function($stateParams,$msg,$group,$notification){

      var that = this;

      $msg.currentType = "";
      $msg.channelId = 0;
      $group.onReady(function(){
        angular.forEach($group.data.apps, function(el){
          if(el.name=="Messages"){
            $group.msgId = el.id;
          }
        });
      })

      this.channelId = 0;


      if(!$stateParams.type || !$stateParams.id){
        this.type = "channel";
        this.id = 0;
      }else{
        this.type = $stateParams.type;
        this.id = $stateParams.id;
        $msg.init($stateParams.type, $stateParams.id);
        if($stateParams.type=="channel"){
          $msg.current.key = this.id;
          this.channelId = this.id;
        }
      }


  });
