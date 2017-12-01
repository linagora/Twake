function serviceUpload(app) {
	return app
		.service('$upload', function (Upload, $rootScope, $api, $window, $group, $uibModal, $uibModalStack, $msg, ApplicationBridge) {

			var MAXFILESIZE = 100000000;
			var MAXFILESIZE_TEMP = 10000000;

			var that = this;
			$rootScope.upload = this;

			this.isUploading = false;
			this.nameUpload = {};

			var that = this;


			Object.size = function (obj) {
				var size = 0, key;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) size++;
				}
				return size;
			};


			this.choose = function (choosed) {
				var vals = that.currentState;
				console.log(vals.droppedFiles);
				if(choosed=="drive"){
                    ApplicationBridge.call("message","/drive/explorer",{mode: "save",filename:vals.droppedFiles[0].name}, function (res) {
                        console.log(res);
                        vals.attrs.uploadDirectory = res.data.directoryId;
						that.uploadFromButton(choosed, vals.scope, vals.attrs, vals.droppedFiles);
                        $uibModalStack.dismissAll();
                    });
				}
				else{
                    that.uploadFromButton(choosed, vals.scope, vals.attrs, vals.droppedFiles);
                    $uibModalStack.dismissAll();
				}
			};

			this.verifySize = function (file, type) {
				if (file.size > MAXFILESIZE || (type == "temp" && file.size > MAXFILESIZE_TEMP)) {
					$uibModal.open({
						backdrop: true,
						keyboard: true,
						windowClass: "modal",
						backdropClick: true,
						templateUrl: '@gviews/templates/errorUpload.html'
					});
					return false;
				}
				return true;
			};

			this.uploadDrivePreparation = function (callbacks_interface, $attrs, file, directory, gid, type) {

				if (!that.verifySize(file, type)) {
					if (callbacks_interface.onUploadError) {
						callbacks_interface.onUploadError(directory, file);
					}
					delete that.nameUpload[file.name];
					return;
				}

				var idTemp = -1;
				if (type == "temp") {
					/*$api.post("drive/create",{name:"temp",groupId:gid,isDirectory:true},function(res){
					 console.log(res);
					 that.uploadDrive(callbacks_interface, file, res.data.fileId, gid);
					 });*/
					that.uploadTemp(callbacks_interface, file, gid);
				}
				else if (type = "drive") {
					if ($attrs.uploadFrom == "chat" && !directory) {
						ApplicationBridge.call("message", "/drive/explorer", {
							mode: "save",
							filename: file.name
						}, function (res) {
							that.uploadDrive(callbacks_interface, file, res.data.directoryId, gid);
						});
					}
					else {
						that.uploadDrive(callbacks_interface, file, directory, gid);
					}
				}

			};

			this.uploadDrive = function (callbacks_interface, file, directory, gid) {
				var ajaxData = new FormData();

				that.isUploading = true;

				that.nameUpload[file.name].uploader = Upload.upload({
					url: $api.getRealRoute("drive/upload"),
					data: {file: file, parentId: directory, groupId: gid}
				});

				that.nameUpload[file.name].uploader.then(
					function (resp) { //Ok
						delete that.nameUpload[file.name];
						if (Object.size(that.nameUpload) == 0) {
							that.isUploading = false;
							if (callbacks_interface.onUploadSuccess) {
								callbacks_interface.onUploadSuccess(directory, resp.data.data.idFile, true);
							}
						}
					}, function (resp) { //Error
						console.log("ERROR");
						delete that.nameUpload[file.name];
						if (Object.size(that.nameUpload) == 0) {
							that.isUploading = false;
						}
						if (callbacks_interface.uploadOnError) {
							callbacks_interface.uploadOnError(directory, file);
						}
					}, function (evt) { //Progress
						var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
						that.nameUpload[file.name].value = progressPercentage;
						that.nameUpload[file.name].size = evt.total;
					}
				);

			}

			this.uploadTemp = function (callbacks_interface, file, gid) {
			    console.log("upload temp");
				var ajaxData = new FormData();

				if (!that.verifySize(file, "temp")) {
					if (callbacks_interface.onUploadError) {
						callbacks_interface.onUploadError(directory, file);
					}
					delete that.nameUpload[file.name];
					return;
				}

				that.isUploading = true;

				that.nameUpload[file.name].uploader = Upload.upload({
					url: $api.getRealRoute("discussion/upload"),
					data: {file: file}
				});

				that.nameUpload[file.name].uploader.then(
					function (resp) { //Ok
						delete that.nameUpload[file.name];
                        if (Object.size(that.nameUpload) == 0) {
							that.isUploading = false;
						}
						callbacks_interface.onUploadSuccess(null, resp.data.id, false);
						if (callbacks_interface.uploadOnSuccess) {
						}
					}, function (resp) { //Error
						console.log("ERROR");
						if (callbacks_interface.uploadOnError) {
							callbacks_interface.uploadOnError();
						}
						if (Object.size(that.nameUpload) == 0) {
							that.isUploading = false;
						}
					}, function (evt) { //Progress
						var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
						that.nameUpload[file.name].value = progressPercentage;
						that.nameUpload[file.name].size = evt.total;
					}
				);
			}

			this.countFilesTree = function (entry) {
				var sum = 0;
				if (entry.isFile) {
					sum++;
				} else if (entry.isDirectory) {
					var dirReader = entry.createReader();
					dirReader.readEntries(function (entries) {
						for (var i = 0; i < entries.length; i++) {
							sum += that.countFilesTree(entries[i]);
						}
					});
				}

				return sum;
			}

			this.traverseFileTree = function (intrface, $attrs, entry, directory, gid, type) {

				var nbfiles = that.countFilesTree(entry);
				var uploaded = 0;

				var recurFileTree = function (intrface, entry, directory, gid) {

					if (entry.isFile) {
						entry.file(function (file) {
							uploaded++;
							that.nameUpload[file.name] = {};
							that.nameUpload[file.name].value = 0;
							console.log("Upload file " + uploaded + "/" + nbfiles);
							that.uploadDrivePreparation(intrface, $attrs, file, directory, gid, type);
						});
					} else if (entry.isDirectory) {

						var dirReader = entry.createReader();

						console.log("creating new folder " + entry.name + "...");

						$api.post("/drive/create", {
							"parentId": directory,
							"name": entry.name,
							"groupId": gid,
							"isDirectory": true,
							"content": ""
						}, function (res) {

							console.log("continue in " + entry.name + ",");
							console.log(res.data);

							if (res.errors.length == 0) {
								dirReader.readEntries(function (entries) {
									for (var i = 0; i < entries.length; i++) {
										recurFileTree(intrface, entries[i], res.data.fileId, gid);
									}
								});
							}

						});
					}

				}

				recurFileTree(intrface, entry, directory, gid);

			}

			this.uploadFromButton = function (type, $scope, $attrs, e) {

				if (e.originalEvent != undefined) {
					e = e.originalEvent;
				}

				if (!e.length && !e.dataTransfer && !(e.target && e.target.files)) {
					return;
				}

				var intrface = $scope[$attrs.uploadInterface];

				if (type == "both") {
					$uibModal.open({
						backdrop: true,
						keyboard: true,
						windowClass: "modal loginDialog",
						backdropClick: true,
						templateUrl: '@views/uploadchoose.html'
					});
					if (e.dataTransfer) {
						droppedFiles = e.dataTransfer.files;
					} else {
						droppedFiles = e.target.files;
					}
					that.currentState = {
						type: type,
						scope: $scope,
						attrs: $attrs,
						droppedFiles: droppedFiles
					}
				}

				if (type == "temp") {
					if (!$attrs.uploadDirectory) {
						$attrs.uploadDirectory = 0;
					} else {
						var directory = $scope;
						angular.forEach($attrs.uploadDirectory.split("."), function (el, i) {
							directory = directory[el];
						});
					}

					if (e.length && e.length > 0) {
						droppedFiles = e;
					} else if (e.dataTransfer) {
						droppedFiles = e.dataTransfer.files;
					} else {
						droppedFiles = e.target.files;
						console.log(droppedFiles);
					}

					if (droppedFiles) {
						$.each(droppedFiles, function (i, file) {
							that.nameUpload[file.name] = {};
							that.nameUpload[file.name].value = 0;
						});
						$.each(droppedFiles, function (i, file) {
							that.uploadDrivePreparation(intrface, $attrs, file, directory, $group.groupId, type);

						});
					}

				}

				if (type == "drive") {
					if (!$attrs.uploadDirectory) {
						$attrs.uploadDirectory = 0;
					} else {
                        if (Number.isInteger($attrs.uploadDirectory)) {
                            directory = $attrs.uploadDirectory;
                        }
                        else {
                            var directory = $scope;
                            angular.forEach($attrs.uploadDirectory.split("."), function (el, i) {
                                directory = directory[el];
                            });
                        }
                    }
					if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
						var length = e.dataTransfer.items.length;
						for (var i = 0; i < length; i++) {
							var entry = e.dataTransfer.items[i].webkitGetAsEntry();
							that.traverseFileTree(intrface, $attrs, entry, directory, $group.groupId, type);
						}
					} else {
						if (e.length && e.length > 0) {
							droppedFiles = e;
						} else if (e.dataTransfer) {
							droppedFiles = e.dataTransfer.files;
						} else {
							droppedFiles = e.target.files;
							console.log(droppedFiles);
						}
						if (droppedFiles) {
							$.each(droppedFiles, function (i, file) {
								that.nameUpload[file.name] = {};
								that.nameUpload[file.name].value = 0;
							});
							$.each(droppedFiles, function (i, file) {
								that.uploadDrivePreparation(intrface, $attrs, file, directory, $group.groupId, type);

							});
						}
					}
				}

			}

		})
		.directive('uploadZone', function ($group, $upload, UnId) {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					var type = $attrs.uploadZone;
					var button = $attrs.uploadButton;
					var unid = "upload_drive_" + UnId.get();
					var chat = false;


					if (button) {
						var uplInput = jQuery("<input id='" + unid + "' type='file' style='position: absolute; top: -100000px;' multiple>");
						jQuery($element).parent().append(uplInput);
						jQuery(button).on('click', function () {
							jQuery(uplInput).click();
						});
					}

					$element.on('dragover dragenter dragleave drop', function (e) {
						e.preventDefault();
						e.stopPropagation();
					})
						.on('dragover dragenter', function () {
							$element.addClass('is-dragover');
						})
						.on('dragleave dragend drop', function () {
							$element.removeClass('is-dragover');
						});


					if (uplInput) {
						jQuery("#" + unid).change(function (e) {
							e = e.originalEvent;
							$upload.uploadFromButton(type, $scope, $attrs, e);
						});
					}

					$element.on('drop', function (e) {

						e = e.originalEvent;

						$upload.uploadFromButton(type, $scope, $attrs, e);


					});
				}
			}
		});

}
