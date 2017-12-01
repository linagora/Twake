angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('applicationProfil',{
        templateUrl :'@gviews/marketplace/application_profil.html',
            url:'/marketplace/:aid',
            controller:'applicationProfilCtrl',
            parent: 'group-general',
    })
})
.controller('applicationProfilCtrl', function($api, $group,$stateParams, $state){
    this.slides = [];
    var currIndex = 0;
    this.loading = false;
    this.id = $stateParams.aid;
    this.data = {};
    this.cssVote = "style='width:0%;'";
    this.hover = 0;
    this.userScore = 0;
    this.voteRegistered = false;
    this.hoverLock = false;
    this.showScreens = false;
    this.showDescription = true;
    var that = this;


    this.addSlide = function(screenShot) {
        that.slides.push({
          img: screenShot,
          id: currIndex++
        });
      };

    this.init = function(){
	    $api.post('market/app/get', {"id": this.id, "groupId": $group.groupId}, function (res) {
         if (res.errors.length == 0){
             that.data = res.data;
             that.cssVote = "width:"+(100*that.data.score)/5+"%;";
             that.hover = res.data.linkuser.score;
             that.userScore = that.hover;

             that.data.screenshots.forEach(function(element){
               that.showScreens = true;
               that.addSlide(element.screen);
             });
             if (that.data.description == ""){
               that.showDescription = false;
             }
            that.loading = true;
         } else {
         }
      });
    }
    this.init();


    this.scoreHover = function(value){
      if (!this.hoverLock){
        this.hover = value;
      }
    }

    this.resetScore = function(){
      that.hover = that.userScore;
    }

    this.vote = function(){
      this.voteRegistered = false;
      this.hoverLock = true;
      vote = this.hover;
	    $api.post('market/user/vote', {"appId": this.id, "groupId": $group.groupId, "vote": vote}, function (res) {
        if (res.errors.length ==0){
          that.voteRegistered = true;
          that.userScore = vote;
          that.hover = vote;
          that.data.linkuser.score = vote;
        } else {
        }
        setTimeout(function(){
          that.hoverLock=false;
        }, 2000);

      })
    }


    this.acquire = function(){
	    $api.post('market/group/acquire', {"groupId": $group.groupId, "appId": this.id}, function (res) {
        if (res.errors.length == 0){
          that.data.linkorga.acquired = true;
          $group.update();
        } else {
        }
      });
    }

    this.open = function(){
      if (!that.data.internal){
        $state.go('iframeapp', {id:that.id});
      } else {
        $state.go(that.data.url, {});
      }
    }

});
