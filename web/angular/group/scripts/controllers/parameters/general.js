angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('parameters-general', {
        url: "/parameters/general",
        templateUrl: '@gviews/parameters/general.html',
        parent: "group-general"
    })
		;
})
.controller('parametersGeneralCtrl', function($api, $group, $scope,$state , Upload,$confirm,$user){

  var that=this;

  this.groupname = $group.data.name;
  this.data = {};
  this.errors = {};
  this.saveerrors = {};
  this.type = "";  //MUST CONTAIN THE COMPLETE TYPE NAME
  this.changesOK = false;
  this.changeError = false;
  this.saving=false;
  this.deleteName = "";

  this.replaceType = function(){
    switch(this.data.type){
      case "P":
        this.type = "Project";
        break;
      case "C":
        this.type = "Club";
        break;
      case "A":
        this.type = "Association";
        break;
      case "E":
        this.type = "Company";
        break;
      case "I":
        this.type = "Institution";
        break;
      case "O":
        this.type = "Other";
        break;
    }
  }

  this.getall = function(){
    var that = this;
    $api.post("/group/getmore", {"groupId":$group.groupId}, function(res){
      if (res.errors.length != 0){
        //errors
        that.errors = res.oerrors;
      } else {
        that.data = res.data;
        if(res.data.abonnement){
            that.data.abonnement = new Date(res.data.abonnement.date);
            that.data.abonnement = that.data.abonnement.getDate()+"/"+that.data.abonnement.getMonth()+"/"+that.data.abonnement.getFullYear();
        }
        that.replaceType();
        that.initUpload();
      }
    });
  };

  this.saveChanges = function(){
    var that = this;
    this.saving = true;
    $api.post("/group/setmore", {"groupId":$group.groupId, "name":this.groupname, "data":this.data}, function(res){
      that.saving = false;
      if (res.errors.length != 0){
        //errors
        that.saveerrors = res.oerrors;
        that.changeError = true;
        that.changesOK = false;
        // TODO : Si on a une erreur groupnotfound, alors il y a surement un cas qu'il faudra gérer plus tard (suppression du groupe).
      } else {
        //OK
        $group.update();
        that.changeError = false;
        that.changesOK = true;
      }
    })
  }

  //Auto upload logo
  this.initUpload = function(){
    this.logo_errors = {};

    $scope.$watch(function(){return that.data.logo}, function (image) {
      if(typeof image == "object"){
        that.uploadlogo();
      }
    });

  }

  this.deleteGroup = function(){
    if(that.deleteName == that.data.name){
        console.log("---"+that.data.id);
        $confirm("Voulez vous supprimer le groupe ?", function(){
            $api.post("/group/delete",{"gid":that.data.id},function(res){
              if(res.errors.length === 0){
                $user.update();
                  $state.go("home");
              }
            });
        });
    }
  }

  this.uploadlogo = function () {
    Upload.upload({
        url: 'ajax/group/setlogo',
        data: {file: this.data.logo, "groupId":$group.groupId}
    }).then(function (resp) {
        if(resp.data.errors.length==0){
          $group.update();
          that.logo_errors = {};
        }else{
          that.logo_errors = {"error":true};
          that.logo=undefined;
        }
    }, function (resp) {
        that.logo=undefined;
        that.logo_errors = {"error":true};
    }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
    });
  };

  this.getall();
});
