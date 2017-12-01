angular.module('twake')
.controller('menuleftCtrl', function($api, $user,$state, $rootScope){

  var that=this;

  $rootScope.menuLeft = this;

  this.isAccount = false;

  $rootScope.$on('$stateChangeStart', function(e, to, toParam, from, fromParam){
    if(to.parent=='account-menu-left'){
      that.isAccount = true;
    }else{
      that.isAccount = false;
    }
  });

});
