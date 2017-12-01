angular.module('twake')
	.service("ApplicationBridge", function ($filePopup) {
		this.call = function (application, route, options, callback) {

			if (route === "/drive/explorer") {
				$filePopup.openPopup(options);
				$filePopup.onUpdate(function () {
					callback({data: $filePopup.result, errors: []});
				});
			}

			if (route === "/drive/autoopen") {
				console.log(application);
				if (application.additionalData.open) {
					var file = application.additionalData.open;
					callback({
						data: {
							fileId: file.id,
							filename: file.name,
							directoryId: file.parentId,
							isDirectory: file.isDirectory
						}, errors: []
					});
					return;
				}
				callback({data: undefined, errors: []});
			}

		}
	});
