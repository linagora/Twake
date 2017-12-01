angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('marketplace',{
        templateUrl :'@gviews/marketplace/general.html',
            url:'/marketplace',
            controller:'marketplaceGeneralCtrl',
            parent: 'group-general',
    })
})
.controller('marketplaceGeneralCtrl', function($api, $group){
    this.propositionApps  = [];
    this.currentcategory = "";
    this.searchedApps = [];
    this.promotedApps = [];
    this.myInterval = 5000;
    this.noWrapSlides = false;
    this.active = 0;
    this.categorys = [];
    this.loading = true;
    this.searchOption = "score";
    var currIndex = 0;
    this.slides = [];
    this.searchInput = "";
    var that = this;

    this.addSlide = function(application) {
        that.slides.push({
          app: application,
          id: currIndex++
        });
      };
      this.randomBlue = function() {
         var letters = '0123456789ABCDEF';
         var color = '#';
         color += letters[Math.floor(Math.random() * 3)+4];
         color += letters[Math.floor(Math.random() * 16)];
         color += letters[Math.floor(Math.random() * 8)+8];
         color += letters[Math.floor(Math.random() * 16)];
         color += letters[Math.floor(Math.random() * 7)+9];
         color += letters[Math.floor(Math.random() * 16)];
         return color;
     }

     this.loadAllApps = function(){
       this.inCategory = false;
       this.loading = true;
	     $api.post("market/app/getapps", {limit: 20}, function (res) {
           that.searchedApps = res.data;
           that.propositionApps = res.data;
           that.loading = false;
       });
     }

    this.load = function(){
        this.loadAllApps();
	    $api.post("market/app/getapps", {promoted: true}, function (res) {
            that.promotedApps = res.data;
            for(i=0;i<res.data.length;i++){
                that.addSlide(res.data[i]);
            }
            console.log(that.promotedApps);
        });
	    $api.post("market/category/get", {}, function (res) {
            for(var i=0;i<res.data.length;i++){
                res.data[i]["color"] = that.randomBlue();
                that.categorys.push(res.data[i]);
            }
        })
    }

    this.search = function(){
        this.loading = true;
	    $api.post("market/app/getapps", {name: that.searchInput, sortby: that.searchOption}, function (res) {
            that.searchedApps = res.data;
            that.loading = false;
        });
    }

    this.searchByCategory = function(cat){
        id = cat.id;
        if(!id || id<0){
          this.loadAllApps();
          return;
        }
        this.inCategory = true;
        this.loading = true;
        that.currentcategory = cat.name;
	    $api.post("market/app/getAppsByCategory", {catId: id}, function (res) {

            that.searchedApps = res.data;
            that.loading = false;
        });
    }

    this.load();

});
