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
            $api.post("authentication/numberOfExtensionsByWorkspace", {
                twakeWorkspace: this.id,
            }, function (res) {
                console.log(res.data);
                var labels = [];
                var datas = [];
                for (var i = 0; i < res.data.length; i++) {
                    labels.push(res.data[i].extension);
                    datas.push(res.data[i].nb);
                }
                var ctx = document.getElementById("myDonut");
                var myDoughnutChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data = {
                        datasets: [{
                            data: datas,
                            backgroundColor: poolColors(datas.length)
                        }],

                        // These labels appear in the legend and in the tooltips when hovering different arcs
                        labels: labels
                    },
                    options: {
                        responsive: true,
                        title: {
                            display: false,
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
        var poolColors = function (a) {
            var pool = [];
            for(i=0;i<a;i++){
                pool.push(dynamicColors(a,i));
            }
            return pool;
        }

        var dynamicColors = function(a,i) {
            var cpt = 255 / a;
            var r = Math.floor(Math.random(255/a*i,255/a*(i+1)));
            var g = Math.floor(Math.random(255/a*i,255/a*(i+1)));
            var b = Math.floor(Math.random(255/a*i,255/a*(i+1)));
            return "rgb(" + r + "," + g + "," + b + ")";
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
                        labels.push(privateMsg[i].date.date.substring(0, 10));
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
                                    'rgba(255, 99, 132, 0.5)'
                            },
                                {
                                    label: 'Number of private message',
                                    data: privateData,
                                    backgroundColor:
                                        'rgba(0, 255, 0, 0.5)'
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
