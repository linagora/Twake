angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('checkSecondMail', {
        url:'/account/verifymail/:token',
        templateUrl: '@pviews/register/checkSecondMail.html',
        parent: 'general'
    });
 })
.controller('checkSecondMailCtrl',function($api,$stateParams,$user){
    this.token = $stateParams.token;
    this.status = "";
    this.mail = "";
    this.detail = "";
    /* Possible detail :
        - notconnected
        - emailNotFound  (email/token inexistant)
        - mustconfirm  (this email is not set to any user right now, must confirm)
        - userAndMailMismatch
     */
    var that = this;
		$api.post("users/account/verifySecondMail", {"token": this.token}, function (res) {
        that.status = res.status;
        that.mail = res.data.email;
        that.detail = res.detail;
    });

    this.confirm = function() {

	    $api.post("users/account/verifySecondMail", {"token": this.token, "confirmed": 1}, function (res) {
            that.detail = res.detail;
            that.status = res.status;
            that.mail = res.data.email;
        });

    }

});
