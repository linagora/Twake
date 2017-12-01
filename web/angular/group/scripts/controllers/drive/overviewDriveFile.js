angular.module('twake')
	.controller('overviewDriveFileCtrl', function ($api, $uibModal, $msg, $group, $confirm, $rootScope, $location, $window, $sce, $href, $state) {

        var that = this;
        this.overview = $rootScope.overview;
        this.file = $rootScope.overviewedFile;
        this.fileType = "";
		this.fileUrl = $api.getRealRoute('/drive/download?groupId=' + $group.groupId + '&fileId=' + that.file.id + '&download=0');
        this.fileContent = "";
        this.fileExtension = "";
        this.fileSize = "";
        this.fileLineCount = 0;

        this.download = function() {
            $href.goInNewTab(that.fileUrl.substr(0, that.fileUrl.length - '&download=0'.length));
        };

		this.open = function () {
			var appli = $group.data.apps_filestypes[this.file.extension.toLowerCase()];
			$state.go("application", {
				name: appli.name,
				data: base64_encode(JSON.stringify({
					internal: appli.internal,
					url: appli.url,
					open: that.file
				}))
			});
			$rootScope.overview.close();
		}

        var extensions = {
            image: ["png", "jpg", "jpeg", "gif", "tiff"],
            text: ["txt"],
	        code: ["php", "js", "html", "css", "c", "py", "sh", "lock", "md", "sql"],
	        iframe: ["pdf", "svg", "wav", "mp3", "midi", "mid", "aac", "mp4", "avi", "webm", "mpeg"]
        };

        var filenameParts = that.file.name.split(".");

        if (filenameParts.length > 1) {

            that.fileExtension = filenameParts[filenameParts.length - 1].toLowerCase();
	        that.fileType = "none";

	        angular.forEach(extensions, function (el, key) {
		        if (extensions[key].indexOf(that.fileExtension) > -1) {
			        that.fileType = key;
		        }
	        });

        }

		if (that.file.size > 10 * 1000 * 1000) {
            that.fileType = "big";
        }
        if (that.fileType === "text" || that.fileType === "code" || that.fileType === "") {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", this.fileUrl, false);
            xmlHttp.send(null);
            that.fileContent = xmlHttp.responseText;

            if (that.fileType !== "") {
                that.fileLineCount = that.fileContent.split("\n").length;
            }

            if (that.fileType === "text") {
                that.fileContent = that.fileContent.replace(/(\n|\r\n)/g, "<br>");
                that.fileContent = that.fileContent.replace(/(\t)/g, "    ");
                that.fileContent = that.fileContent.replace(new RegExp(" ", "g"), "&nbsp;");
            }
        }

        if (that.file.size) {
            if (that.file.size < 1000) {
                that.fileSize = that.file.size + " octets";
            }
            else if (that.file.size < 1000 * 1000) {
                that.fileSize = parseInt(that.file.size / 1000) + " Ko";
            }
            else if (that.file.size < 1000 * 1000 * 1000) {
                that.fileSize = parseInt(that.file.size / 1000 / 1000) + " Mo";
            }
            else {
                that.fileSize = parseInt(that.file.size / 1000 / 1000 / 1000) + " Go";
            }
        }

        $rootScope.overviewIsLoading = false;
    });
