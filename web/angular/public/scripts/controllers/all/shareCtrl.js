angular.module('twake')

.controller('shareCtrl', function($api, Upload, $scope,$rootScope, $user,$uibModal,$uibModalStack){
    this.status = $rootScope.status;
    this.name = "";
    var that = this;

    this.share = function(){
	    $api.post("status/create", {
		    groupId: 0,
		    content: this.name,
		    privacy: "P",
		    sharedStatusId: this.status.shareStatus.id
	    }, function (res) {
            that.status.loadFct();
            $uibModalStack.dismissAll();
        });
    }
});
