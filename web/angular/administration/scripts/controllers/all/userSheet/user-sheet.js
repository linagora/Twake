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
                console.log(res);
                that.userInfo = res.data.user;
                that.workspaces = res.data.workspaces;
                $scope.$apply();
            });
            //this.makeChart();
        };
        this.goBack = function () {
            $state.go("user-all")
        }

        this.getWorkspaceView = function(workspaceId){
            $state.go("workspace-sheet", {id: workspaceId})
        }
        /*this.makeChart = function(){
            var startdate = new Date();
            startdate.setDate(startdate.getDate() - 7);

            $api.post("authentication/findConnection", {
                user_id: this.id,
                startdate: startdate.toISOString().substring(0, 10),
                enddate: new Date().toISOString().substring(0, 10)
            }, function (res) {
                console.log(res);
                var dataset = [];
                for(var i = 0; i < res.data.length;i++){
                    console.log();
                    console.log(res.data[i].fin);
                    {
                        dataset.push({
                            "category": "Module #1",
                            "segments": [{
                                "start": "2016-01-01 02:00:00",
                                "end": "2016-01-01 04:00:00",
                                "color": "#b9783f",
                                "task": "Gathering requirements"
                            }, {
                                "start": "2016-01-02 06:00:00",
                                "end": "2016-01-02 08:00:00",
                                "task": "Producing specifications"
                            }]
                        });

                    }
                }
            })
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
                "dataProvider": [ {
                    "category": "Module #1",
                    "segments": [ {
                        "start": "2016-01-01 02:00:00",
                        "end": "2016-01-01 04:00:00",
                        "color": "#b9783f",
                        "task": "Gathering requirements"
                    }, {
                        "start": "2016-01-02 06:00:00",
                        "end": "2016-01-02 08:00:00",
                        "task": "Producing specifications"
                    }]
                }/*, {
                    "category": "Module #2",
                    "segments": [ {
                        "start": "2016-01-08",
                        "end": "2016-01-10",
                        "color": "#cc4748",
                        "task": "Gathering requirements"
                    }, {
                        "start": "2016-01-12",
                        "end": "2016-01-15",
                        "task": "Producing specifications"
                    }, {
                        "start": "2016-01-16",
                        "end": "2016-02-05",
                        "task": "Development"
                    }, {
                        "start": "2016-02-10",
                        "end": "2016-02-18",
                        "task": "Testing and QA"
                    } ]
                }, {
                    "category": "Module #3",
                    "segments": [ {
                        "start": "2016-01-02",
                        "end": "2016-01-08",
                        "color": "#cd82ad",
                        "task": "Gathering requirements"
                    }, {
                        "start": "2016-01-08",
                        "end": "2016-01-16",
                        "task": "Producing specifications"
                    }, {
                        "start": "2016-01-19",
                        "end": "2016-03-01",
                        "task": "Development"
                    }, {
                        "start": "2016-03-12",
                        "end": "2016-04-05",
                        "task": "Testing and QA"
                    } ]
                }, {
                    "category": "Module #4",
                    "segments": [ {
                        "start": "2016-01-01",
                        "end": "2016-01-19",
                        "color": "#2f4074",
                        "task": "Gathering requirements"
                    }, {
                        "start": "2016-01-19",
                        "end": "2016-02-03",
                        "task": "Producing specifications"
                    }, {
                        "start": "2016-03-20",
                        "end": "2016-04-25",
                        "task": "Development"
                    }, {
                        "start": "2016-04-27",
                        "end": "2016-05-15",
                        "task": "Testing and QA"
                    } ]
                }, {
                    "category": "Module #5",
                    "segments": [ {
                        "start": "2016-01-01",
                        "end": "2016-01-12",
                        "color": "#448e4d",
                        "task": "Gathering requirements"
                    }, {
                        "start": "2016-01-12",
                        "end": "2016-01-19",
                        "task": "Producing specifications"
                    }, {
                        "start": "2016-01-19",
                        "end": "2016-03-01",
                        "task": "Development"
                    }, {
                        "start": "2016-03-08",
                        "end": "2016-03-30",
                        "task": "Testing and QA"
                    } ]
                } ],
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
            } );
            this.update();
        }*/

    });
