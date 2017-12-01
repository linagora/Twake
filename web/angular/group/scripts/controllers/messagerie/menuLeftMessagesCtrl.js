angular.module('twake')

	.controller('menuLeftMessagesCtrl', function ($api, $notification, $rootScope, $uibModal, $msg, $group, $confirm, $scope) {

		$rootScope.menuLeftMessages = this;
		var that = this;

		$("#channel_sort").sortable({
			axis: "y"
		});
		$("#channel_sort").disableSelection();

		$rootScope.openModalCreation = function () {
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@gviews/messages/channelCreation.html'
			});
		};
		$rootScope.openModalSetChannel = function () {
			that.load();
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@gviews/messages/channelSet.html'
			});
		};
		$rootScope.openModaladdMembers = function () {
			that.load();
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@gviews/messages/addMembers.html'
			});
		};
		$rootScope.openModalJoin = function () {
			$api.post("discussion/channels/get", {all: true, gid: $group.groupId}, function (res) {
				that.minus();
				$uibModal.open({
					backdrop: true,
					keyboard: true,
					windowClass: "modal loginDialog",
					backdropClick: true,
					templateUrl: '@gviews/messages/channelJoin.html',
				});
			});

		};

		this.channels = [];
		this.channelsRest = {};
		var that = this;
		$rootScope.channelsCtrl = that;


		this.load = function () {
			$api.post("discussion/channels/get", {gid: $group.groupId}, function (res) {
				angular.forEach(res.data.channels, function (el, i) {
					$msg.channels[i] = el;
				});
				that.channels = res.data.channels;
			});
		}

		this.forceReload = function () {
			this.load();
		}

		this.mute = function (id, value) {
			$api.post("discussion/channel/mute/set", {channelId: id, mute: value}, function (res) {
				$msg.channels[id].mute = value;
			});
		}

		this.createChannel = function () {
			$rootScope.channelsCtrl = that;
			$rootScope.openModalCreation();
		}

		this.exit = function (id) {
			$confirm("Etes vous sûr de vouloir partir de ce channel ?", function () {
				$api.post('discussion/channel/quit', {channelId: id}, function (res) {
					if (res.errors.length === 0) {
						$msg.channels[id] = undefined;
						that.load();
					}
				});
			});
		}

		this.load();
	});
