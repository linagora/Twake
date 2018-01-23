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
            this.drawDonut();
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
        this.drawDonut = function () {
            $api.post("authentication/sizeByExtensions", {
                twakeWorkspace: this.id,
            }, function (res) {
                console.log(res.data);
                var labels = [];
                var datas = [];
                for (var i = 0; i < res.data.length; i++) {
                    labels.push(res.data[i].extension);
                    datas.push(res.data[i].sizes);
                }
                var ctx = document.getElementById("myDonut");
                var myDoughnutChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data = {
                        datasets: [{
                            data: datas
                        }],

                        // These labels appear in the legend and in the tooltips when hovering different arcs
                        labels: labels
                    },
                    options: {
                        responsive: true,
                        title: {
                            display: true,
                            position: "top",
                            text: "Pie Chart",
                            fontSize: 18,
                            fontColor: "#111"
                        },
                        legend: {
                            display: true,
                            position: "bottom",
                            labels: {
                                fontColor: "#333",
                                fontSize: 16
                            }
                        }
                    }
                });
            });
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
