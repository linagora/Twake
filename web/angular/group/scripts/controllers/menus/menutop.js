angular.module('twake')
.controller('menuTopCtrl', function($api,$rootScope, $user, $group, $window){

  this.toggleDark = function(){
    $rootScope.light = !$rootScope.light;
    $window.localStorage.setItem("grouplight",$rootScope.light)
  }
  this.initDark = function(){
    if($window.localStorage.getItem("grouplight")==undefined){
      $rootScope.light = true;
      $window.localStorage.setItem("grouplight",true)
    }else{
      $rootScope.light = ($window.localStorage.getItem("grouplight")=="false")?false:true;
    }
  }
  this.role = "Unknown";
});
