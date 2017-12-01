angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('parameters-linked', {
        url: "/parameters/linked-groups",
        templateUrl: '@gviews/parameters/linked.html',
        parent: "group-general"
    })
		;
})
.controller('parametersLinkedCtrl', function($api, $group, $rootScope, $uibModal){
    this.levels = [];
    this.links = {};
    this.linkedGroups = {};
    this.linkedGroups['parent'] = {};
    this.linkedGroups['child'] = {};
    this.linkedGroups['pending'] = {};
    this.linkedGroups['pending']['parent'] = {};
    this.linkedGroups['pending']['child'] = {};
    this.show = {};
    this.show['parent'] = false;
    this.show['child'] = false;
    this.show['pending'] = {};
    this.show['pending']['parent'] = false;
    this.show['pending']['child'] = false;
    this.levels = [];
    var that = this;
    this.init = function(){
	    $api.post('group/links/getall', {"groupId": $group.groupId}, function (res) {
           if (res.errors.length == 0){
               that.links = res.data;
           }

           that.getLinkedGroups();
        });
    }

    this.accept = function(link){

	    $api.post('group/links/accept', {'groupId': $group.groupId, 'linkId': link.linkId}, function (res) {
            if (res.errors.length == 0){
              that.linkedGroups[link.type][link.id] = that.linkedGroups['pending'][link.type][link.id];
              that.linkedGroups[link.type][link.id].status = "A";
              that.show[link.type] = true;
              delete that.linkedGroups['pending'][link.type][link.id];

              if (Object.keys(that.linkedGroups['pending'][link.type]).length == 0){
                that.show['pending'][link.type] = false;
              }
            } else {
            }
        });
    }

    this.remove = function(link){

	    $api.post('group/links/remove', {'groupId': $group.groupId, 'linkId': link.linkId}, function (res) {
            if (res.errors.length == 0){
              if (link.status == "P"){
                delete that.linkedGroups['pending'][link.type][link.id];
                if (Object.keys(that.linkedGroups['pending'][link.type]).length == 0){
                  that.show['pending'][link.type] = false;
                }
              } else {
                delete that.linkedGroups[link.type][link.id];
                if (Object.keys(that.linkedGroups[link.type]).length == 0){
                  that.show[link.type] = false;
                }
              }
            } else {
            }
        });
    }

    this.getLinkedGroups = function(){
        that.links.forEach(function(link){
            var data = {};
            var type = "";
            if (link.parent.id == $group.groupId){
                data = link.child;
                type = "child";
                data.asked = false;
                if (link.asker == "C"){
                    data.asked = true;
                }
            } else {
                data = link.parent;
                type = "parent";
                data.asked = false;
                data.levels = link.levels;
                data.parentToChildLevel = link.parentToChildLevel;
                if (link.asker == "P"){
                    data.asked = true;
                }
            }
            data.type = type;
            data.linkId = link.id;
            data.status = link.status;
            if (data.status == "P") {
              that.linkedGroups['pending'][type][data.id] = data;
              that.show['pending'][type] = true;
            } else {
              that.linkedGroups[type][data.id] = data;
              that.show[type] = true;
            }


        });
    }


    this.searchByCode = function(){
	    $api.post("group/getByCode", {groupCode: that.parent.code}, function (res) {
            that.groupToLink = res.data;
        });
    }

    this.updateParentToChildLevel = function(groupParentId, childLevelId) {

	    $api.post('group/rights/setParentToChildLevel', {
		    groupParentId: groupParentId,
		    groupChildId: $group.groupId,
		    childLevelId: childLevelId
	    }, function (res) {

        });
    };



    this.init();
    that.groupToLink = undefined;
  this.parentAttente = "";
  this.parent = {"code":"", "id":-1};
  this.errorParent = false;
  this.loadingfast = false;
  $group.onUpdate(function() {
      that.levels = [];
      //that.levels.push({id: -1, name: "Pas autorisé"});
      var keys = Object.keys($group.data.levels);
      keys.forEach(function (key) {
          that.levels.push({id: key, name: $group.data.levels[key]});
      });
  });


  /*this.updateParent = function(typed){
    if (that.loadingfast){
      return;
    }
    that.loadingfast = true;
   $api.post("group/fastsearch",{limit:10,offset:0,firstCharacters:typed},function(res){

      that.parent = {name:[],id:[]};
      for(i=0;i<res.data.groups.length;i++){
        that.parent["name"].push(res.data.groups[i].name);
        that.parent["id"].push(res.data.groups[i].id);
      }
      that.loadingfast = false;
    });
  };*/

  this.askChild = function(){
    that.ask("C");
  };

  this.askParent = function(){
    that.ask("P");
  }

  this.addAccessLevels = function(link) {

      $rootScope.link = link;
      $rootScope.levels = that.levels;

      $uibModal.open({
          backdrop: true,
          keyboard: true,
          windowClass: "modal",
          backdropClick: true,
          templateUrl: '@gviews/templates/addAccessLevels.html'
      });
  };


  this.ask = function(type){
    if(that.parentAttente.id === -1){
      that.errorParent = true;
    }
    else{
      var groupId = that.parent['id'];
      var childId = 0;
      var parentId = 0;
      var askerId = $group.groupId;
      if (type == "C"){
        childId = askerId;
        parentId = groupId;
      } else {
          childId = groupId;
          parentId = askerId;
      }
      that.parentAttente="";
	    $api.post("group/links/ask", {"childId": childId, "parentId": parentId, "askerId": askerId}, function (res) {
         if (res.errors.length == 0){
             that.init();
         } else {
         }
      });
      that.errorParent = false;

    }
  }
})
.controller('addAccessLevelCtrl', function($api, $group, $rootScope){

    var that = this;
    that.link = $rootScope.link;
    that.levels = $rootScope.levels;
    that.levelsValues = {};

    that.levels.forEach(function(e) {
        that.levelsValues[e.id] = false;
    });

    that.show = function() {
        console.log(that.levelsValues);
    };

    that.validate = function() {

    };
});
