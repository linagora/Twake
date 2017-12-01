angular.module('twake')
.controller('btnContactCtrl',function($api){

    this.idUser =-1;
    this.contact = {};

    var that = this;

    this.init = function(idUser){
        that.idUser = idUser;
    }

    this.load = function(){
	    $api.post("users/account/contacts/user", {"user_id": that.idUser}, function (json) {
            that.contact = json;
            that.contact[json.result] = true;
        });
    }


    this.ask = function(){
	    $api.post("users/account/contacts/ask", {"user_id": that.idUser}, function (res) {
            if(res.errors.length===0){
                that.load();
            }
        });
    }

    this.cancel = function(){
	    $api.post("users/account/contacts/remove", {"user_id": that.idUser}, function (res) {
            if(res.errors.length===0){
                that.load();
            }
        });
    }

    this.accept = function(){
	    $api.post("users/account/contacts/accept", {"user_id": that.idUser}, function (res) {
            if(res.errors.length===0){
                that.load();
            }
        });
    }

    this.refuse = function(){
	    $api.post("users/account/contacts/refuse", {"user_id": that.idUser}, function (res) {
            if(res.errors.length===0){
                that.load();
            }
        });
    }

    this.remove= function(){
	    $api.post("users/account/contacts/remove", {"user_id": that.idUser}, function (res) {
            if(res.errors.length===0){
                that.load();
            }
        });
    }

});
