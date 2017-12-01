angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('my-parameters-profile', {
        url: "/user-parameters/profile",
        templateUrl: '@gviews/my-parameters/profile.html',
        parent: "group-general"
    })
		;
})
.controller('myParametersProfileCtrl', function($api, $group){

});
