angular.module("TwakeAdministration")
.config(function($stateProvider){
  $stateProvider
  .state("api-console",{
    url: "/api/console",
		  templateUrl: "@views/admin/api/console.html",
    parent: "general"
  });
})
.controller("apiConsoleCtrl",function($http,$window){
  this.route = '';
  this.args = [];
  this.response = 'no request';
  var save = $window.localStorage.getItem("admin_api_history");
  if(save!=undefined && save!=""){
    this.history = JSON.parse(save);
  }else{
    this.history = [];
  }
  var that = this;

  this.test = function(){
    var data = {};

      angular.forEach(that.args, function(el){
      if (el.value.length > 0 && el.value.substr(0, 1) === "{") {
          data[el.key] = JSON.parse(el.value);
      }
      else {
          data[el.key] = el.value;
      }
    });
    that.response = '';
    $http.post(this.route, data, {ignoreLoadingBar: true})
        .success(function(data){

            that.response = JSON.stringify(data, null, 4);

            that.history.unshift({
              "text":that.route + " => " +  JSON.stringify(that.args).substring(0,50),
              "data":{
                "route":that.route,
                "args":that.args
              }
            });

            if(that.history.length>20){
              that.history = that.history.slice(that.history.length-1,1);
            }
            $window.localStorage.setItem("admin_api_history", JSON.stringify(that.history));
    });

  };

  this.loadOld = function(data){
    that.route = data.route;
    that.args = data.args;
  }


})
;
