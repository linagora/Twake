angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      //Account contacts
      .state('register-success', {
        url:'/register/success',
        templateUrl: '@pviews/register/success.html',
        parent: 'general'
      })
      .state('register-verify', {
        url:'/register/confirm/:token',
        templateUrl: '@pviews/register/verify.html',
        parent: 'general'
      });
})
.controller('registerCtrl', function($api){

})
.controller('registerVerifyCtrl', function($api,$window, $stateParams, $state, $user, $notification){

    this.nosuchtoken = false;
    this.tokenok = false;
    this.errors = {};
    this.data = {};

    var that = this;

    $api.post("/users/register/confirm/token",{token: $stateParams.token},function(res){
      if(res.oerrors['nosuchtoken']!=undefined){
        that.nosuchtoken = true;
      }else{
        that.tokenok = true;
        that.data.username = res.data.username;
        that.data.token = $stateParams.token;
      }
    });

    this.validate = function()
    {

      var that = this;
      var data = that.data;

      $api.post("/users/register/end/validate", data, function(res){

          that.errors = res.oerrors;
          if(res.errors.length==0){
            $window.location="/";
          }

      });

    }

});
