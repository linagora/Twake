angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('cpu', {
			templateUrl: '@views/admin/cpu/cpu.html',
			url: '/cpu',
			parent : 'general'
		});
	})
    .controller('CpuCtrl', function($api, $scope, $state){
        var that = this;

        this.update = function(){
            $api.post("authentication/getCpuUsage", null, function (res) {
                that.drawCPUDonut(res);
                $api.post("authentication/getStorageSpace", null, function (res) {
                    that.drawStorageDonut(res.data);
                    $api.post("authentication/getRamUsage", null, function (res) {
                        that.drawRamDonut(res.data);
                    });
                });
                $scope.$apply();
            });
        }

        this.drawCPUDonut = function (res) {
            var datas = [];
            var labels = [];
            var colors = [];

            colors.push("rgba(0,139,0,0.8)");
            for (var i = 3; i<Object.keys(res.data).length;i++) {
                labels.push(Object.keys(res.data)[i]);
                datas.push(Object.values(res.data)[i]);
                colors.push("rgba(205,0,0,0."+ (8-(i-3))+")");
            }
            var ctx = document.getElementById("CPUDonut");
            var myDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: data = {
                    datasets: [{
                        data: datas,
                        backgroundColor: colors
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
                            fontSize: 12
                        }
                    }
                }
            });
        };

        this.drawCPULineChart = function (res) {

        }

        this.drawStorageDonut = function (data) {

            var ctx = document.getElementById("StorageDonut");
            var myDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: data = {
                    datasets: [{
                        data: [data.utilise,data.total - data.utilise],
                        backgroundColor: ["rgba(205,0,0,0.8)","rgba(0,139,0,0.8)"]
                    }],

                    // These labels appear in the legend and in the tooltips when hovering different arcs
                    labels: ["Used Storage", "Free Storage"]
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
        };

        this.drawStorageLineChart = function (res) {

        }

        this.drawRamDonut = function (data) {

            var ctx = document.getElementById("RamDonut");
            var myDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: data = {
                    datasets: [{
                        data: [data.used,100 - data.used],
                        backgroundColor: ["rgba(205,0,0,0.8)","rgba(0,139,0,0.8)"]
                    }],

                    // These labels appear in the legend and in the tooltips when hovering different arcs
                    labels: ["Used RAM", "Free RAM"]
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
        };

        this.drawRamLineChart = function (res) {

        }
        this.update();
    });
