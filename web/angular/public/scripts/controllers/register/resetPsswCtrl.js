angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
        .state('resetPassord', {
            url: '/resetting/request/:token',
            templateUrl: '@pviews/templates/resetPass.html',
            parent: 'general'
        });
})
.controller('resetPsswCtrl', function($api,$stateParams) {
    this.token = $stateParams.token;
    this.success = 0;
    this.pass1 = "";
    this.pass2 = "";
    this.passDiff = false;
    var that = this;
		$api.post('users/resetPassw', {action: "verifyToken", token: this.token}, function (res) {
        if(res.success){
            that.success = 1;
        }
        else{
            that.success = 2;
        }
    });

    this.reset = function(){
        if(that.pass1 != that.pass2){
            that.passDiff = true;
        }
        else{
	        $api.post('users/resetPassw', {action: "pass", token: that.token, pass: that.pass1}, function (res) {
                that.passDiff = false;
                if(res.success==true){
                    that.success = 3;
                }

            });
        }
    };
});
