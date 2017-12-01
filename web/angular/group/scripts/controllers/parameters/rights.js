angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
    .state('parameters-rights', {
        url: "/parameters/rights",
        templateUrl: '@gviews/parameters/rights.html',
        parent: "group-general"
    })
		;
})
.controller('parametersRightsCtrl', function($rootScope, $api, $group, $ngConfirm, $confirm) {

    var that = this;
    this.levels = [];
    this.newLevelName = "";
    this.selectedAction = "";
    this.selectedLevels = [];
    this.currentFormLocalLevelId = "";
    this.rightsPossible = {};
    this.editable = false;
    this.deplaceMembersSelected = false;
    this.selectedNewLocationLevelId = "";

    $group.onReady(function() { // au cas où le service $groupe est déjà chargé
        that.editable = $group.getRight("base:right:edite");
    });
    $group.onUpdate(function() {
        that.editable = $group.getRight("base:right:edite");
    });

    this.loadLevels = function () {

	    $api.post("group/rights/getlevels", {groupId: $group.groupId}, function (res) {

            if(res.errors.length===0) {
                that.levels = [];

                if (res.errors.length === 0) {
                    that.levels = res.data;
                }
            }
            else {
                $ngConfirm("Vous n'avez pas les droits pour accéder à cette page");
            }
        });

	    $api.post("group/rights/getAllRights", {groupId: $group.groupId}, function (res) {
            if(res.errors.length===0){
                that.rightsPossible = res.data;
            }
        });
    };

    this.createLevel = function () {

	    $api.post("group/rights/createlevel", {groupId: $group.groupId, name: that.newLevelName}, function (res) {

            if (res.errors.length === 0) {

                that.loadLevels();
                that.newLevelName = "";
            }else if(res.oerrors.empty){
              $ngConfirm("Le nouveau rôle doit avoir un nom composé d'au moins un caractère alphanumérique.");
            } else {
                $ngConfirm("Vous n'avez pas les droits pour créer un nouveau rôle.");
            }
        });
    };

    this.updateLevel = function(){
	    $api.post("group/rights/updateLevel", {
		    groupId: $group.groupId,
		    levelId: that.levels[that.currentFormLocalLevelId].idLevel,
		    rights: that.levels[that.currentFormLocalLevelId].right,
		    name: that.levels[that.currentFormLocalLevelId].nameLevel
	    }, function (res) {

            if (res.errors.length === 0) {
                that.currentFormLocalLevelId = "";
            }
            else {
                $ngConfirm("Vous n'avez pas les droits pour modifier un nouveau niveau de droits");
            }
        });

    }

    this.doGroupedAction = function () {

        var keys = Object.keys(that.selectedLevels);
        var error = false;

        if (that.selectedAction === "delete") {

            $confirm("Etes-vous sûr de vouloir supprimer les niveaux sélectionnés ?", function() {
                keys.forEach(function (id) {

                    if (that.selectedLevels[id]) {
	                    $api.post("group/rights/deleteLevels", {
                            groupId: $group.groupId,
                            levelId: id
                        }, function (res) {

                            if (res.errors.length === 0) {
                                that.loadLevels();
                            }
                            else if (!error) {
                                $ngConfirm("Vous n'êtes pas autorisé à supprimer un ou plusieurs des droits sélectionnés");
                                error = true;
                            }
                        });
                    }
                });
            });

            that.selectedAction = "";
        }
        else if (that.selectedAction === "deplace") {

            that.deplaceMembersSelected = true;
        }
    };

    this.deplaceMembers = function() {

        var keys = Object.keys(that.selectedLevels);
        var error = false;

        if (that.selectedNewLocationLevelId !== "") {

            $confirm("Etes-vous sûr de vouloir déplacer tous les membres de ces droits vers celui sélectionné ?", function () {

                keys.forEach(function (id) {

                    if (that.selectedLevels[id]) {
	                    $api.post("group/rights/deplaceLevelMembers", {
                            levelIdFrom: id,
                            levelIdTo: that.selectedNewLocationLevelId
                        }, function (res) {

                            if (res.errors.length === 0) {
                                that.loadLevels();
                            }
                            else if (res.errors.length !== 0 && !error) {
                                $ngConfirm("Vous n'êtes pas autorisé à déplacer les membres d'un ou plusieurs des droits sélectionnés" + res.errors[0] + " / " + id + " / " + that.selectedNewLocationLevelId);
                                error = true;
                            }
                        });
                    }
                });

                that.deplaceMembersSelected = false;
                that.selectedNewLocationLevelId = "";
                that.selectedAction = "";
            }, function () {

                that.deplaceMembersSelected = false;
                that.selectedNewLocationLevelId = "";
                that.selectedAction = "";
            });
        }
    };

    this.getLevelLocalId = function (levelId) {

        for (var i = 0; i < that.levels.length; ++i) {
            if (that.levels[i].idLevel === levelId) {
                return i;
            }
        }

        return 0;
    };

    this.showLevelForm = function (levelId) {
        that.currentFormLocalLevelId = that.getLevelLocalId(levelId);
    };

    this.setAsDefault = function (levelId) {

	    $api.post("group/rights/setdefaultlevel", {groupId: $group.groupId, levelId: levelId}, function (res) {

            if (res.errors.length === 0) {
                that.loadLevels();

            }
            else {
                $ngConfirm("Vous n'êtes pas autorisé à modifier le niveau de droits par défaut");

            }
        });
    };

    this.showMainPage = function () {
        that.currentFormLocalLevelId = "";
    };

    this.loadLevels();

});
