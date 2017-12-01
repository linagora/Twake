angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('parameters-premium', {
        url: "/parameters/repartition",
        templateUrl: '@gviews/parameters/premium.html',
        parent: "group-general"
    })
		;
})
.controller('parametersRessourceCtrl', function($api, $group){
    this.dataByGroup = {};
    this.userPrice = {};
    this.listGroup = {};
    this.right = {apps:[]};
    this.changePrice = false;
    this.oldPrice = -1;
    this.typePrice = [] //[{name:"gratuit",price:0,color:"#00E676"},{name:"premium",price:10,color:"#00E5FF"},{name:"gold",price:25,color:"#FFD700"},{name:"ultra gold premium +++",price:250,color:"#FFD700"}];
    var that = this;
		$api.post("payments/groups/get", {groupId: $group.groupId}, function (res) {
        that.dataByGroup = [res.data];
        that.loadPrice();
    });
		$api.post("payments/prices/get", {}, function (res) {
        that.typePrice = res.data
    });

    this.loadPrice = function(){
        that.setPrice(that.dataByGroup[0]);
	    $api.post("payments/details/get", {groupId: $group.groupId, groupsIdToPay: that.listGroup}, function (res) {
            that.right = res.data;
            if(that.oldPrice<0){
                    that.oldPrice = that.getPriceApplication() + that.right.usersTotalPrice;
            }
        });
    }

    this.getPriceApplication = function(){
        var retour = 0;
        that.right.apps.forEach(function(app){
            retour = retour + app.userCount*app.price;
        });
        return retour;
    }

    this.setPrice = function(group){
        that.listGroup[group.details.id] = group.details.levelId;
        group.children.forEach(function(g){
            that.setPrice(g);
        });
    }

    this.getTypeFromId = function(id){
        var retour;
        that.typePrice.forEach(function(t){
            if(t.id == id){
                retour = t;
            }
        });
        if(!retour){
            retour = {id:0,name:"gratuit",price:0};
        }
        return retour;
    }

    this.update = function(){
	    $api.post("payments/details/update", {groupsIdToPay: that.listGroup}, function (res) {
            that.changePrice = false;
            that.oldPrice = -1;
            that.loadPrice();
        });
    }

});
