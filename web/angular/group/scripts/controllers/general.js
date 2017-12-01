angular.module('twake')
.controller('groupGeneralCtrl',function($stateParams,$msg, $group){

    var that = this;
    this.hasRightRightView = false;
    this.hasRightRightEdit = false;
    this.hasRightMembersInvite = false;
    this.hasRightMembersView = false;
    this.hasRightMembersRemove = false;
    this.hasRightMembersEdit = false;
    this.hasRightGroupView = false;
    this.hasRightGroupEdit = false;
    this.hasRightLinksView = false;
    this.hasRightLinksEdit = false;

    $group.onReady(function() {
        that.updateRights();
    });
    $group.onUpdate(function() {
        that.updateRights();
    });

    this.updateRights = function() {

        that.hasRightRightView = $group.getRight("base:right:viewOther");
        that.hasRightRightEdit = $group.getRight("base:right:edite");
        that.hasRightMembersInvite = $group.getRight("base:members:invite");
        that.hasRightMembersView = $group.getRight("base:members:view");
        that.hasRightMembersRemove = $group.getRight("base:members:remove");
        that.hasRightMembersEdit = $group.getRight("base:members:edit");
        that.hasRightGroupView = $group.getRight("base:groupe:view");
        that.hasRightGroupEdit = $group.getRight("base:groupe:edit");
        that.hasRightLinksView = $group.getRight("base:links:view");
        that.hasRightLinksEdit = $group.getRight("base:links:edit");
    }
});
