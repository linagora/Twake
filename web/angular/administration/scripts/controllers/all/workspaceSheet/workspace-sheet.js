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
        this.colors = [];
        this.total = 0;
        this.units = ['o','Ko','Mo','Go','To'];
        this.unit = '';
        this.userCount = 0;
        this.labels = [];
        this.startdate;
        this.enddate;
        this.update = function(){

            var startdate = new Date();
            //document.getElementById("date2").value;
            this.enddate = startdate.toISOString().substring(0,10);
            startdate.setDate(startdate.getDate() - 30);
            //document.getElementById("date1").value
            this.startdate = startdate.toISOString().substring(0,10);

            this.drawChart();
            this.drawCountDonut();
            this.drawSizeDonut();
            $api.post("authentication/getInfoWorkspace", {
                id: this.id
            }, function (res) {
                console.log(res);
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
        this.drawCountDonut = function () {
            $api.post("authentication/numberOfExtensionsByWorkspace", {
                twakeWorkspace: this.id
            }, function (res) {
                var datas = [];
                for (var i = 0; i < res.data.length; i++) {
                    that.labels.push(res.data[i].extension);
                    datas.push(res.data[i].nb);
                }
                poolColors(datas.length);
                var ctx = document.getElementById("myDonut");
                var myDoughnutChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data = {
                        datasets: [{
                            data: datas,
                            backgroundColor: that.colors
                        }],

                        // These labels appear in the legend and in the tooltips when hovering different arcs
                        labels: that.labels
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
        this.drawSizeDonut = function () {
            $api.post("authentication/sizeByExtensions", {
                twakeWorkspace: this.id,
            }, function (res) {
                var labels = [];
                var datas = [];
                for (var i = 0; i < res.data.length; i++) {
                    //labels.push(res.data[i].extension);
                    datas.push(res.data[i].sizes);
                    that.total += parseInt(res.data[i].sizes);
                }
                var cpt =0;
                while(that.total / 1000 > 1 && cpt <= that.units.length)
                {
                    that.total = that.total / 1000;
                    cpt++;
                }
                console.log(that.total);
                that.unit = that.units[cpt];
                var ctx = document.getElementById("myDonut2");
                var myDoughnutChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data = {
                        datasets: [{
                            data: datas,
                            backgroundColor: that.colors
                        }],

                        // These labels appear in the legend and in the tooltips when hovering different arcs
                        labels: that.labels
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
            for(i=0;i<a;i++){
                that.colors.push(dynamicColors());
            }
        }

        var dynamicColors = function() {
            var r = Math.floor(Math.random() * 255);
            var g = Math.floor(Math.random() * 255);
            var b = Math.floor(Math.random() * 255);
            return "rgb(" + r + "," + g + "," + b + ")";
        }

        this.drawChart = function () {
            var publicMsg;
            var privateMsg;
            console.log(that.startdate);
            console.log(that.enddate);
            $api.post("authentication/numberOfMessagePublicByWorkspace", {
                twakeWorkspace: this.id,
                startdate: that.startdate,//.toISOString().substring(0, 10),
                enddate: that.enddate//.toISOString().substring(0, 10)
            }, function (res) {
                console.log(res);
                publicMsg = res.data;

                var publicData = [];
                var labels = [];

                for(var i = 0;i<privateMsg.length;i++) {
                    labels.push(publicMsg[i].date.date.substring(0, 10));
                    publicData.push(publicMsg[i].publicMsgCount);
                }
                var ctx = document.getElementById("myChart2");
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Number of public message',
                                data: publicData,
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
            });

            $api.post("authentication/numberOfMessagePrivateByUserByWorkspace", {
                twakeWorkspace: this.id,
                startdate: that.startdate,//.toISOString().substring(0, 10),
                enddate: that.enddate//.toISOString().substring(0, 10)
            }, function (res2) {
                console.log(res2.data);
                privateMsg = res2.data;
                var privateData = [];
                var labels = [];

                for(var i = 0;i<privateMsg.length;i++) {
                    labels.push(privateMsg[i].date.date.substring(0, 10));
                    privateData.push(privateMsg[i].privateMsgCount);
                }
                var ctx = document.getElementById("myChart");
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
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

            });
        }
        this.update();

    });
