angular.module('twake')

	.controller('statusCtrl', function ($api, Upload, $scope, $rootScope, $user, $uibModal) {
		this.id = -1;
		this.isGroup = false;
		this.newStat = "";
		this.newPrivacy = "P";
		this.status = [];
		this.owner = {};
		this.ownerId = 0;
		this.isOpen = false;
		this.statusEdit = undefined;
		this.likeStatus = {};
		this.shareStatus = {};
		this.newComment = [];
		this.newCommentComment = "";
		this.comments = [];
		this.commentStatusId = -1;
		this.commentCommentStatusId = -1;
		this.commentEdit = {};
		this.groupsCanComment = [{name: "Twake", profilCss: ""}];
		this.entityCommenting = $user;
		this.loadFct = {};

		$rootScope.status = this;
		var that = this;


		that.getDiffString = function (diff) {
			if (diff.y > 0) {
				return diff.y + " ans";
			}
			else if (diff.m > 0) {
				return diff.m + " mois";
			}
			else if (diff.d > 0) {
				return diff.d + " jours";
			}
			else if (diff.h > 0) {
				return diff.h + " heures";
			}
			else if (diff.i > 0) {
				return diff.i + " minutes";
			}
			else if (diff.s > 0) {
				return diff.s + " secondes";
			}

		}


		this.changeEntityCommenting = function (entity) {
			if (entity) {
				that.entityCommenting = entity;
				console.log(entity);
			}
			else {
				that.entityCommenting = $user;
				console.log($user);
			}
		}


		this.loadAll = function () {
			$api.post("status/getrecap", {limit: 100, offset: 0}, function (res) {
				that.status = res.data;
				that.status.forEach(function (s) {
					s.when = that.getDiffString(s.dateDifference);
					if (s.sharedStatus != null) {
						s.sharedStatus.when = that.getDiffString(s.sharedStatus.dateDifference);
					}
				});

				that.status.forEach(function (e) {
					$api.post("status/getcontactslikes", {statusId: e.id}, function (res) {
						that.likeStatus[e.id] = res.data;
					});
				});
			});
		}

		this.changePrivacy = function (id) {
			this.newPrivacy = id;
		}

		this.create = function () {
			if (that.newStat != "") {
				$api.post("status/create", {
					groupId: that.entityCommenting.id,
					content: that.newStat,
					privacy: that.newPrivacy
				}, function () {
					that.newStat = "";
					that.loadFct();
				});
			}
			else {
				console.log("error");
			}
		}

		that.load = function () {
			$api.post("status/get", {
				ownerId: that.ownerId,
				ownerIsGroup: that.isGroup,
				limit: 50,
				offset: 0
			}, function (res) {
				that.status = res.data;
				that.status.forEach(function (s) {
					s.when = that.getDiffString(s.dateDifference);
					if (s.sharedStatus != null) {
						s.sharedStatus.when = that.getDiffString(s.sharedStatus.dateDifference);
					}
				});
				that.owner = res.ownerDetails;

				that.status.forEach(function (e) {
					$api.post("status/getcontactslikes", {statusId: e.id}, function (res) {
						that.likeStatus[e.id] = res.data;
					});
				});
			});
			$api.post("status/getpostgroups", {}, function (res) {
				that.groupsCanComment = res.data;
			});
		}

		that.like = function (id) {
			$api.post("status/like", {statusId: id}, function () {
				that.loadFct();
			});
		}

		that.delete = function (id) {
			$api.post("status/delete", {statusId: id}, function () {
				that.loadFct();
			})
		}

		that.edit = function () {
			$api.post("status/edit", {
				statusId: this.statusEdit.id,
				content: this.statusEdit.content,
				privacy: this.statusEdit.privacy
			}, function () {
				that.loadFct();
			});
		}

		that.setId = function (id, bool) {
			that.ownerId = id;
			that.isGroup = bool;
			if (bool) {
				$api.post("group/get", {groupId: id}, function (res) {
					that.entityCommenting = res.data;
					that.entityCommenting.id = id;
				})
			}
			that.loadFct();
		}

		that.deleteComment = function (stat, comment, idComment) {
			$api.post("status/comment/delete", {commentId: comment}, function (res) {
				that.loadComment(stat, comment);
			});
		}

		that.hasRightToEddit = function (id) {
			var retour = false;
			that.groupsCanComment.forEach(function (g) {
				if (g.id == id) {
					retour = true;
				}
			});

			return retour;
		}


		that.loadComment = function (idStatus, idComment) {
			$api.post("status/comment/get", {
				messageId: idStatus,
				messageIsComment: false,
				limit: 30,
				offset: 0
			}, function (res) {
				that.commentStatusId = idStatus;
				that.commentCommentStatusId = idComment;
				that.comments = res.data;
				that.comments.forEach(function (s) {
					s.when = that.getDiffString(s.dateDifference);
					s.commentsDetails = s.commentsDetails;
					s.commentsDetails.forEach(function (c) {
						c.when = that.getDiffString(c.dateDifference);
					});
				});
				jQuery(".dropDownComment").hide();
				$rootScope.$apply();
			});
		}

		that.updateComment = function (idStat, idComment, comment) {
			$api.post("status/comment/edit", {commentId: comment.id, content: comment.content}, function (res) {
				that.loadComment(idStat, idComment);
			});
		}


		that.comment = function (stat, bool) {
			//bool = je veux le focus sur mon futur commentaire
			that.commentStatusId = stat.id;
			$api.post("status/comment/get", {
				messageId: stat.id,
				messageIsComment: false,
				limit: 30,
				offset: 0
			}, function (res) {
				that.comments = res.data;
				that.comments.forEach(function (s) {
					s.when = that.getDiffString(s.dateDifference);
					s.commentsDetails = s.commentsDetails;
					s.commentsDetails.forEach(function (c) {
						c.when = that.getDiffString(c.dateDifference);
					});
				});
			});
			if (bool) {
				setTimeout(function () {
					jQuery("#newComment" + stat.id).focus();
				}, 50);
			}
		}

		this.commentComment = function (comment, bool) {
			//bool = je veux le focus sur mon futur commentaire
			that.commentCommentStatusId = comment.id;
			if (bool) {
				//setTimeout(function(){jQuery("#newComment"+stat.id).focus();}, 50);
			}
		}

		jQuery(document).on("keypress", ".textareaCommentComment", function (event) {
			if ((event.which == 13 && !event.shiftKey && !event.ctrlKey ) || event.keyCode == 27) { //enter
				event.preventDefault();
				var idstat = parseInt(jQuery(this).attr("data-id-status"));
				var idcomment = parseInt(jQuery(this).attr("data-id-comment-status"));
				$api.post("status/comment/comment", {
					groupId: that.entityCommenting.id,
					commentId: idcomment,
					content: that.newCommentComment
				}, function (res) {
					if (res.errors.length == 0) {
						that.loadComment(idstat, idcomment);
						jQuery("#newCommentComment" + idcomment).blur();
					}
				});
			}
		});

		jQuery(document).on("keypress", ".textareaComment", function (event) {
			if ((event.which == 13 && !event.shiftKey && !event.ctrlKey ) || event.keyCode == 27) { //enter
				event.preventDefault();
				var id = parseInt(jQuery(this).attr("data-id-status"));
				$api.post("status/comment/create", {
					groupId: that.entityCommenting.id,
					statusId: id,
					content: that.newComment[id]
				}, function (res) {
					if (res.errors.length == 0) {
						that.newComment[id] = "";
						that.loadComment(id);
						jQuery("#newComment" + id).blur();
					}
				});
			}
		});

		jQuery(document).on("mouseenter", ".commentBlock", function () {
			jQuery(".dropDownComment").hide();
			jQuery(this).children(".commentBlock1").children(".commentBlock2").find(".dropDownComment").show();
		});
		jQuery(document).on("mouseleave", ".commentBlock", function () {
			jQuery(this).children(".commentBlock1").children(".commentBlock2").find(".dropDownComment").hide();
		});


		// jQuery(".commentBlock").on( {mouseenter: function(){
		//     console.log("hover");
		//     that.idHover = parseInt(jQuery(this).attr("data-id-comment"));
		//     $rootScope.$apply();
		// },mouseleave: function () {
		//     console.log("left");
		// }});


		that.share = function (st) {
			that.shareStatus = st;
			$uibModal.open({
				backdrop: true,
				keyboard: true,
				windowClass: "modal loginDialog",
				backdropClick: true,
				templateUrl: '@views/share_popup.html',
			});
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
	});
