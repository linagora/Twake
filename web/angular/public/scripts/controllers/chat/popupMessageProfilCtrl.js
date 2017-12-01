angular.module('twake')
.controller('popupMessageProfilCtrl', function($api, $user,$state, $rootScope){
    this.include = '';
    this.user = {};
    this.name = "";
    this.display  = "none";
    var that = this;



    this.clickOn = function(){
	    that.include = '@views/popupProfil.html';
        that.display = "block";
        console.log("click on"+that.name);
        that.load();
    }

    this.close = function(){
        console.log("close");
        that.display = "none";
    }

    this.load = function(){
	    $api.post("users/get", {username: that.name}, function (res) {
            that.user = res.data;
            console.log(that.user);
        });
    }

});
