angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('dashboard', {
			templateUrl: '@views/admin/dashboard/all.html',
			url: '/dashboard/all',
			parent : 'general'
		});
	});
