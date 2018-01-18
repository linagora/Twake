angular.module("TwakeAdministration")
	.config(function ($stateProvider) {
		$stateProvider
			.state("loginpage", {
				url: "/login",
				templateUrl: "@views/login.html"
			});
	})
	.controller("LoginCtrl", function ($api, $rootScope) {

		this.email = "";
		this.password = "";

		this.login = function () {

			$.post($api.getRealRoute("authentication/authenticate"),
				{username: this.email, password: this.password},
				function (res) {
                    if (res.data.token) {
						$rootScope.api.setToken(res.data.token);
                        console.log("####"+res.data.token);
						window.location.href = "/administration/";
					}
				});

		}

		this.logout = function () {
			$rootScope.api.setToken("");
			window.location.href = "/administration/";
		}

	});