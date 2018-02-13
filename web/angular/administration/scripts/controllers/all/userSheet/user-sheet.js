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
        var divMessage = document.getElementById("piediv");
        var divConnection = document.getElementById("chartdiv");
        divMessage.style.display = "none";
        divConnection.style.display = "none";
        this.update = function(){
            $api.post("authentication/getInfoUser", {
                id: this.id
            }, function (res) {
                that.userInfo = res.data.user;
                that.workspaces = res.data.workspaces;
                $scope.$apply();

            });


        };

        this.makeColumnMessage = function(){
            $api.post("authentication/countAllMessageByUser", {
                twakeUser: this.id
            }, function (res) {
                console.log(res.data);
                var dataset = [];
                for(var i = 0; i < res.data.length;i++){
                    dataset.push({
                        "date": res.data[i].dat.date,
                        "publicMessage": res.data[i].publicMsgCount,
                        "privateMessage": res.data[i].privateMsgCount
                    });
                }

                AmCharts.makeChart("piediv", {

                    "theme": "none",
                    "type": "serial",
                    "dataProvider": dataset,
                    "valueAxes": [{
                        "position": "left",
                        "title": "Nombre de messages",
                    }],
                    "startDuration": 1,
                    "graphs": [{
                        "balloonText": "Messages publics: <b>[[value]]</b>",
                        "fillAlphas": 0.9,
                        "lineAlpha": 0.2,
                        "title": "message public",
                        "type": "column",
                        "valueField": "publicMessage"
                    }, {
                        "balloonText": "Messages privés : <b>[[value]]</b>",
                        "fillAlphas": 0.9,
                        "lineAlpha": 0.2,
                        "title": "message privée",
                        "type": "column",
                        "clustered":false,
                        "columnWidth":0.5,
                        "valueField": "privateMessage"
                    }],
                    "plotAreaFillAlphas": 0.1,
                    "categoryField": "date",
                    "categoryAxis": {
                        "gridPosition": "start"
                    },
                    "export": {
                        "enabled": true
                    }

                });

            });


        };


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
                    } );
            }

            );
        }


        this.goBack = function () {
            $state.go("user-all")
        }

        this.getWorkspaceView = function(workspaceId){
            $state.go("workspace-sheet", {id: workspaceId})
        }

        this.btnMessage = function () {
            var div = document.getElementById("piediv");
            var chevron = document.getElementById("chevron1");
            if(div.style.display=="block") {
                div.style.display = "none";
                chevron.className = "glyphicon glyphicon-chevron-up";
            } else {

                div.style.width =  "100%";
                div.style.height=  "500px";

                div.style.display = "block";
                chevron.className = "glyphicon glyphicon-chevron-down";
                this.makeColumnMessage();

            }

        }
        this.btnConnection = function () {
            var div = document.getElementById("chartdiv");
            var chevron = document.getElementById("chevron2");
            if(div.style.display=="block") {

                div.style.display = "none";
                chevron.className = "glyphicon glyphicon-chevron-up";
            } else {

                div.style.width =  "100%";
                div.style.height=  "500px";
                div.style.display = "block";
                chevron.className = "glyphicon glyphicon-chevron-down";
                this.makeChart();


            }

        }
        this.update();
        //this.makeChart();
        //this.makePieMessage();
        });


