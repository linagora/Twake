angular.module('twake')
.controller('parametersCtrl', function($api, $user){

  this.email = "";
  this.name = "";
  this.oldname = "";
  this.username_edit = false;
  this.username_errors = {};
  this.mail_errors = {};
  this.secondary = [];
  this.chmail = true;
  this.new_address = false;
  this.newmail = "";
  this.chPass = false;
  this.curpass = "";
  this.newpass = "";
  this.newpassval = "";
  this.passchanged = false;
  this.getInfos = function(){
    var that = this;
    $api.post('/users/account/parameters',{},function(res){
      that.email = res['data']['email'];
      that.name = res['data']['username'];
      that.secondary = res['data']["secondary"];
      that.ready = true;
    });
  };
  this.getInfos();

  this.getInfosMail = function(){
    var that = this;
    $api.post('/users/account/parameters',{},function(res){
      that.secondary = res['data']["secondary"];
    });
  };

  this.toggleUsernameEdit = function(){
    if (this.username_edit){
      this.name = this.oldname;
    } else {
      this.oldname = this.name;
    }
    this.username_edit = !this.username_edit;
    this.username_errors = {};
  };

  this.setUsername = function() {
    var that = this;
    this.username_edit = false;
    $api.post('/users/account/parameters/script',{"source":"pseudo", "pseudo":this.name},function(res){
      if (res.status == "success"){
        $user.update();
        that.username_errors = {};
      } else {
        that.username_edit = true;
        that.username_errors = res.oerrors;
      }
    });

  };

  this.changeMail = function(id) {
    if (!this.chmail){
      return;
    }
    var that = this;
    this.chmail = false;
    $api.post('/users/account/parameters/script',{"source":"changemail", "mid":id}, function(res){
      if (res.status == "success"){
        angular.forEach(that.secondary, function(el, key){
          if (el['id'] == id){
            temp = el['mail'];
            el['mail'] = that.email;
            that.email = temp;
            that.chmail = true;
          }
        });
      } else {
        that.chmail = true;
      }
    });
  };

  this.deleteMail = function(id) {
    if (!this.chmail){
      return;
    }
    var that = this;
    this.chmail = false;
    $api.post('/users/account/parameters/script',{"source":"deletemail", "mid":id}, function(res){
      if (res.status == "success"){
        clef = undefined;
        angular.forEach(that.secondary, function(el, key){
          if (el['id'] == id){
            clef = key;
          }
        });
        that.secondary.splice(clef, 1);
        that.chmail = true;
      } else {
        console.log("error");
        that.chmail = true;
      }
    });
  };

  this.toggleMail = function(){
    this.new_address = !this.new_address;
  }

  this.addMail = function(){
    if (!this.new_address){
      return;
    }
    var that = this;
    $api.post('/users/account/parameters/script', {"source":"addmail", "mail":that.newmail}, function(res){
      if (res.status == "success"){
        that.mail_errors = {}
        that.new_address = false;
        new_id = res.new_id;
        that.secondary.push({'id':new_id, 'mail':that.newmail});
        that.getInfosMail();
        that.newmail = "";
      } else {
        //Errors
        that.mail_errors = res.oerrors;
      }
    });
  };

  this.showPass = function(){
    this.chgPass = true;
    this.passchanged = false;
  };

  this.changePass = function(){
    var that = this;
    $api.post('/users/account/parameters/script', {"source":"changepassword", "current_password":that.curpass, "new_password":that.newpass, "new_password_verify":that.newpassval}, function(res){
      that.curpass = "";
      that.newpass = "";
      that.newpassval = "";
      if (res.status == "success"){
        that.pass_errors = {};
        that.chgPass = false;
        that.passchanged = true;
      }else{
        that.pass_errors = res.oerrors;
      }
    });
  };

  this.cancelPass = function(){
    var that = this;
    that.curpass = "";
    that.newpass = "";
    that.newpassval = "";
    that.chgPass = false;
  };

});
