angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			//Account (identity - profile)
			.state('legals', {
				url: '/legals',
				templateUrl: '@pviews/legals/CGU.html',
				parent: 'general'
			})
			.state('privacy', {
				url: '/privacy',
				templateUrl: '@pviews/legals/confidentialite.html',
				parent: 'general'
			});
	})
	.controller("cguCtrl", function () {
		this.siteName = "twakeapp.com";
		this.societeName = "Twake";
		this.societeType = "SAS";
		this.capital = 2000;
		this.siegeSocial = "193 Avenue Paul Muller, 54602 Villers-lès-Nancy";
		this.contact = "contact@twakeapp.com";
		this.cnilNumber = "--CNIL--";
		this.city = "Nancy";
	});