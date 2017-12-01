function serviceCalls(app) {

	return app
		.service('$calls', function ($rootScope, $api, $ws, $user, $stateParams, $state, $window, $autoAttachManager) {

			var exitcall = new Audio('/public/sounds/exitcall.wav');
			var iexitcall = new Audio('/public/sounds/iexitcall.wav');
			var joincall = new Audio('/public/sounds/joincall.wav');

			var that = this;
			$window.calls = this;
			$rootScope.calls = this;

			this.jitsi_loaded = false;
			this.jitsiApi = null;
			this.currentCallKey = null;
			this.currentCallUrl = null;
			this.states = {}; //State of calls
			this.members = {}; //members by discussionKey

			this.peersOptions = {};
			this.options = {}; //State of calls
			this.available = {};
			this.minify = false;

			this.goToPage = function () {
				$state.go(that.currentCallUrl.name, that.currentCallUrl.options);
			}

			if (!that.jitsi_loaded) {
				var fileref = document.createElement('script');
				fileref.onload = function () {
					that.jitsi_loaded = true;
				};
				fileref.setAttribute("type", "text/javascript");
				fileref.setAttribute("src", "/angular/libs/jitsi-meet-api.js");
				document.getElementsByTagName("head")[0].appendChild(fileref);
			}

			//Manage action on button click
			this.click = function (discussionKey) {

				if (this.states[discussionKey] == "loading") {
					return;
				}

				var currentState = this.states[discussionKey];
				this.states[discussionKey] = "loading";

				if (!currentState || currentState == "" || currentState == "started") {
					this.join(discussionKey);
				}

				if (currentState == "joined") {
					this.exit(discussionKey);
				}

			};

			/* Exit a call */
			this.exit = function (discussionKey) {

				this.realExit();

				that.states[discussionKey] = "started";

				$api.post("calls/exit", {discussionKey: discussionKey}, function (res) {

					if (res.errors.length == 0) {
						that.update(discussionKey);
						iexitcall.play();
					}
					that.states[discussionKey] = "";

				});

			}

			/* Join a call */
			this.join = function (discussionKey) {

				that.minify = false;

				that.states[discussionKey] = "joined";

				if (discussionKey != that.currentCallKey && that.states[that.currentCallKey] == "joined") {
					$api.post("calls/exit", {discussionKey: that.currentCallKey}, function (res) {
					});
				}

				$api.post("calls/join", {discussionKey: discussionKey}, function (res) {

					if (res.errors.length == 0) {

						that.realJoin(discussionKey, res.data.token);

					} else {
						this.states[discussionKey] = "";
					}

				});

			}

			this.realJoin = function (discussionKey, token) {
				that.states[discussionKey] = "joined";

				console.log(token);

				that.currentCallKey = discussionKey;

				if (that.jitsiApi != null) {
					that.jitsiApi.dispose();
					$(that.jitsiApi.parentNode).children().remove();
					that.jitsiApi = null;
				}

				if (that.jitsiApi == null) {
					that.jitsiApi = new JitsiMeetExternalAPI(
						"meet.twakeapp.com",
						token,
						"100%",
						"100%",
						document.querySelector('.jitsi_video'),
						undefined,
						{
							DEFAULT_BACKGROUND: "#000",
							DEFAULT_REMOTE_DISPLAY_NAME: "Peer",
							SHOW_JITSI_WATERMARK: false,
							SHOW_WATERMARK_FOR_GUESTS: false,
							APP_NAME: "Twake",
							TOOLBAR_BUTTONS: [
								"microphone", "camera", "desktop",
								"chat", "filmstrip",
								"sharedvideo", "settings",
								"recording"
							],
							MAIN_TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop'],
							SHOW_CONTACTLIST_AVATARS: false,
							VERTICAL_FILMSTRIP: false,
							MOBILE_APP_PROMO: false,
							interfaceConfigOverwrite: {filmStripOnly: true}
						}
					);
					that.jitsiApi.executeCommand('displayName', $user.data.username);
					if ($user.data.userimage != "") {
						that.jitsiApi.executeCommand('avatarUrl', $user.data.userimage);
					}

					//Add event listeners
					that.jitsiApi.addEventListener("audioAvailabilityChanged", function (data) {
						that.available.audio = data.available;
					});
					that.jitsiApi.addEventListener("videoAvailabilityChanged", function (data) {
						that.available.video = data.available;
					});
					that.jitsiApi.addEventListener("audioMuteStatusChanged", function (data) {
						that.options.audio = data.muted;
						that.updateOptions();
					});
					that.jitsiApi.addEventListener("videoMuteStatusChanged", function (data) {
						that.options.video = data.muted;
						that.updateOptions();
					});

				}

			}

			this.realExit = function () {
				that.currentCallKey = null;
				if (that.jitsiApi) {
					//$(that.jitsiApi.parentNode).children().remove();
					that.jitsiApi.dispose();
					that.jitsiApi = null;
				}
			}

			/* Get call infos */
			this.update = function (discussionKey) {

				$api.post("calls/get", {discussionKey: discussionKey}, function (res) {

					that.members[discussionKey] = {};

					angular.forEach(res.members, function (el) {
						that.members[discussionKey][el.uid] = el;
					});

					if (res.status != "joined" && discussionKey == that.currentCallKey) {
						that.realExit();
					}

					if (res.status == "nocall") {
						that.states[discussionKey] = undefined;
						return;
					}

					if (that.states[discussionKey] == undefined && res.status == "joined" && discussionKey == that.currentCallKey) {
						//Show call
						that.realJoin(discussionKey, res.token);

					}

					that.states[discussionKey] = res.status;
					if ($rootScope.$root.$$phase !== '$apply' && $rootScope.$root.$$phase !== '$digest') {
						$rootScope.$apply();
					}
				});

			}

			that.updateOptions = function () {
				//TODO
			}

			that.toggleOptions = function (opt, value) {

				if (opt == "screen") {
					that.jitsiApi.executeCommand('toggleShareScreen');
				}

				if (opt == "video") {
					that.jitsiApi.executeCommand('toggleVideo');
				}

				if (opt == "mic") {
					that.jitsiApi.executeCommand('toggleAudio');
				}

				if (opt == "fullscreen") {
					that.options.fullscreen = !that.options.fullscreen;
				}

				if (opt == "audio") {
					//TODO
				}

			}

			$rootScope.$on("$locationChangeStart", function (event, next, current) {
				that.minify = true;
			});

		})

		.filter("trustUrl", ['$sce', function ($sce) {
			return function (recordingUrl) {
				return $sce.trustAsResourceUrl(recordingUrl);
			};
		}])
		.run(function ($calls) {
		});
};
