angular.module('twake')
    .config(function ($stateProvider) {
        $stateProvider
            .state('parameters-application', {
                url: "/parameters/application",
                templateUrl: '@gviews/parameters/application.html',
                parent: "group-general"
            })
        ;
    })
    .controller('applicationManagerController', function($api, $group, $rootScope, $confirm){

        var that=this;

        this.deleteApplication = function(appli){
            $confirm("Voulez vous supprimer l'application "+appli.name+" ?",function(){
                $api.post("market/group/remove",{"groupId": $group.groupId, "appId": appli.id}, function (res) {
                    if (res.errors.length == 0) {
                        $group.update();
                    }
                });
            });
        }

    });