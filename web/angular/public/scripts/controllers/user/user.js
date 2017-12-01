angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      //Account contacts
      .state('user', {
        url:'/user/:username',
        templateUrl: '@pviews/user/user.html',
        parent: 'general'
      });
})
.controller('userCtrl', function($api,$state,$stateParams,$user,$rootScope){
    this.user = {};
    this.btnController = {};
    this.formatedBirthday = "";
    this.ready = false;
    this.onReady = undefined;
		this.page = 4;
    this.publicGroups = [];
    this.followGroup = [];
    this.contactsList = [];

    var that = this;
    $api.post("/users/get",{"username":$stateParams.username},
        function(res){
            if(res.errors.length===0){
                that.user = res.data;
                that.btnController.init(that.user.idUser);
                that.btnController.load();
                if ($user.data.uid === that.user.idUser) {
                    that.user.isme = true;
                    $rootScope.menuLeft.isAccount = true;

                    if (that.user.birthday !== undefined) {
                        date = new Date(that.user.birthday);

                        that.formatedBirthday = moment(date).locale("fr").format('ll');
                    }
                    else {
                        that.formatedBirthday = "";
                    }
                }
                else {
                    that.user.isme = false;
                    $rootScope.menuLeft.isAccount = false;
                }
                if(that.onReady){
                    that.onReady(that.user.idUser,false);
                }

                that.contactsList = res.data.contacts;
                console.log(res.data);
            }
            else{
                $state.go('404');
            }
        }
    );

		$api.post("group/user/alllist", {}, function (res) {
        if(res.errors.length==0){
            console.log(res.data);
          that.publicGroups = res.data;
        }
    });
		$api.post("users/subscription/get", {userId: that.user.uid}, function (res) {
        if(res.errors.length==0){
          that.followGroup = res.data;
        }
    });







});
