angular.module('twake')
  .controller('creationFileCtrl',function($api,$uibModal,$uibModalStack,$msg,$group,$rootScope){
      this.nameFile = "";
      this.nameDir = "";
      this.error = "";
      var that = this;



      this.createFile = function(){
	      $api.post("drive/create", {
		      parentId: $rootScope.finder.currentDirectory,
		      name: that.nameFile,
		      groupId: $group.groupId,
		      isDirectory: false
	      }, function (res) {
              if(res.errors.length >0){
                  if(res.errors.indexOf("fileexists")>=0){
                      that.error = "un fichier de même nom existe déjà";
                  }
                  else if(res.errors.indexOf("emptyname")>=0){
                      that.error = "Le nom du fichier est vide";
                  }
                  else if(res.errors.indexOf("nomorespace")>=0){
                      that.error = "Vous ne possedez plus assez d'espace";
                  }
              }
              else{
                  that.error="";
                  $uibModalStack.dismissAll();
                  $rootScope.finder.getElements($rootScope.finder.currentDirectory);
              }
          });
      }
      this.createDirectory = function(){
	      $api.post("drive/create", {
		      parentId: $rootScope.finder.currentDirectory,
		      name: that.nameDirectory,
		      groupId: $group.groupId,
		      isDirectory: true
	      }, function (res) {
              if(res.errors.length >0){
                  if(res.errors.indexOf("fileexists")>=0){
                      that.error = "un fichier de même nom existe déjà";
                  }
                  else if(res.errors.indexOf("emptyname")>=0){
                      that.error = "Le nom du fichier est vide";
                  }
                  else if(res.errors.indexOf("nomorespace")>=0){
                      that.error = "Vous ne possedez plus assez d'espace";
                  }
              }
              else{
                  that.error = "";
                  $uibModalStack.dismissAll();
                  $rootScope.finder.getElements($rootScope.finder.currentDirectory);
              }
          });
      }

  });
