angular.module('twake')
    .config(function ($stateProvider, $locationProvider, $urlRouterProvider) {

        $stateProvider.state('home', {
            url: '/',
            templateUrl: '@pviews/home/home.html',
            parent: 'general'
        });

	})

    .controller('homeCtrl', function($api, $user,$state) {

        this.test = "test";
    });