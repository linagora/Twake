window.Twake = {
	callbacks: {},
	i:0,
    frameid: "?",
	unid: function(){
		return this.i++;
	},
	on: function(route, callback){
		var token = this.unid();
		var data = {
			type: "on",
			route: route,
      token: token,
      unid: this.frameid
		};
		this.callbacks[token] = {
			callback_success: function(data){
				if(callback){
					callback(data);
				}
			},
			callback_errors: function(errors){
				if(callback){
					callback(errors);
				}
			}
		};
    var message = JSON.stringify(data);
    if(window.ipcRenderer){
      window.ipcRenderer.sendToHost('message', message);
    }else{
      window.parent.postMessage(message, "*");
    }
	},
	call: function(route, options, callback_success, callback_errors){
		var token = this.unid();
		var data = {
			type: "call",
			options: options,
			route: route,
      token: token,
      unid: this.frameid
		};
		this.callbacks[token] = {
			callback_success: function(data){
				if(callback_success){
					callback_success(data);
				}
			},
			callback_errors: function(errors){
				if(callback_errors){
					callback_errors(errors);
				}
			}
		};
    var message = JSON.stringify(data);
    if(window.ipcRenderer){
      window.ipcRenderer.sendToHost('message', message);
    }else{
      window.parent.postMessage(message, "*");
    }
	},
	receive: function(msg){
		var data = JSON.parse(msg);
		var token = data.token;
    if (!this.callbacks[token]) {
        return;
    }
		if(!data.data){
			return;
		}
		if(!data.errors || data.errors.length==0){
			this.callbacks[token].callback_success(data.data);
		}else{
			this.callbacks[token].callback_errors(data.errors);
		}
	}
};
if(window.ipcRenderer){
  window.ipcRenderer.on('message', (event, message) => {
    window.Twake.receive(message);
  });
}else{
  window.addEventListener("message", function(e){
  	window.Twake.receive(e.data);
  });
}
