function chatCtrlGlobal(app) {
	return app.controller('chatCtrl', function ($rootScope, $scope, $calls, $msg, $api, $window, $stateParams, $scope, $user, $group, $location, $uibModal, $filter) {

		var that = this;
		var scroll_notop = false;

		this.messages = {};
		this.ids = [];
		this.ready = false;
		this.loading = true;
		this.isAtBottomEdge = true;
		this.discussionZoneHeight = 0;
		this.unreadMessages = false;
		this.working = false;
		this.didFirstScroll = false;
		this.userScroll = false;
		$scope.inAutoComplete = false;
		this.input = "";
		this.loading = true;
		this.inputCommandMode = false;
		this.search = false;
		this.searchTimeout = setTimeout("");
		this.searchData = {
			"pinned": false,
			"files": false
		};
		this.searchMessages = [];
		this.type = $stateParams.type;
		this.canPin = true;
		this.includeEdit = {};
		this.includeLikeMenu = {};
		this.writingTimeout = setTimeout("");
		this.writingState = false;


		$group.onReady(function () { // au cas où le service $groupe est déjà chargé
			that.canPin = $group.getRight("Messages:general:pin");
		});
		$group.onUpdate(function () {
			that.canPin = $group.getRight("Messages:general:pin");
		});

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


		this.initScroll = function () {
			$msg.callbacks[that.discussionKey] = function () {
				setTimeout(function () {
					that.onNewMessage();
				}, 100);
			};
		};

		this.init = function () {

			this.input = $window.localStorage.getItem('messages_' + this.discussionKey);
			if (!this.input) {
				this.input = "";
			}
			this.ready = true;
			this.loading = false;

			if (this.discussionKey.split("_").length > 1) {
				var split = this.discussionKey.split("_");
				this.discussionId = (split[0] != $user.data.uid) ? split[0] : split[1];
			} else {
				this.discussionId = this.discussionKey;
			}

			$msg.init(this.discussionKey);
			$calls.update(this.discussionKey);

			if (this.discussionKey == $calls.currentCallKey) {
				$calls.minify = false;
			}

			this.messages = $msg.messages[this.discussionKey];
			this.ids = $msg.ids[this.discussionKey];

		};

		this.contextMenu = function (msg) {
			var that = this;

			var base = [];

			if (msg.fileurl == '') {
				base.push([
					"Citer", function () {
						that.quote(msg);
					}
				]);
				base.push(null);
			}

			if (msg.fileurl != '' && msg.fileurl.substr(0, 11) == '/ajax/drive') {
				base.push([
					"Go to Drive", function () {
						$location.url('/group/' + $group.groupId + '/drive/');
					}
				]);
			}

			if ((that.type != 'channel' || (that.type == 'channel' && that.canPin)) && msg.pinned) {
				base.push([
					"Unpin", function () {
						that.unpin(msg);
					}
				]);
			}

			if ((that.type != 'channel' || (that.type == 'channel' && that.canPin)) && !msg.pinned) {
				base.push([
					"Pin", function () {
						that.pin(msg);
					}
				]);
			}

			if (msg.sid == $user.data.uid && msg.fileurl == '') {
				base.push([
					"Edit", function () {
						that.includeEdit[msg.id] = '@views/messages/edit.html';
						that.edit = msg.id;
						that.focus(msg);
						setTimeout(function () {
							that.focus(msg);
						}, 500);
					}
				]);
			}

			if (msg.sid == $user.data.uid) {
				base.push([
					"Delete", function () {
						that.delete(msg);
					}
				]);
			}

			return base;

		}

		this.goToDrive = function () {

			$api.post("drive/create", {name: 'messagerie', groupId: $group.groupId, isDirectory: true}, function (res) {
				if (res.data.fileId !== undefined) {
					var messagerieDirectoryId = res.data.fileId;
				}
			});
		};

		//If defined in route (main message template)
		if ($stateParams.type && !$scope.discussionKey) {

			$scope.$on('$stateChangeStart', function (next, current) {
				$msg.close(that.discussionKey);
			});

			if ($stateParams.type == "channel") {
				this.discussionKey = $stateParams.id;
			}
			if ($stateParams.type == "user") {
				this.discussionKey = Math.min($stateParams.id, $user.data.uid) + "_" + Math.max($stateParams.id, $user.data.uid);
			}

			$msg.defineCurrent(this.discussionKey);
			that.initScroll();
			that.init();

		} else //If private messages
		if ($stateParams.username && !$scope.discussionKey) {

			$api.post("/users/get", {username: $stateParams.username}, function (result) {

				if (result.errors.length === 0) {

					if ($scope.chatusermenu) {
						$scope.chatusermenu.data = result.data;
					}

					that.discussionKey = Math.min(result.data.idUser, $user.data.uid) + "_" + Math.max(result.data.idUser, $user.data.uid);
					$msg.defineCurrent(this.discussionKey);
					that.initScroll();
					that.init();
				}
			});

		} else {
			this.discussionKey = $scope.discussionKey;
			that.initScroll();
			that.init();
		}

		/* Manage scroll */

		this.scrollToBottom = function () {

			that.userScroll = false;
			that.working = true;

			var scroller = jQuery($scope.baseElement)[0];

			var afterScroll = function () {
				setTimeout(that.onNewMessage, 200);
				that.working = false;
				that.isAtBottomEdge = true;
				that.userScroll = true;
			};

			//For js scroller
			$(scroller).mCustomScrollbar("stop");
			$(scroller).mCustomScrollbar("scrollTo", "bottom", {
				scrollInertia: 200,
				callbacks: afterScroll
			});

			//For classic scroller
			angular.element(scroller).stop();
			angular.element(scroller)
				.animate({scrollTop: (angular.element(scroller)[0].scrollHeight - angular.element(scroller).height() + 100) + "px"},
				200,
				undefined,
				afterScroll
			);

			that.unreadMessages = false;

		};


		this.onNewMessage = function () {
			if (that.working) {
				return;
			}

			var oldDiscussionZoneLastId = that.discussionZoneLastId;
			var oldIsAtBottomEdge = that.isAtBottomEdge;

			var scroller = jQuery($scope.baseElement)[0];
			that.isAtBottomEdge = (angular.element(scroller)[0].scrollHeight - angular.element(scroller).height() - scroller.scrollTop) < 200;
			that.discussionZoneLastId = angular.element(scroller).find(".message").last().data('id');


			if ((oldIsAtBottomEdge && oldDiscussionZoneLastId !== that.discussionZoneLastId) || !that.didFirstScroll) {
				that.scrollToBottom();
			}
			else if (oldDiscussionZoneLastId !== that.discussionZoneLastId) {
				if (that.didFirstScroll) {
					that.unreadMessages = true;
				}
			}
			else if (that.isAtBottomEdge) {
				that.unreadMessages = false;
			}

		};


		$scope.runScroll = function () {

			var onscroll = function (y, yMax) {

				if (that.userScroll) {

					that.didFirstScroll = true;

					if (y <= 0) { //Scroll top
						if (scroll_notop) {
							scroll_notop = false;
							that.getOldMessages();
						}
					} else if (y >= yMax) { //Scroll to bottom
						that.unreadMessages = false;
						that.isAtBottomEdge = true;
					} else {

						if (y != 0) {
							scroll_notop = true;
						}

						//All
						if (that.userScroll) {
							that.onNewMessage();
						} else {
							that.scrollToBottom();
						}
					}
				}
			};

			$($scope.baseElement).on('scroll', function (event) {
				if (this.mcs) {
					var y = -this.mcs.top;
					var yMax = y / (this.mcs.topPct / 100) - $(this).innerHeight();
				} else {
					var y = $(event.target).scrollTop();
					var yMax = $(event.target)[0].scrollHeight - $(event.target).innerHeight();
				}
				onscroll(y, yMax);
			});

		}


		this.onUploadSuccess = function (directory, idFile, isInDrive) {
			console.log("on success " + idFile);
			$msg.sendUploadMsg(idFile, that.discussionKey, isInDrive);
		}
		this.uploadOnError = function () {
			console.log("aie");
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: 'angular/group/views/templates/errorUpload.html',
			});
		}

		this.getOldMessages = function () {

			$msg.messagesData[that.discussionKey].loading = true;

			var scroller = jQuery($scope.baseElement)[0];
			//var oldHeight = jQuery(scroller)[0].scrollHeight;
			//var currentScrollTop = jQuery(scroller).scrollTop();

			$msg.getOldMessages(that.discussionKey, function (hasmore) {
				if (!hasmore) {
					$msg.messagesData[that.discussionKey].nomore = true;
				}
				/*setTimeout(function () {
					var newHeight = jQuery(scroller)[0].scrollHeight;

					jQuery(scroller).scrollTop(currentScrollTop + (newHeight - oldHeight));
				 }, 0);*/

				$msg.messagesData[that.discussionKey].loading = false;

			});
		}


		this.writing = function (stop) {
			if (stop) {
				$msg.iamwriting(false, that.discussionKey);
				that.writingState = false;
				return;
			}
			if (!this.writingState) {
				$msg.iamwriting(true, that.discussionKey);
				that.writingState = true;

				clearTimeout(this.writingTimeout);
				this.writingTimeout = setTimeout(function () {
					that.writing(true);
				}, 7000);

			}
		};

		this.delete = function (message) {
			$msg.delete(message.id, that.discussionKey);
		};
		this.pin = function (message) {
			$msg.pin(message.id, that.discussionKey);
		};
		this.unpin = function (message) {
			$msg.unpin(message.id, that.discussionKey);
		};

		this.doEdit = function (message) {
			$msg.edit(message.id, message.contentTemp, that.discussionKey);
			that.edit = 0;
		};
		this.cancelEdit = function (messages) {
			that.edit = 0;
			that.messages[messages.id].contentTemp = that.messages[messages.id].content;
		}
		this.quote = function (message, date) {
			var insert = "quote{" + $msg.getContact(message.sid).username + "}{ " + message.content + " }";
			that.insertAtCursor($scope.mainInput, insert);
			this.input = jQuery($scope.mainInput).val(); //Update angular value
			that.focusMainInput();
		};

		this.focus = function (message) {
			setTimeout(function () {
				jQuery(".m_" + message.id).find('textarea').focus()
			}, 0);
		};

		this.focusMainInput = function () {
			setTimeout(function () {
				jQuery($scope.mainInput).focus()
			}, 0);
		};


		/* Search messages */
		this.openSearch = function () {
			that.searchData = {
				"pinned": false,
				"files": false,
				"content": "",
				"before": "",
				"after": "",
				"user": ""
			}
			that.search = true;
			that.searchMessage();
		}
		this.searchDelayed = function () {
			that.searchLoading = true;
			clearTimeout(that.searchTimeout);
			that.searchTimeout = setTimeout(function () {
				that.searchMessage();
			}, 500);
		}
		this.searchMessage = function () {
			if (this.searchWorking) {
				this.searchDelayed();
				return;
			}
			this.searchWorking = true;
			var post = {channelId: that.discussionKey, model: that.searchData};
			$api.post('discussion/channel/findMessage', post, function (res) {
				that.searchMessages = res.data;
				if (res.data.length == 0) {
					that.searchNoResult = true;
				} else {
					that.searchNoResult = false;
				}
				that.searchWorking = false;
				that.searchLoading = false;
			})
		}


		this.contentChange = function (content) {

			//Main input only
			if (content != undefined) {
				$window.localStorage.setItem('messages_' + this.discussionKey, content);
				if (content.length == 0 && event.keyCode == 92 || content[0] == '\\') {
					that.inputCommandMode = true;
				} else {
					that.inputCommandMode = false;
				}
			}

		}

		this.send = function (content) {
			$msg.send(content, that.discussionKey);
			$window.localStorage.setItem('messages_' + this.discussionKey, "");
			this.input = "";
			this.isAtBottomEdge = true;
		}

		this.keyPressed = function (event, content, message) {

			if ($window.ismobile && event.keyCode == 13) {
				event.shiftKey = true;
			}

			if (!$scope.inAutoComplete) {
				if (!message) {//Not in edition mode
					if (!event.shiftKey && event.keyCode == 13) {
						that.send(content);
						return;
					}
					else if (event.keyCode == 38 && content == "") {
						var toedit = jQuery($scope.baseElement).find(".message.mine").last();
						if (toedit.length > 0) {
							that.edit = parseInt(jQuery(toedit).attr("data-id"));
							that.includeEdit[that.edit] = '@views/messages/edit.html';
							that.focus({id: that.edit});
							that.scrollToBottom();
						}
						return;
					}

				} else {//Edition mode
					if (event.keyCode == 27) {
						this.cancelEdit(message);
						return;
					}
					if (!event.shiftKey && event.keyCode == 13) {
						this.doEdit(message);
						return;
					}
				}
				if (event.keyCode == 9) {
					this.insertAtCursor(event.target, "    ");
				}
			}

			that.writing();

		}
		this.insertAtCursor = function (myField, myValue) {

			myField = jQuery(myField)[0];

			//IE support
			if (document.selection) {
				myField.focus();
				sel = document.selection.createRange();
				sel.text = myValue;
			}
			//MOZILLA and others
			else if (myField.selectionStart || myField.selectionStart == '0') {
				var startPos = myField.selectionStart;
				var endPos = myField.selectionEnd;
				myField.value = myField.value.substring(0, startPos)
				+ myValue
				+ myField.value.substring(endPos, myField.value.length);
			} else {
				myField.value += myValue;
			}
		}

	})
		.filter("dateStyle", function ($filter) {
			return function (ts) {
				function diffTs(tmp) {
					var diff = {}

					tmp = Math.floor(tmp / 1000);             // Nombre de secondes entre les 2 dates
					diff.s = tmp % 60;                    // Extraction du nombre de secondes

					tmp = Math.floor((tmp - diff.s) / 60);    // Nombre de minutes (partie entière)
					diff.i = tmp % 60;                    // Extraction du nombre de minutes

					tmp = Math.floor((tmp - diff.i) / 60);    // Nombre d'heures (entières)
					diff.h = tmp % 24;                   // Extraction du nombre d'heures

					tmp = Math.floor((tmp - diff.h) / 24);   // Nombre de jours restants
					diff.d = tmp;

					return diff;
				}

				function getDiffString(ts) {
					var tmp = new Date().getTime() - ts;
					if (tmp > 1000 * 60 * 60 * 24 * 10) {
						return $filter('date')(ts, "Le dd/MM à HH:mm");
					}
					else {
						var diff = diffTs(tmp);
						if (diff.d > 0) {
							return "il y a " + diff.d + " jours";
						}
						else if (diff.h > 0) {
							return "il y a " + diff.h + " heures";
						}
						else if (diff.i > 0) {
							return "il y a " + diff.i + " minutes";
						}
						else if (diff.s > 0) {
							return "il y a " + diff.s + " secondes";
						}
					}
				}

				return getDiffString(ts);
			}
		})
		.directive("messageListContainer", function () {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					$scope.baseElement = $element;
					$scope.runScroll();
				}
			}
		})

		.directive("messageMainInput", function () {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					$scope.mainInput = $element;
				}
			}
		})

		.directive("pseudoAutocomplete", function ($msg, $sce, $compile) {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {

					var autocompleteMode = /\B@([\-+\w]+)$/;
					if ($attrs.userOnly) {
						autocompleteMode = /([\-+\w]*)$/;
					}

					$($element).textcomplete([{
						match: autocompleteMode,
						search: function (term, callback) {

							var result = [];
							term = term.toLowerCase();

							angular.forEach($msg.contactsById, function (el, i) {
								if (el.susername && el.susername.indexOf(term) > -1) {
									result.push(el.id);
								}
							});

							callback(result);

						},
						template: function (uid) {
							return "<div style=\"" + $msg.contactsById[uid].cssuserimage + "\" class='pseudo-autocomplete default_user_image'></div>" + '@' + $msg.contactsById[uid].susername;
						},
						replace: function (uid) {
							return '@' + $msg.contactsById[uid].susername;
						},
						index: 1,
						maxCount: 10,
						placement: 'top'
					}
					], {
						placement: 'top'
					}).on({
						'textComplete:select': function (e, uid, s) {
							if ($attrs.userOnly) {
								jQuery($element).val('@' + $msg.contactsById[uid].susername);
							}
							jQuery($element).trigger("change");
						},
						'textComplete:show': function (e) {
							$scope.inAutoComplete = true;
						},
						'textComplete:hide': function (e) {
							$scope.inAutoComplete = false;
						}
					});
				}
			}
		})

};
