angular.module('twake')
.config(function($stateProvider){
    $stateProvider
    .state('notificationUser',{
        url:'/account/notification',
        templateUrl:'@pviews/user/account/notification.html',
        parent:'general'
    });
})
.controller('notificationCtrl',function($api,$user,$notification){
    var that = this;

    this.loading = true;
    this.hasmore = false;
    this.offset = 0;

    this.load = function(){
      $notification.loadOld(function(res){
        that.loading = false;
        that.offset += res.length;
        if(res.length<30){
          that.hasmore = false;
        }else{
          that.hasmore = true;
        }
      }, 30, this.offset);
    };

    this.load();

});
