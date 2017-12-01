angular.module('twake')
.controller('ChatUserMenuCtrl', function($api, $user,$stateParams, $rootScope, $scope){

  var that = this;
  this.data = {};

  $scope.$parent.chatusermenu = this;
		$rootScope.cgroup.unload();

});
