function serviceFilePopup(app) {
	return app
		.service('$filePopup', function ($uibModal, $rootScope) {

			var that = this;
			$rootScope.filePopup = that;

			this.popup = null;
			this.popupMode = "save";    // open, save
			this.directory = 0;
			this.filename = "Untitled";
			this.canOpenDirectory = false;
			this.result = null;
			this.onUpdateCallbacks = [];

			this.onUpdate = function (callback) {
				that.onUpdateCallbacks.push(callback);
			};

			this.openPopup = function (options) {

				that.popupMode = options.mode ? options.mode : "open";
				that.directory = options.directoryId ? options.directoryId : 0;
				that.filename = options.filename ? options.filename : "Untitled";
				that.canOpenDirectory = options.canOpenDirectory ? options.canOpenDirectory : false;
				that.popup = $uibModal.open({
					backdrop: true,
					keyboard: true,
					windowClass: "modal",
					backdropClick: true,
					templateUrl: '@gviews/drive/popup/savePopup.html'
				});
			};

			this.returnResult = function (data) {
				that.result = data;
				that.popup.close();
				that.onUpdateCallbacks.forEach(function (callback) {
					callback();
				});
				that.onUpdateCallbacks = [];
			};
		});
}
