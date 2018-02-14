angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('cpu', {
			templateUrl: '@views/admin/cpu/cpu.html',
			url: '/cpu',
			parent : 'general'
		});
	})
    .controller('CpuCtrl', function($api, $scope, $state){
        var that = this;
        this.update = function(){
            console.log("test");
            $api.post("authentication/getCpuUsage", null, function (res) {
                console.log(res.data);
                $scope.$apply();
            });
        };
        this.update();
    });
