angular.module('TwakeAdministration')
    .config(function($stateProvider){
        $stateProvider.state('user-sheet', {
            templateUrl: '@views/admin/user-sheet/user-sheet.html',
            url: '/user/{id}',
            parent : 'general'
        });
    })
    .controller('User_sheetCtrl', function($api, $scope, $stateParams, $state){

        var that = this;
        this.id = $stateParams.id;

        this.update = function(){
            $api.post("authentication/getInfoUser", {
                id: this.id
            }, function (res) {
                that.userInfo = res.data.user;
                that.workspaces = res.data.workspaces;
                $scope.$apply();

            });


        };

        this.makePieMessage = function () {
            var startdate = new Date();
            startdate.setDate(startdate.getDate() - 30);
            var message = [] ;
            var that = this;
            $api.post("authentication/countPublicMessage", {
                twakeUser: this.id,
                startdate: startdate.toISOString().substring(0, 10),
                enddate: new Date().toISOString().substring(0, 10)
            }, function (res) {
                message.push({
                    "country": "Public message",
                    "litres": res.data
                });
                $api.post("authentication/countPrivateMessage", {
                    twakeUser: that.id,
                    startdate: startdate.toISOString().substring(0, 10),
                    enddate: new Date().toISOString().substring(0, 10)
                }, function (res) {
                    console.log(res);
                    message.push({
                        "country": "Private message",
                        "litres": res.data
                    });
                    AmCharts.makeChart("piediv", {
                        "type": "pie",
                        "theme": "light",
                        "innerRadius": "40%",
                        "gradientRatio": [-0.4, -0.4, -0.4, -0.4, -0.4, -0.4, 0, 0.1, 0.2, 0.1, 0, -0.2, -0.5],
                        "dataProvider": message,
                        "balloonText": "[[value]]",
                        "valueField": "litres",
                        "titleField": "country",
                        "balloon": {
                            "drop": true,
                            "adjustBorderColor": false,
                            "color": "#FFFFFF",
                            "fontSize": 16
                        },
                        "export": {
                            "enabled": true
                        }
                    });

                });

            });



        }
        this.makeChart = function(){
            var startdate = new Date();
            startdate.setDate(startdate.getDate() - 30);

            $api.post("authentication/findConnection", {
                user_id: this.id,
                startdate: startdate.toISOString().substring(0, 10),
                enddate: new Date().toISOString().substring(0, 10)
            }, function (res) {
                var dataset = [];
                var segments = [];
                var newDate;
                for(var i = 0; i < res.data.length;i++){
                    segments = []
                    var test = res.data[i].debut+"".substring(0,19);
                    newDate = new Date(res.data[i].debut.date);
                    newDate.setSeconds(newDate.getSeconds()+res.data[i].fin);
                    var sameDate = false;
                    if(i+1 < res.data.length){
                        if((new Date(res.data[i].debut.date).getDay() == new Date(res.data[i+1].debut.date).getDay()) && (new Date(res.data[i].debut.date).getMonth() == new Date(res.data[i+1].debut.date).getMonth())&& (new Date(res.data[i].debut.date).getFullYear() == new Date(res.data[i+1].debut.date).getFullYear())){
                            sameDate = true;
                            while(sameDate == true){
                                segments.push({
                                    "start": new Date(res.data[i].debut.date),
                                    "end": new Date(res.data[i].debut.date).setSeconds((new Date(res.data[i].debut.date).getSeconds())+res.data[i].fin),
                                    "color": "#ff3b22",
                                    "task": "Gathering requirements"
                                });
                                if(i+1 < res.data.length) {
                                    if ((new Date(res.data[i].debut.date).getDay() == new Date(res.data[i + 1].debut.date).getDay()) && (new Date(res.data[i].debut.date).getMonth() == new Date(res.data[i + 1].debut.date).getMonth()) && (new Date(res.data[i].debut.date).getFullYear() == new Date(res.data[i + 1].debut.date).getFullYear())) {
                                        sameDate = true;
                                        i++;
                                    }
                                    else{
                                        sameDate = false;
                                    }
                                }
                                if(i == res.data.length-1){
                                    sameDate =false;
                                }
                            }
                        }
                        else{
                            segments.push({
                                "start": new Date(res.data[i].debut.date),
                                "end": new Date(res.data[i].debut.date).setSeconds((new Date(res.data[i].debut.date).getSeconds())+res.data[i].fin),
                                "color": "#ff3b22",
                                "task": "Gathering requirements"
                            });
                        }
                    }
                    {
                        dataset.push({
                            "category": new Date(res.data[i].debut.date),
                            "segments": segments
                        });

                    }
                }

                    var chart = AmCharts.makeChart( "chartdiv", {
                        "type": "gantt",
                        "theme": "light",
                        "marginRight": 70,
                        "period":'fff',
                        "format":'JJ:NN:SS',
                        "columnWidth": 0.5,
                        "valueAxis": {
                            "type": "date"
                        },
                        "brightnessStep": 7,
                        "graph": {
                            "lineAlpha": 1,
                            "lineColor": "#fff",
                            "fillAlphas": 0.85,
                            "balloonText": "<b>[[task]]</b>:<br />[[open]] -- [[value]]"
                        },
                        "rotate": true,
                        "categoryField": "category",
                        "segmentsField": "segments",
                        "colorField": "color",
                        "startDateField": "start",
                        "endDateField": "end",
                        "dataProvider": dataset,
                        "valueScrollbar": {
                            "autoGridCount": true
                        },
                        "chartCursor": {
                            "cursorColor": "#55bb76",
                            "valueBalloonsEnabled": false,
                            "cursorAlpha": 0,
                            "valueLineAlpha": 0.5,
                            "valueLineBalloonEnabled": true,
                            "valueLineEnabled": true,
                            "zoomable": true,
                            "valueZoomable": true
                        },
                        "export": {
                            "enabled": true
                        }
                    } )
            }

            )

;
        }

        this.update();
        this.makeChart();
        this.makePieMessage();
        this.goBack = function () {
            $state.go("user-all")
        }

        this.getWorkspaceView = function(workspaceId){
            $state.go("workspace-sheet", {id: workspaceId})
        }
        });



