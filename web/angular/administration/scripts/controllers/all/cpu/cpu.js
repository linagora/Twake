angular.module('TwakeAdministration')
	.config(function($stateProvider){
		$stateProvider.state('cpu', {
			templateUrl: '@views/admin/cpu/cpu.html',
			url: '/cpu',
			parent : 'general'
		});
	})
    .controller('CpuCtrl', function($api, $scope, $state){
        var randomScalingFactor = function() {
            return Math.round(Math.random() * 100);
        };
        var randomColorFactor = function() {
            return Math.round(Math.random() * 255);
        };
        var randomColor = function(opacity) {
            return 'rgba(' + randomColorFactor() + ',' + randomColorFactor() + ',' + randomColorFactor() + ',' + (opacity || '.3') + ')';
        };

        var config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        486.5,
                        501.5,
                        139.3,
                        162,
                        263.7,
                    ],
                    backgroundColor: [
                        "#F7464A",
                        "#46BFBD",
                        "#FDB45C",
                        "#949FB1",
                        "#4D5360",
                    ],
                    label: 'Expenditures'
                }],
                labels: [
                    "Hospitals: $486.5 billion",
                    "Physicians & Professional Services: $501.5 billion",
                    "Long Term Care: $139.3 billion",
                    "Prescription Drugs: $162 billion",
                    "Other Expenditures: $263.7 billion"
                ]
            },
            options: {
                responsive: true,
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false,
                    text: 'Chart.js Doughnut Chart'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var dataset = data.datasets[tooltipItem.datasetIndex];
                            var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                                return previousValue + currentValue;
                            });
                            var currentValue = dataset.data[tooltipItem.index];
                            var precentage = Math.floor(((currentValue/total) * 100)+0.5);
                            return precentage + "%";
                        }
                    }
                }
            }
        };


        var ctx = document.getElementById("chart-area").getContext("2d");
        window.myDoughnut = new Chart(ctx, config); {

        }
    });
