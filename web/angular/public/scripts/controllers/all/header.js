angular.module('twake')
	.controller('mainHeaderCtrl', function ($api, $user, $state, $window, $rootScope) {

		var header_wait = 0;
		$rootScope.header = this;

		this.light = localStorage.getItem("lightMode") != "false"; //true if undefined
		this.toggleDark = function () {
			this.light = !this.light;
			localStorage.setItem("lightMode", this.light);
		}

		this.login = function () {
			if (header_wait == 1) {
				return;
			}

			header_wait = 1;
			data = {};
			data._username = jQuery("#header_pseudo").val();
			data._password = jQuery("#header_password").val();
			data._remember_me = jQuery("#header_remember").is(':checked');

			jQuery("#header_connect_error").css({"display": "none"});

			$api.post("/users/login", data, function (result) {
				header_wait = 0;
				if (result.status == "success") {
					$window.location.reload();
				} else {
					jQuery("#header_connect_error").css({"display": "inline-block"});
				}
			});
		}


		this.signup = function () {

			var that = this;

			if (header_wait == 1) {
				return;
			}

			header_wait = 1;

			data = {};
			data._username = jQuery("#header_signup_pseudo").val();
			data._mail = jQuery("#header_signup_mail").val();

			jQuery(".header_signup_error").css({"display": "none"});

			$api.post("/users/register/check", data, function (result) {
				header_wait = 0;
				if (result.status == "success") {
					that.popup = "";
					$state.go("register-success");
				} else {
					jQuery.each(result.errors, function (i, e) {
						jQuery("#header_signup_error_" + e).css({"display": "inline-block"});
					});
				}
			});

		}

		this.exit = function (from) {
			if (this.popup == from) {
				this.popup = "";
			}
		}

		this.go = function (to) {
			var that = this;
			setTimeout(function () {
				that.popup = to;
				$rootScope.$apply();
			}, 50);
		}

		this.logout = function () {
			$user.logout();
		};

	});
