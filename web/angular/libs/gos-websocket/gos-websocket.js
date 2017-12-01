(function(){
	'use strict';

	angular
		.module('GosWebsocket', [])
		.service('WebsocketService', WebsocketService)
	;

	WebsocketService.$inject = ['$rootScope', '$q'];

	function WebsocketService($rootScope, $q){
		this.websocket = null;
		this.connected = false;
		this.hasPreviousConnection = false;
		this.session = null;

		this.setConfig = function(config){
			this.config = config;

			if(false === this.config.hasOwnProperty('debug')){
				this.config.debug = false;
			}
		};

		this.getConfig = function(){
			return this.config;
		};

		this.getSession = function(){
			return this.session;
		};

		this.connect = function(){
			var deferred = $q.defer(),
				protocol = true === this.config.secured ? 'wss' : 'ws'
				;

			this.websocket = WS.connect(protocol+'://'+this.config.host+':'+this.config.port);

			this.websocket.on('socket/connect', function(session){
				this.connected = true;
				this.session = session;

				deferred.resolve(session);

				deferred.promise.then(function(session){
					if(true === this.config.debug){
						console.log('connected to ' + this.config.host);
					}

					$rootScope.$broadcast('ws:connect', session);
				}.bind(this), function(session){
					if(true === this.config.debug){
						console.log('unable to connected to ' + this.config.host);
					}
				}.bind(this));
			}.bind(this));

			return deferred.promise;
		};

		this.publish = function(channel, message){
			this.session.publish(channel, message);
		};

		this.subscribe = function(channel){
			this.session.subscribe(channel, function(uri, payload){
				$rootScope.$broadcast('ws:['+uri+']:publication', payload);
			}.bind(this));
		};

		this.disconnect = function(){
			var deferred = $q.defer();

			this.websocket.on('socket/disconnect', function(error){
				deferred.resolve(error);
			});

			deferred.promise.then(function(error){
				this.connected = false;
				this.session = null;
				this.hasPreviousConnection = true;

				if(true === this.config.debug){
					console.log('Disconnected for ' + error.reason + ' with code ' + error.code);
				}

				$rootScope.$broadcast('ws:disconnect', error);
			}.bind(this));

			return deferred.promise;
		};

		this.isConnected = function(){
			return this.connected;
		}
	}
})();