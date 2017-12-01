angular.module('twake')
.controller('menuLeftCtrl', function($api, $user, $group, $state){
		$("#sortable_app").sortable({
			axis: "y"
		});
		$("#sortable_app").disableSelection();
});
