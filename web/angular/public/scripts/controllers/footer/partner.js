angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('partner', {
        url:'/partner',
        templateUrl : '@pviews/footer/partner.html',
        parent: 'general',
      })
})
.controller('partnerCtrl',function(){
});
