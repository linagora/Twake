function serviceMsg(app) {

	return app
		.service('$msg', function ($calls, $rootScope, $state, $api, $http, $ws, $user, $msgParsing, $group, $window, $timeout, $uibModal) {

			$rootScope.cmsg = this;
			var newmessage = new Audio('/public/sounds/newmessage.wav');

			var that = this;

			//Correspond à ce qui est affiché en vue principale (pas flottant)
			this.current = {};
			this.floating = {}; //Floating discussions

			this.messages = {}; //Tous les messages sous forme d'arbre (le 'channel' est la clef de la discussion)
			this.messagesData = {};
			this.ids = {}; //Toutes les ids sous la forme d'arbre
			this.oldest = {}; //Stocke l'id du plus ancien message pour chaque channel sous la forme d'un arbre
			this.membersByDiscussionKey = {}; //Tous les messages sous forme d'arbre (le 'channel' est la clef de la discussion)
			this.contacts = {}; //Tous les contacts connus (mis à jour via les this.init() )
			this.contactsById = {}; //Tous les contacts connus (mis à jour via les this.init() )
			this.user_contacts = {}; //Amis de l'utilisateur
			this.contactsConnections = {}; //Tous les contacts connus (mis à jour via les this.init() )
			this.subscribedConnections = {};
			this.writing = {};
			this.subscribed = {};

			this.channels = {}; //Store channels info (to avoid reloading them on loaded)
			this.callbacks = {};

			/**
			 * DiscussionKey = idA_idB ou idChannel
			 */

			/* Verify if subscribed */
			this.isSubbed = function (id, type) {
				if (type == "channel") {
					return (that.subscribed[id])
				} else if (type == "user") {
					var uid = $user.data.uid;
					return that.subscribed[uid + "_" + id] || that.subscribed[id + "_" + uid];
				}
				return false;
			}

			/* Exit conversation */
			this.close = function (discussionKey) {
				if (that.floating[discussionKey]) {
					return;
				}
				that.subscribed[discussionKey] = false;
				$ws.unsubscribe(that.discussioRouteFromKey(discussionKey));
				that.remFloatBloc(discussionKey);
			}

			/* Subscribe to a channel / user and retreive firsts messages */
			this.init = function (discussionKey) {

				if (!discussionKey || discussionKey == 0) {
					return;
				}

				this.messagesData[discussionKey] = {};
				this.readNotifications(discussionKey);

				if (!that.messages[discussionKey]) {
					that.messages[discussionKey] = {};
					that.ids[discussionKey] = [];
					that.oldest[discussionKey] = -1;
				}

				that.messagesData[discussionKey].loading = true;
				that.messagesData[discussionKey].ready = false;

				if (that.subscribed[discussionKey]) {
					$ws.unsubscribe(that.discussioRouteFromKey(discussionKey));
				}
				that.subscribed[discussionKey] = true;

				//Subscribe to this channel / user
				$ws.subscribe(that.discussioRouteFromKey(discussionKey), function (uri, payload) {
					that.published(payload, discussionKey);
				});

				//Get first messages
				$ws.publish(that.discussioRouteFromKey(discussionKey), {
					type: "I" //Initialization
				});

			}

			this.getDiscussionObject = function (discussionKey) {

				if (!discussionKey) {
					return {};
				}

				var id = null;
				var type = null;
				var splited = discussionKey.split("_");
				var group = undefined;

				if (splited.length != 2) {
					type = "channel";
					var id = parseInt(discussionKey);
					group = $group.groupId;
				} else {
					type = "user";
					if (parseInt(splited[0]) == $user.data.uid) {
						id = splited[1];
					} else {
						id = splited[0];
					}
				}

				return {
					id: id,
					type: type,
					group: group,
					key: discussionKey
				};
			}

			this.defineCurrent = function (discussionKey) {

				if (!discussionKey) {
					return;
				}

				that.remFloatBloc(discussionKey);

				that.current = that.getDiscussionObject(discussionKey);

				if (that.current.group) {
					this.remAllFloatBloc(that.current.group);
				}

			}

			this.userToKey = function (user) {
				return Math.min(user, $user.data.uid) + "_" + Math.max(user, $user.data.uid);
			}

			this.addFloatBloc = function (discussionKey) {
				if (that.floating[discussionKey]) {
					return;
				}
				that.floating[discussionKey] = that.getDiscussionObject(discussionKey);

				setTimeout(function () {
				 $( ".floatBloc" ).draggable({ handle: ".floatBlocHeader", containment: "main", snap: true });
				}, 1000);

			}

			this.remFloatBloc = function (discussionKey) {
				that.floating[discussionKey] = undefined;
				delete that.floating[discussionKey];
				if (discussionKey != that.current.key && that.subscribed[discussionKey]) {
					that.close(discussionKey);
				}
			}

			this.expandFloatBloc = function (floatObject) {
				if (floatObject.type == "user") {
					$state.go("chat_user", {username: that.contactsById[floatObject.id].susername});
				} else {
					$state.go("messages", {id: floatObject.id, type: 'channel'});
				}
				this.remFloatBloc(floatObject.key);
			}

			this.remAllFloatBloc = function (group) {
				angular.forEach(that.floating, function (el) {
					if (el.group == group) {
						that.remFloatBloc(el.key);
					}
				});
			}

			/* Gere toutes les receptions depuis le websocket */
			this.published = function (data, discussionKey) {

				if (data.type == 'I') { //Initialization
					this.publishedInit(data, discussionKey);
				}
				if (data.type == 'M') { //Message
					this.publishedMessage(data, discussionKey);
					if (!that.contactsById[data.data.sid]) {
						that.updateUserContactsList();
					}
					if (data.data.sid != $user.data.uid && !$window.windowstate.focused) {
						$window.windowstate.tabmessage("Message from " + that.contactsById[data.data.sid].username);
						if (data.data.sid != $user.data.uid) {
							newmessage.currentTime = 0;
							newmessage.play();
						}
					}
				}
				if (data.type == 'E') { //Edition
					this.publishedEdit(data, discussionKey);
				}
				if (data.type == 'P') { //Epinglage
					this.publishedPin(data, discussionKey);
				}
				if (data.type == 'D') { //Deletion
					this.publishedDelete(data, discussionKey);
				}
				if (data.type == 'W') { //Deletion
					this.publishedWriting(data, discussionKey);
				}
				if (data.type == 'B') { //Ban
					alert("PAN !!!");
				}
				if (data.type == 'CALLS') { //Call informations
					$calls.update(discussionKey);
				}

				$rootScope.$apply();
				that.messagesData[discussionKey].loading = false;

			};

			this.publishedWriting = function (payload, discussionKey) {

				var that = this;

				if (!that.writing[discussionKey]) {
					that.writing[discussionKey] = {};
				}

				var newWriting = {};
				angular.forEach(that.writing[discussionKey], function (el, id) {
					if (el && (new Date()).getTime() - el < 5000) {
						newWriting[id] = el;
					}
				});
				that.writing[discussionKey] = newWriting;

				if (!payload.data) {
					return;
				}

				if (payload.data.id == $user.data.uid) {
					return;
				}

				if (payload.data.event) {
					that.writing[discussionKey][payload.data.id] = (new Date()).getTime();
				} else {
					that.writing[discussionKey][payload.data.id] = undefined;
					that.publishedWriting({}, discussionKey);
				}

				if (this.writingTimeout) {
					clearTimeout(this.writingTimeout);
				}
				this.writingTimeout = setTimeout(function () {
					that.publishedWriting({}, discussionKey);
				});

			}

			/* Reception d'un init */
			this.publishedInit = function (payload, discussionKey) {

				if (payload.data == undefined) {
					return;
				}

				that.updateUserContactsList();

				angular.forEach(payload.data.members, function (el) {
					that.contactsById[el.id] = el;
				});

				that.messagesData[discussionKey].ready = true;
				if (payload.data.messages.length < 30) {
					that.messagesData[discussionKey].nomore = true;
				}
				if (payload.data.messages.length == 0) {
					that.messagesData[discussionKey].nomessage = true;
				}

				if (payload.data.messages.length <= 0) {
					return;
				}

				if (!that.messages[discussionKey]) {
					that.messages[discussionKey] = {};
					that.ids[discussionKey] = [];
					that.oldest[discussionKey] = -1;
				}

				var newids = [];
				var oldest = -1;

				for (i = payload.data.messages.length - 1; i > -1; i--) {

					payload.data.messages[i].contentTemp = payload.data.messages[i].content;
					var message = payload.data.messages[i];
					if (that.messages[discussionKey][message.id] == undefined) {
						newids.push(message.id);
					}

					if (message.id < oldest || oldest == -1) {
						oldest = message.id;
					}
					that.messages[discussionKey][message.id] = message;

				}
				;

				that.ids[discussionKey] = that.ids[discussionKey].concat(newids);
				that.oldest[discussionKey] = oldest;

				$rootScope.$apply();

				if (that.callbacks[discussionKey]) {
					$timeout(that.callbacks[discussionKey], 0, false);
				}

			}

			/* Reception d'un message */
			this.publishedMessage = function (payload, discussionKey) {
				payload.data.content = $msgParsing.parseOnReceive(payload.data.content);

				payload.data.contentTemp = payload.data.content;

				if (payload.data.content == "" && payload.data.fileurl == "") {
					return;
				}

				that.messagesData[discussionKey].nomessage = false;

				this.readNotifications(discussionKey);

				if (!that.messages[discussionKey]) {
					that.messages[discussionKey] = {};
					that.ids[discussionKey] = [];
					that.oldest[discussionKey] = -1;
				}
				if (that.messages[discussionKey][payload.data.id] == undefined) {
					that.ids[discussionKey].push(payload.data.id);
				}
				if (payload.data.id < that.oldest[discussionKey] || that.oldest[discussionKey] == -1) {
					that.oldest[discussionKey] = payload.data.id;
				}
				that.messages[discussionKey][payload.data.id] = payload.data;

				if (that.callbacks[discussionKey]) {
					that.callbacks[discussionKey]();
				}

				that.writing[discussionKey][payload.data.sid] = undefined;
				that.publishedWriting({}, discussionKey);

			}

			/* Reception d'un edit */
			this.publishedEdit = function (payload, discussionKey) {
				payload.data.contentTemp = payload.data.content;
				if (that.messages[discussionKey][payload.data.id] != undefined) {
					that.messages[discussionKey][payload.data.id] = payload.data;
				}
			}

			/* Reception d'un pin */
			this.publishedPin = function (payload, discussionKey) {
				payload.data.contentTemp = payload.data.content;
				if (that.messages[discussionKey][payload.data.id] != undefined) {
					that.messages[discussionKey][payload.data.id].pinned = payload.data.pinned;
				}
			}

			/* Reception d'un delete */
			this.publishedDelete = function (payload, discussionKey) {
				delete that.messages[discussionKey][payload.data.id];
			}

			/* Get a route from a discussion key */
			this.discussioRouteFromKey = function (discussionKey) {
				var ids = discussionKey.split("_");
				if (ids.length >= 2) {
					return "discussion/" + discussionKey;
				} else {
					return "discussion/" + parseInt("0" + discussionKey);
				}
			};

			/* Get a contact by Id */
			this.getContact = function (id) {
				if (id == $user.data.uid) {
					return $user.data;
				} else if (that.contactsById[id]) {
					return that.contactsById[id];
				} else {
					return {
						username: "Unknown",
						susername: "unknown"
					}
				}
			}

			/* Get older messages */
			this.getOldMessages = function (discussionKey, callback) {

				$api.post('discussion/getOld', {
					"discussionKey": discussionKey,
					"oldest": that.oldest[discussionKey]
				}, function (res) {
					if (res.data.messages.length <= 0) {
						if (callback) {
							callback(res.data.messages.length == 50);
						}
						return;
					}

					if (!that.messages[discussionKey]) {
						that.messages[discussionKey] = {};
						that.ids[discussionKey] = [];
						that.oldest[discussionKey] = -1;
					}

					for (i = res.data.messages.length - 1; i > -1; i--) {
						var message = res.data.messages[i];
						if (that.messages[discussionKey][message.id] == undefined) {
							that.ids[discussionKey].push(message.id);
						}
						if (message.id < that.oldest[discussionKey] || that.oldest[discussionKey] == -1) {
							that.oldest[discussionKey] = message.id;
						}
						that.messages[discussionKey][message.id] = message;
					}
					;

					that.ids[discussionKey].sort();
					/*that.ids[discussionKey].reverse();
					 that.ids[discussionKey].splice(0, res.data.messages.length);*/

					if (callback) {
						$rootScope.$$postDigest(function () {
							callback(res.data.messages.length == 50);
						});
					}

				});
			}


			/* Subscribe to connections of an user */
			this.subscibeConnections = function (uid) {
				if (!uid) {
					return;
				}
				if (!this.subscribedConnections[uid]) {
					this.subscribedConnections[uid] = true;
					if (that.contactsById[uid]) {
						that.contactsConnections[uid] = that.contactsById[uid];
						that.contactsConnections[uid].connected = that.contactsById[uid].connected;
					}
					$ws.subscribe("connections/" + uid, function (uri, payload) {
						if (!that.contactsConnections[uid]) {
							that.contactsConnections[uid] = {};
						}
						that.contactsConnections[uid].connected = payload.connected;
						//$rootScope.$apply(); //We do not need reactivity for that
					});
				}
			};

			this.iamwriting = function (sw, discussionKey) {
				var data = {
					"type": "W",
					"data": {
						"event": sw
					}
				};
				$ws.publish(that.discussioRouteFromKey(discussionKey), data);
			}

			/* Send a message */
			this.send = function (content, discussionKey) {

				if (content.replace(/[ \n\r\t]/g, "") == "") {
					return;
				}

				var data = {
					"type": "M",
					"data": {
						"content": content
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);

			}

			/* Edit a message */
			this.like = function (messageId, type, discussionKey) {
				var data = {
					"type": "L",
					"data": {
						"id": messageId,
						"type": type
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);
			}

			/* Edit a message */
			this.edit = function (messageId, content, discussionKey) {

				if (content.replace(/[ \n\r\t]/g, "") == "") {
					this.delete(messageId, discussionKey);
					return;
				}

				var data = {
					"type": "E",
					"data": {
						"id": messageId,
						"content": content
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);

			}

			/* Delete a message */
			this.delete = function (messageId, discussionKey) {

				var data = {
					"type": "D",
					"data": {
						"id": messageId
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);

			}

			this.pin = function (messageId, discussionKey) {

				var data = {
					"type": "P",
					"data": {
						"id": messageId,
						"pinned": true
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);

			}

			this.unpin = function (messageId, discussionKey) {

				var data = {
					"type": "P",
					"data": {
						"id": messageId,
						"pinned": false
					}
				};

				$ws.publish(that.discussioRouteFromKey(discussionKey), data);

			}


			this.sendUploadMsg = function (idFile, discussionKey, fileIsInDrive) {
				var data = {
					"type": "U",
					"data": {
						"idFile": idFile,
						"fileIsInDrive": fileIsInDrive
					}
				};
				$ws.publish(that.discussioRouteFromKey(discussionKey), data);
			}


			this.readNotifications = function (discussionKey) {

			};

			this.updateUserContactsList = function () {
				that.contactsById[$user.data.uid] = $user.data;
				$api.post('users/account/contacts/getall', {"notall": true}, function (res) {
					that.user_contacts = res.results;
					angular.forEach(that.user_contacts, function (el) {
						that.contactsById[el.uid] = el;
					});
				});

				$group.onMembersReady(function () {
					angular.forEach($group.members, function (el) {
						that.contactsById[el.uid] = el;
					});
				});
			}

			this.displayInfos = function () {
				$uibModal.open({
					backdrop: true,
					keyboard: true,
					windowClass: "modal",
					backdropClick: true,
					templateUrl: '@views/messages/chat_infos.html'
				});
			}

			this.updateUserContactsList();

		})
		.run(function ($msg) {
		})
		;
}
