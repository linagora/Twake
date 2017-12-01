angular.module('twake')
    .controller('savePopupCtrl', function($api, $group, $filePopup){

        var that = this;
        that.files = [];
		that.directories = [{id: 0, name: "Root"}];
		that.currentDirectoryId = $filePopup.directory;
		that.filename = $filePopup.filename;
        that.fileId = "";
        that.canOpenDirectory = $filePopup.canOpenDirectory;
        that.mode = $filePopup.popupMode;

        this.update = function() {
            $api.post("/drive/list",{groupId: $group.groupId, parentId: that.currentDirectoryId}, function(res){

                if (res.errors.length > 0) {
                    that.elements = [];
	                that.directories = [{id: 0, name: "Root"}];
                }
                else {
                    that.files = res.data.files;
	                that.directories = [{id: 0, name: "Root"}].concat(res.data.tree);
                }
            });
        };

        this.goTo = function(directoryId) {
            that.currentDirectoryId = directoryId;
	        if (that.mode == "open") {
		        that.filename = "";
	        }
            that.fileId = 0;
            this.update();
        };

        this.selectFile = function(file) {
            if (that.mode == "open") {
                if( that.canOpenDirectory || !file.isDirectory){
                    that.filename = file.name;
                    that.fileId = file.id;
                }
            }
        };
        this.openDirectory = function(file){
            if (file.isDirectory) {
                that.goTo(file.id);
            }
        }

        this.validate = function() {
	        if (that.mode === "open") {
		        $filePopup.returnResult({
			        type: "validate",
			        filename: that.filename,
			        fileId: that.fileId,
			        directoryId: that.currentDirectoryId
		        });
            }
            else {
		        $filePopup.returnResult({
			        type: "validate",
			        filename: that.filename,
			        directoryId: that.currentDirectoryId
		        });
            }
        };

        this.cancel = function() {
            $filePopup.returnResult({type: "cancel"});
        };

        this.goTo(0);
    });
