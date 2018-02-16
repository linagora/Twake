angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('error', {
			templateUrl: '@views/admin/error/error.html',
			url: '/error',
			parent : 'general'
		});
	})
    .controller('ErrorCtrl', function($api, $scope, $state){
        var that = this;

        this.update = function(){
            $api.post("authentication/getAllErrors", null, function (res) {
                //console.log(res.data);
                that.errors = res.data;
                $scope.$apply();
            });
        }
        this.update();
    });
