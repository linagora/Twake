function serviceNotification(app){

	return app

		.service('$notification',function($rootScope,$window,$api,$ws,ngToast,$sce,$location){

			var newnotification = new Audio('/public/sounds/newnotification.wav');

			this.data = {};
			$rootScope.notifications = this;
			var that = this;
			this.olddata = [];
			this.subscribed = false;

			this.suppressRecGroup = function(notif){
				app = (notif.fromType == "group") ? "base" : notif.fropApp;
				delete that.data["group"][notif.fromGroup][app];
				that.data["group"][notif.fromGroup].count-- ;
				if (that.data["group"][notif.fromGroup].count == 0){
					delete that.data["group"][notif.fromGroup];
					that.data["group"].count --;
					if (that.data["group"].count == 0){
						delete that.data["group"];
					}
				}
			}


			this.updateNotifs = function(notif){
				//Lecture des notifs classiques (pas sûr si ca devrait arriver, mais au cas où)
				if (notif.isClassic){
					angular.forEach(that.olddata, function(el){
						if(el.id==notif.id){
							el.isread = true;
						}
					});
					if(that.data){
						angular.forEach(that.data.list, function(el){
							if(el.id==notif.id){
								if (!el.isread){
									el.isread = true;
									that.data.listcount--;
								}
							}
						});
					}
				}

				if (notif.isInvisible){
					if (notif.fromType == "user" && that.data["msg"] && that.data["msg"][notif.fromUser]){
						delete that.data["msg"][notif.fromUser];
						that.data["msg"].count--;
						if (that.data["msg"].count == 0){
							delete that.data["msg"];
						}
					} else if (notif.fromType == "group" && that.data["group"] && that.data["group"][notif.fromGroup] && that.data["group"][notif.fromGroup]["base"]){
						that.suppressRecGroup(notif);
					} else if (notif.fromType == "app" && that.data["group"] && that.data["group"][notif.fromGroup] && that.data["group"][notif.fromGroup][notif.fromApp] && that.data["group"][notif.fromGroup][notif.fromApp][notif.route]){
						delete that.data["group"][notif.fromGroup][notif.fromApp][notif.route];
						that.data["group"][notif.fromGroup][notif.fromApp].count --;
						if (that.data["group"][notif.fromGroup][notif.fromApp].count == 0){
							that.suppressRecGroup(notif);
						}
					}
				}
			}


			this.receiveNotif = function (notif, callback, disableFast) {

				if (disableFast != true) {

					newnotification.currentTime = 0;
					newnotification.play();

					if ($window.electron && !$window.windowstate.focused && notif.tags.indexOf("fast") >= 0) {
						new Notification(notif.data.title, {
							title: notif.data.title,
							body: notif.data.text,
							icon: notif.data.img,
						});
					}

					if (notif.tags.indexOf("fast") >= 0 && '/' + notif.data.url !== $location.path()) {
						ngToast.create({
							className:'info',
							content: $sce.trustAsHtml("<div class='content' ng-click='href.go(\""+notif.data.url+"\")'><b>"+notif.data.title+"</b> <br> "+notif.data.text+"</div>"),
							dismissOnClick: true,
							compileContent: true
						});
					}

				}

				//Gestion de l'arbre de notifs
				if (notif.tags.indexOf("invisible")>=0){
					if (notif.fromType == "user" && !$rootScope.cmsg.isSubbed(notif.fromUser, "user")){

						// Never had a private notif
						if (!that.data["msg"]){
							that.data["msg"] = {};
							that.data["msg"]["count"] = 0;
						}

						// Never had a notif from this user
						if (!that.data["msg"][notif.fromUser]){
							that.data["msg"][notif.fromUser] = 1;
							that.data["msg"]["count"]++;

							//Already had at least one notif from this user
						} else {
							that.data["msg"][notif.fromUser]++;
						}
					} else if (notif.fromType == "group" || notif.fromType == "app"){

						// Never had a group notif
						if (!that.data["group"]){
							that.data["group"] = {};
							that.data["group"]["count"] = 0;
						}

						//Never had a notif from this group
						if (!that.data["group"][notif.fromGroup]){
							that.data["group"][notif.fromGroup] = {};
							that.data["group"][notif.fromGroup]["count"] = 0;
							that.data["group"]["count"] ++;
						}

						//Is this a group or an app notif
						if (notif.fromType == "group"){
							//Group
							//Never had a base group notif from this group before
							if (!that.data["group"][notif.fromGroup]["base"]){
								that.data["group"][notif.fromGroup]["base"] = 1;
								that.data["group"][notif.fromGroup]["count"]++;

								//Already had one
							} else {
								that.data["group"][notif.fromGroup]["base"]++;
							}


						} else if ( notif.route.match("channel") && $rootScope.cmsg.isSubbed(parseInt(notif.route.match(/\d+/)[0]),"channel")) {
							//Msg but we are already on this channel.
							if (that.data["group"][notif.fromGroup]["count"] == 0){
								delete(that.data["group"][notif.fromGroup]);
								that.data["group"]["count"]--;
							}
						}else{
							//App
							//Never had an app notif from this app in this group before
							if (!that.data["group"][notif.fromGroup][notif.fromApp]){
								that.data["group"][notif.fromGroup][notif.fromApp] = {};
								that.data["group"][notif.fromGroup][notif.fromApp]["count"] = 0;
								that.data["group"][notif.fromGroup]["count"]++;
							}

							//Never had an app notif from this route in this app in this group before
							if (!that.data["group"][notif.fromGroup][notif.fromApp][notif.route]){
								that.data["group"][notif.fromGroup][notif.fromApp][notif.route] = 1;
								that.data["group"][notif.fromGroup][notif.fromApp]["count"]++;
							} else {
								that.data["group"][notif.fromGroup][notif.fromApp][notif.route]++;
							}
						}

					} else if (notif.fromType == "null") {
						if (!that.data["null"]){
							that.data["null"] = {};
							that.data["null"]["count"] = 0;
						}
						if (!that.data["null"][notif.route]){
							that.data["null"][notif.route] = 1;
							that.data["null"]["count"] = Object.keys(that.data["null"]).length -1;
						} else {
							that.data["null"][notif.route]++;
						}
					}
				}



				// Gestion des notifs classiques
				if (notif.tags.indexOf("classic") >=0){
					if (that.data.listcount){
						that.data.listcount++;
					} else {
						that.data.listcount = 1;
					}
					that.data.list.push(notif.data);
				}

				$rootScope.$apply();

				if(callback){
					callback();
				}
			}

			this.init = function(callback){
				if(!$rootScope.cuser.data.uid){
					return;
				}

				if(that.data && that.data.notifications){
					var old_total = that.data.notifications.total;
				}

				if(this.subscribed == true){
					$ws.unsubscribe("notification/"+$rootScope.cuser.data.uid);
				}
				this.subscribed = true;
				$ws.subscribe("notification/"+$rootScope.cuser.data.uid, function(uri, payload){


					if(payload.type=="init"){
						that.data = {};
						that.data.list = [];
						payload.data.forEach(function(element){
							element.tags = [];
							if (element.isInvisible){
								element.tags.push("invisible");
							}
							if (element.isClassic){
								element.tags.push("classic");
							}
							that.receiveNotif(element, callback, true);
						});
					}


					if(payload.type=="notif"){
						notif = payload.data;
						that.receiveNotif(notif, callback);
					}



					if (payload.type == "updateContacts"){
						$rootScope.cmsg.updateUserContactsList();
					}
					if (payload.type == "updateGroups"){
						$rootScope.cuser.update();
						if($rootScope.groupUserCtrl){
							$rootScope.groupUserCtrl.init();
						}
					}
					if (payload.type == "updateNotifications"){
						that.updateNotifs(payload.data);
					}
					if (payload.type == "updateMessagesGroup"){
						$rootScope.menuLeftMessages.forceReload();
						if($rootScope.cmsg.current.type=='channel'){
							$rootScope.rightmenugroup.load();
						}
					}

				});
			};

			this.readNotif = function(id){
				$api.post("users/current/readnotifications", {notif: id}, function (res) {
					angular.forEach(that.olddata, function(el){
						if(el.id==id){
							el.isread = true;
						}
					});
					if(that.data){
						angular.forEach(that.data.list, function(el){
							if(el.id==id){
								if (!el.isread){
									el.isread = true;
									that.data.listcount--;
								}
							}
						});
					}
				});
			};

			this.readAllNotif = function(){
				$api.post("users/current/readallnotifications", {}, function (res) {
					angular.forEach(that.olddata, function(el){
						el.isread = true;
					});
					that.data.listcount = 0;
					angular.forEach(that.data.list, function(el){
						el.isread = true;
					});
				});
			};

			this.loadOld = function(callback, limit, offset){
				$api.post("users/current/getnotifications", {limit: limit, offset: offset}, function (res) {
					if(offset==0){
						that.olddata = [];
					}

					that.olddata = that.olddata.concat(res);

					if(callback){
						callback(res);
					}

				});
			}

		})
		;
}
