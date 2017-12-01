'use strict';

var app = createCommonApp('twake');

serviceMsgParsing(app);
serviceMsg(app);
serviceNotification(app);
serviceEmojiPicker(app);
chatCtrlGlobal(app);
serviceCalls(app);
contactsSearchCtrlGlobal(app);
serviceUpload(app);
serviceFilePopup(app);
serviceMobile(app);

app = app

	.config(function ($stateProvider, $windowProvider, $locationProvider, $urlRouterProvider) {

		var $window = $windowProvider.$get();

		if(!$window.standalone) {
			$locationProvider.html5Mode(true);
		}

			$urlRouterProvider
			.otherwise('/404');

	    $stateProvider
      .state('general', {
			    parent: 'global-structure',
	        templateUrl: '@pviews/general.html',
					controller: 'publicMainCtrl'
      })
      .state('404', {
					url: '/404',
	        templateUrl: '@pviews/all/404.html',
					parent: "general"
      })
      .state('disconnected', {
					url: '/disconnected',
	        templateUrl: '@pviews/all/disconnected.html',
					parent: "general",
					controller: function($user, $state){
						$user.onReady(function(){
							if($user.data.status=="connected"){
								$state.go("home");
							}
						});
					}
      })
			;
	})

	.run(function($rootScope, $state){
		$rootScope.$on('$stateChangeError', function(event) {
		  $state.go('404');
		});
	})

	.controller("publicMainCtrl", function($rootScope){

		$rootScope.cgroup.unload();

	})

	/* Run app */
	.run(function ($rootScope, $api, $user, $ngConfirm, $ngConfirmDefaults, $confirm,$notification,$ws,$window) {

		/* Link */
		$rootScope.confirm = $confirm;
		$rootScope.alert = $ngConfirm;

		/* Set confirm themes */
		$ngConfirmDefaults.theme = "white";
		$ngConfirmDefaults.animationSpeed = 200;
		$ngConfirmDefaults.animation = "opacity";
		$ngConfirmDefaults.closeAnimation = "opacity";

		//todo penser à la déconnexion

		/* Mobile improvement */
		FastClick.attach(document.body);

		/* Update user once */
		$user.update();

	});
