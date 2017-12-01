angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('parameters-payment', {
        url: "/parameters/repartition",
        templateUrl: '@gviews/parameters/payment.html',
        parent: "group-general"
    })
		;
})
.controller('parametersPaymentCtrl', function($api, $group){
    this.wantTopay = false;
    this.nbMonth = 1;

});
