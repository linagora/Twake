angular.module('twake')
.controller('contactsCtrl', function($api){

  this.contactsListLoading = true;
  this.contactsList = [];
  this.contactsListAsked = [];
  this.contactSearched = [];

  this.maybeListLoading = true;
  this.maybeList = [];
  this.contactTyped = "";
  var that=this;

  this.addContacts = function(){
      openPopup("/account/contacts/addnew", {"improveresize":false});
  }

  this.getContacts = function(){
      var that = this;
      $api.post('/users/contacts/getall', {"nb":80}, function(res){
          that.contactsList = [];
          that.contactsListAsked = [];
          angular.forEach(res.results, function(el, key){
            if(el.status=="A"){
              that.contactsList.push(el);
            }else{
              that.contactsListAsked.push(el);
            }
          });
          that.contactsListLoading = false;
      });
  }

  this.updateContactSearched = function(){
	  $api.post("users/fastSearch", {limit: 10, offset: 0, model: that.contactTyped}, function (res) {
              that.contactSearched = res.data;
      });
  };

  this.addContacts = function(){
      $api.post()
  }

  this.maybeContacts = function(){
      var that = this;
      $api.post('/users/contacts/maybe', {"nb":10}, function(res){
          that.maybeList = res.results;
          that.maybeListLoading = false;
      });
  }


  this.removeContactAsk = function(uid,move){
      var contact = {};
      for(i=0;i<that.contactsListAsked.length;i++){
          if(that.contactsListAsked[i].id==uid){
              contact = that.contactsListAsked[i];
              that.contactsListAsked.splice(i,1);
              if(move){
                  that.contactsList.push(contact);
              }
          }
      }
  }

  //TODO
  this.searchContacts = function(text){
      if(text==""){
          $("#friends").find(".profil_relation").parent().css("display","inline-block");
      }
      $("#friends").find(".profil_relation").each(function(i, el){
          if($(el).attr("data-cleanusername").toLowerCase().indexOf(text.toLowerCase()) !== -1){
              $(el).css("display","inline-block");
          }else{
              $(el).hide();
          }
      });
  }

  this.getContacts();
  this.maybeContacts();

});
