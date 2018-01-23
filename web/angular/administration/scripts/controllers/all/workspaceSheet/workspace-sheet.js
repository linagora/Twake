angular.module('TwakeAdministration')
    .config(function($stateProvider){
        $stateProvider.state('workspace-sheet', {
            templateUrl: '@views/admin/workspace-sheet/workspace-sheet.html',
            url: '/workspace/{id}',
            parent : 'general'
        });
    })
    .controller('Workspace_sheetCtrl', function($api, $scope, $stateParams, $state){

        var that = this;
        this.id = $stateParams.id;
        this.update = function(){
            this.drawChart();
            $api.post("authentication/getInfoWorkspace", {
                id: this.id
            }, function (res) {
                //console.log(res);
                that.workspaceInfo = res.data.workspace;
                that.users = res.data.users;
                $scope.$apply();
            });
        };
        this.goBack = function () {
            $state.go("workspace-all")
        }

        this.getProfileView = function(userId){
            $state.go("user-sheet", {id: userId})
        }
        this.drawChart = function () {
            var publicMsg;
            var privateMsg;
            var startdate = new Date();
            startdate.setDate(startdate.getDate() - 7);
            $api.post("authentication/numberOfMessagePublicByWorkspace", {
                twakeWorkspace: this.id,
                startdate: startdate.toISOString().substring(0, 10),
                enddate: new Date().toISOString().substring(0, 10)
            }, function (res) {
                    publicMsg = res.data;
            });

            $api.post("authentication/numberOfMessagePrivateByUserByWorkspace", {
                twakeWorkspace: this.id,
                startdate: startdate.toISOString().substring(0, 10),
                enddate: new Date().toISOString().substring(0, 10)
            }, function (res2) {
                privateMsg = res2.data;
                console.log(privateMsg);
                console.log(publicMsg);
                if(publicMsg.length == privateMsg.length) {
                    var publicData = [];
                    var privateData = [];
                    var labels = [];
                    for(var i = 0;i<publicMsg.length;i++)
                        publicData.push(publicMsg[i].publicMsgCount);

                    for(var i = 0;i<privateMsg.length;i++) {
                        labels.push(privateMsg[i].date.date);
                        privateData.push(privateMsg[i].privateMsgCount);
                    }
                    console.log(labels);
                    console.log(privateData);
                    console.log(publicData);
                    var ctx = document.getElementById("myChart");
                    var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Number of public message',
                                data: publicData,
                                backgroundColor:
                                    'rgba(255, 99, 132, 0.2)',
                                borderColor:
                                    'rgba(255,99,132,1)',
                                borderWidth: 1
                            },
                                {
                                    label: 'Number of private message',
                                    data: privateData,
                                    backgroundColor:
                                        'rgba(0, 255, 0, 0.2)',
                                    borderColor:
                                        'rgba(0,255,0,1)',
                                    borderWidth: 1
                                }
                            ]
                        },
                        options: {
                            scales: {
                                xAxes: [{stacked: true}],
                                yAxes: [{stacked: true}]
                            }
                        }
                    });
                }
            });
        }
        this.update();

    });
