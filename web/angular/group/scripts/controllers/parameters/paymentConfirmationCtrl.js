angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('paymentConfirmation', {
        url: "/parameters/paymentConfirmation",
        templateUrl: '@gviews/parameters/paymentConfirmation.html',
        parent: "group-general"
    })
		;
})
.controller('paymentConfirmationCtrl',function($scope,$rootScope, $api, $window){

});
