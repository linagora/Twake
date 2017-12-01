angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
        .state('connection-probleme', {
            url: '/resetting/request',
            templateUrl: '@pviews/templates/connection_problem.html',
            parent: 'general'
        });
})
.controller('connectionPbCtrl', function($api) {
    this.mail = "";
    this.success = false;
    var that = this;
    this.resetMail = function(){
	    $api.post("users/resetPassw", {action: "createToken", mail: that.mail}, function (res) {
            that.success = true;
        });
    }
})
;
