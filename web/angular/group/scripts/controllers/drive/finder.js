angular.module('twake')
	.config(function ($stateProvider) {
		$stateProvider
			.state('drive', {
				url: '/drive/',
				templateUrl: '@gviews/drive/finder.html',
				parent: 'group-general'
			})
	})
	.controller('finderCtrl', function ($api, $uibModal, $msg, $group, $confirm, $rootScope, $location, $window, $state) {


		var that = this;
		this.elements = [];
		this.tree = [];
		this.currentDirectory = undefined; //Root
		$rootScope.finder = this;
		this.selected = [];
		this.cut = [];
		this.copy = [];
		this.idtarget = -1;
		this.nameEdit = -1;
		that.dropable = false;
		this.isInTrash = false;
		this.loading = true;
		this.newName = "";
		that.x1 = -1;
		that.x2 = -1;
		that.y1 = -1;
		that.y2 = -1;
		this.rightClickMenuOptions = [
			["Créer fichier", function () {
				that.fileCreation();
			}],
			["Créer un dossier", function () {
				that.directoryCreation();
			}],
			["Coller", function () {
				that.paste();
			}]
		];

		this.rightClickFileMenuOptions = [
			["Aperçu", function ($itemScope) {
				that.overview($itemScope.element);
			}],
			["Selectionner", function ($itemScope) {
				if (that.selected.indexOf($itemScope.element.id) < 0) {
					that.toogleSelection($itemScope.element.id, false);
				}
			}],
			["Supprimer", function ($itemScope) {
				if (that.selected.indexOf($itemScope.element.id) < 0) {
					that.toogleSelection($itemScope.element.id, false);
				}
				that.trash();
			}],
			["Copier", function () {
				that.cop();
			}],
			["Télécharger", function ($itemScope) {
				that.download($itemScope.element.id);
			}],
			["Renommer", function ($itemScope) {
				that.nameEdit = $itemScope.element.id;
				that.newName = $itemScope.element.name;
				setTimeout(function () {
					jQuery(".input_name_drive_element").focus();
				}, 50);
			}]

		];

		this.rightClickDirectoryMenuOptions = [
			["Selectionner", function ($itemScope) {
				if (that.selected.indexOf($itemScope.element.id) < 0) {
					that.toogleSelection($itemScope.element.id, false);
				}
			}],
			["Supprimer", function ($itemScope) {
				if (that.selected.indexOf($itemScope.element.id) < 0) {
					that.toogleSelection($itemScope.element.id, false);
				}
				that.trash();
			}],
			["Copier", function () {
				that.cop();
			}],
			/*["Télécharger", function ($itemScope) {
				that.download($itemScope.element.id);
			 }],*/
			["Renommer", function ($itemScope) {
				that.nameEdit = $itemScope.element.id;
				that.newName = $itemScope.element.name;
				setTimeout(function () {
					jQuery(".input_name_drive_element").focus();
				}, 50);
			}]

		];

		this.getContextMenu = function (element) {
			var contextMenu = this.rightClickFileMenuOptions;
			if (element.isDirectory) {
				contextMenu = this.rightClickDirectoryMenuOptions;
			}

			if ($group.data.apps_filestypes[element.extension.toLowerCase()]) {
				var appli = $group.data.apps_filestypes[element.extension.toLowerCase()];
				var add = [[
					"Ouvrir avec " + appli.name, function ($itemScope) {
						$state.go("application", {
							name: appli.name,
							data: base64_encode(JSON.stringify({
								internal: appli.internal,
								url: appli.url,
								open: element
							}))
						});
					}
				]];
				contextMenu = add.concat(contextMenu);
			}

			return contextMenu;

		}

		this.fileCreation = function () {
			that.elements.push({id: 0, name: "Nouveau fichier", size: 0, isDirectory: false, new: true});
			that.newName = "Nouveau Fichier";
			that.nameEdit = 0;
			setTimeout(function () {
				jQuery(".input_name_drive_element").focus();
			}, 50);
		};
		this.directoryCreation = function () {
			that.elements.push({id: 0, name: "Nouveau dossier", size: 0, isDirectory: true, new: true});
			that.newName = "Nouveau Dossier";
			that.nameEdit = 0;
			setTimeout(function () {
				jQuery(".input_name_drive_element").focus();
			}, 50);
		};

		this.go = function (id) {
			if (id == undefined) {
				$location.hash("");
			}
			else {
				$location.hash(id);
			}
		}

		this.overview = function (file) {

			$rootScope.overviewIsLoading = true;
			$rootScope.overviewedFile = file;
			$rootScope.overview = $uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal overviewFinder",
				backdropClick: true,
				templateUrl: '@gviews/drive/overview.html'
			});
		};

		this.download = function (id) {
			open = function (verb, url, data, target) {
				var form = document.createElement("form");
				form.action = url;
				form.method = verb;
				form.target = target || "_self";
				if (data) {
					for (var key in data) {
						var input = document.createElement("textarea");
						input.name = key;
						input.value = typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
						form.appendChild(input);
					}
				}
				form.style.display = 'none';
				document.body.appendChild(form);
				form.submit();
			};
			open("POST", $api.getRealRoute("drive/download"), {groupId: $group.groupId, fileId: id});
		};


		this.timeoutgetelements = setTimeout("");
		this.timeoutgetelementsworking = false;
		this.getElements = function (dirId) {

			clearTimeout(this.timeoutgetelements);
			if (this.timeoutgetelementsworking) {
				this.timeoutgetelements = setTimeout(function () {
					that.getElements(dirId);
				}, 1000);
				return;
			}
			this.timeoutgetelements = setTimeout(function () {
				that.realGetElements(dirId);
			}, 100);
		};

		this.realGetElements = function (dirId) {
			this.loading = true;
			this.timeoutgetelementsworking = true;
			that.currentDirectory = dirId;
			that.selected = [];

			$api.post("/drive/list", {
				groupId: $group.groupId,
				parentId: that.currentDirectory,
				isInTrash: that.isInTrash
			}, function (res) {

				that.quotas = res.data.totalsize;
				that.allowed = res.data.maxspace;
				if (res.data.files) {
					that.elements = res.data.files;
				}
				else {
					that.elements = [];
				}

				if (that.isInTrash) {
					that.tree = [{id: undefined, name: "Corbeille"}];
				}
				else {
					that.tree = [{id: undefined, name: "Root"}];
				}
				that.tree = that.tree.concat(res.data.tree);
				if (that.tree[that.tree.length - 1].id) {
					$location.hash(that.tree[that.tree.length - 1].id);
				}
				else {
					$location.hash("");
				}

				that.timeoutgetelementsworking = false;

				that.loading = false;

			});
		}


		this.openModalCreationFile = function () {
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@gviews/drive/newfile.html',
			});
		};
		this.openModalCreationDirectory = function () {
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@gviews/drive/newdirectory.html',
			});
		};

		this.clickOnElement = function (id) {
			that.selected = id;
		}

		if ($location.hash() != null) {
			var id = $location.hash().split("/")[0];
			this.getElements(id);
		}
		else {
			this.getElements();
		}


		this.trash = function () {
			$confirm("Etes vous sûr de vouloir supprimer ces " + that.selected.length + " fichier(s) ?", function () {
				var compteur = 0;

				for (var i = 0; i < that.selected.length; i++) {
					$api.post("drive/delete", {
						groupId: $group.groupId,
						fileId: that.selected[i],
						force: false
					}, function (res) {
						compteur = compteur + 1;
						if (compteur == that.selected.length) {
							that.selected = [];
							that.getElements(that.currentDirectory);
						}
					})
				}
			}, function () {
				that.getElements(that.currentDirectory);
			});
		}


		this.startDrag = function (event, ui, objet, id) {
			that.dropable = true;
			if (that.selected.indexOf(id) < 0) {
				that.toogleSelection(id, true);
			}
			that.idtarget = id;
			that.draggabled = that.selected;
			$rootScope.$apply();
		}
		this.stopDrag = function () {
			that.dropable = false;
			that.draggabled = [];
			that.target = false;
			that.idtarget = -1;
			$rootScope.$apply();
		}

		this.drop = function (event, ui, objet, id) {
			if (objet.isDirectory != undefined && !objet.isDirectory) {
                return false;
			}
			that.dropable = false;
			var compteur = 0;
			for (var i = 0; i < that.selected.length; i++) {
				$api.post("drive/move", {
					groupId: $group.groupId,
					fileToMoveId: that.selected[i],
					newParentId: id,
					force: true
				}, function (res) {
					compteur = compteur + 1;
					if (compteur == that.selected.length) {
						that.selected = [];
						that.getElements(that.currentDirectory);

					}
				})
			}
		}


		$rootScope.$on('$locationChangeStart', function () {
			if ($location.hash() != null) {
				var id = $location.hash();
				$location.hash(id);

			}
			else {
				$location.hash("");
			}
		});

		/* add : si on garde les autres fichiers déjà selectionnés */
		this.toogleSelection = function (id, add) {
			if (add) {
				var x = that.selected.indexOf(id);
				if (x >= 0) {
					that.selected.splice(x, 1);
				}
				else {
					that.selected.push(parseInt(id));
				}
			}
			else {
				that.selected = [id];
			}
		}


		this.idToElement = function (idu) {
			for (var i = 0; i < that.elements.length; i++) {
				if (that.elements[i].id == idu) {
					return that.elements[i];
				}
			}
		}


		this.viewTrash = function () {
			that.isInTrash = !that.isInTrash;
			that.getElements(that.currentDirectory);
		}

		this.emptyTrash = function () {
			$confirm("Etes vous sûr de vouloir vider la corbeille ?", function () {
				$api.post("drive/trash/empty", {groupId: $group.groupId}, function (res) {
					that.isInTrash = false;
					//$location.hash("");
					that.getElements(that.currentDirectory);
				});
			});
		}

		this.restoreFromTrash = function () {
			if (that.selected.length <= 0) {
				$api.post("drive/trash/restore", {
					groupId: $group.groupId,
					fileId: this.currentDirectory
				}, function (res) {
					that.getElements(that.currentDirectory);

				});
			}
			else {
				for (var i = 0; i < that.selected.length; i++) {
					$api.post("drive/trash/restore", {
						groupId: $group.groupId,
						fileId: that.selected[i]
					}, function (res) {
						compteur = compteur + 1;
						if (compteur == that.selected.length) {
							that.selected = [];
							that.getElements(that.currentDirectory);

						}
					});
				}
			}
		}

		this.uploadOnSuccess = function (file) {
			that.getElements(that.currentDirectory);
		}

		this.onOver = function (event, ui, objet, id) {
			objet.style = "opacity:0.2;";
			$rootScope.$apply();
		}
		this.onOut = function (event, ui, objet, id) {
			objet.style = "";
			$rootScope.$apply();
		}


		this.onUploadSuccess = function (directory, idFile, isInDrive) {
			that.getElements(that.currentDirectory);
		}

		this.paste = function () {
			if (that.copy.length > 0) {
				var compteur = 0;
				for (var i = 0; i < that.copy.length; i++) {
					$api.post("drive/copy", {
						groupId: $group.groupId,
						fileToCopyId: that.copy[i],
						newParentId: that.currentDirectory
					}, function (res) {
						compteur = compteur + 1;
						if (compteur == that.copy.length) {
							that.getElements(that.currentDirectory);
						}
					});
				}
			}
			else if (that.cut.length > 0) {
				var compteur = 0;
				for (var i = 0; i < that.cut.length; i++) {
					$api.post("drive/move", {
						groupId: $group.groupId,
						fileToMoveId: that.cut[i],
						newParentId: that.currentDirectory,
						force: true
					}, function (res) {
						compteur = compteur + 1;
						if (compteur == that.cut.length) {
							that.selected = [];
							that.getElements(that.currentDirectory);
						}
					});
				}
			}
		}

		this.cop = function () {
			if (that.selected.length > 0) {
				that.cut = [];
				that.copy = that.selected;
			}
		}


		$rootScope.$on('$locationChangeStart', function () {
			if ($location.hash() != null) {
				var id = $location.hash();
				that.getElements(id);
			}
			else {
				that.getElements();
			}
		});


		jQuery(document).on("click", ".drive_element", function (event) {
			event.stopPropagation();
			var id = parseInt(jQuery(this).attr("data-id"));
			if (event.ctrlKey || event.shiftKey) {
				that.toogleSelection(id, true);
			}
			else {
				that.toogleSelection(id, false);
			}
			$rootScope.$apply();
		});

		jQuery(".page").mousedown(function (event) {
			if (event.which == 1) {
				if (!that.dropable) {
					if (that.x1 == -1) {
						that.x1 = event.pageX - jQuery(this).offset().left;
						that.y1 = event.pageY - jQuery(this).offset().top - 10 + jQuery(this).find(".scroller")[0].scrollTop;
						that.x2 = event.pageX - jQuery(this).offset().left;
						that.y2 = event.pageY - jQuery(this).offset().top - 10 + jQuery(this).find(".scroller")[0].scrollTop;
					}
				}
				jQuery(this).mousemove(function (event) {
					if (event.which == 1) {
						if (!that.dropable && that.x1 > 0) {
							that.x2 = event.pageX - jQuery(this).offset().left;
							that.y2 = event.pageY - jQuery(this).offset().top - 10 + jQuery(this).find(".scroller")[0].scrollTop;
							jQuery("#rectangle").css({
								top: Math.min(that.y1, that.y2) + 'px',
								left: Math.min(that.x1, that.x2) + 'px',
								width: Math.abs(that.x1 - that.x2) + "px",
								height: Math.abs(that.y1 - that.y2) + "px"
							});
						} else {
							that.x1 = -1;
						}
					}
				});
			}
		}).mouseup(function (event, ui) {
			if (event.which == 1) {
				if (!that.dropable) {
					jQuery(this).unbind('mousemove');
					var childs = jQuery(this).find(".drive_element");
					that.selected = [];
					if (that.x1 == -1) {
						that.selected = [];
					}
					else {
						for (var i = 0; i < childs.length; i++) {
							var child = childs[i];

							if (that.colision(jQuery(child).position().left, jQuery(child).width(), jQuery(child).position().top, jQuery(child).height(), Math.min(that.x1, that.x2), Math.max(that.x1, that.x2) - Math.min(that.x1, that.x2), Math.min(that.y1, that.y2), Math.max(that.y1, that.y2) - Math.min(that.y1, that.y2))) {
								that.selected.push(parseInt(jQuery(child).attr("data-id")));
							}
						}

					}
					that.x1 = -1;
					jQuery("#rectangle").css({top: "0px", left: "0px", width: "0px", height: "0px"});
					$rootScope.$apply();
				}
			}
		});


		that.colision = function (x1, w1, y1, h1, x2, w2, y2, h2) {
			/* (x1,y1) coint inferieur gauche */
			var selec = false;
			var maxG = Math.max(x1, x2);
			var minD = Math.min(x1 + w1, x2 + w2);
			var maxB = Math.max(y1, y2);
			var minH = Math.min(y1 + h2, y2 + h2);
			if (maxG < minD && maxB < minH) {
				return true;
			}
			else {
				return false;
			}
		}


		jQuery("#finder").on("dblclick", ".drive_element", function (event) {
			var id = parseInt(jQuery(this).attr("data-id"));
			var elem = that.idToElement(id);
			that.selected = [];
			if (elem.isDirectory) {
				$location.hash(id);
			}
			else {
				that.overview(elem);
			}
			$rootScope.$apply();
		});


		jQuery("#finder").on("keypress", document, function (event) {

			if (event.key == "c" && event.ctrlKey) {
				that.cop();
			}
			else if (event.key == "v" && event.ctrlKey) {
				that.paste();
			}
			else if (event.ctrlKey) {
				//console.log(event.key+","+event.ctrlKey);
			}

		});

		jQuery("#finder").on("focusout", ".input_name_drive_element", function (e) {
			that.name();
		});

		jQuery("#finder").on("keypress", ".input_name_drive_element", function (event) {
			if (event.which == 13 || event.keyCode == 27) { //enter
				$('.input_name_drive_element').blur(); // => focusOut
			}
		});

		this.name = function () {
			if (that.nameEdit >= 0) {
				var id = that.nameEdit;
				that.nameEdit = -1;
				var el = that.idToElement(id);
				if (el.new) {
					$api.post("drive/create", {
						parentId: that.currentDirectory,
						name: that.newName,
						groupId: $group.groupId,
						isDirectory: el.isDirectory
					}, function (res) {
						that.getElements(that.currentDirectory);
					});
				}
				else {
					$api.post("drive/rename", {
						groupId: $group.groupId,
						fileId: id,
						name: that.newName
					}, function (res) {
						that.getElements(that.currentDirectory);
						that.nameEdit = -1;
						that.newName = "";
					});
				}
			}
		}


	})
	.filter("miniName", function () {
		return function (str, length) {
			length = parseInt("0" + length);
			if (str.length > length) {
				str = str.substr(0, length - 15) + ' ... ' + str.substr(str.length - 10, str.length);
			}
			str.replace(/ /, "&nbps;");
			return str;
		};
	})
	.filter("filesize", function () {
		return function (str) {
			bytes = parseInt("0" + str);
			si = true;
			var thresh = si ? 1000 : 1024;
			if (Math.abs(bytes) < thresh) {
				return bytes + ' B';
			}
			var units = si
				? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
				: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
			var u = -1;
			do {
				bytes /= thresh;
				++u;
			} while (Math.abs(bytes) >= thresh && u < units.length - 1);
			return bytes.toFixed(1) + ' ' + units[u];
		};

	})
;
