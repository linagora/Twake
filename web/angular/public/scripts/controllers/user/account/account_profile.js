angular.module('twake')

.controller('accountProfileCtrl', function($api, Upload, $scope, $user){

    var that = this;
    this.data = {};
    this.data.firstname = "";
    this.data.lastname = "";
    this.data.birthday = "";
    this.data.gender = "";
    this.data.description = "";
    this.data.tags = [];
    this.data.email = "";
    this.data.secondaryEmails = [];
    this.data.workspaces = [];
    this.privacy = {
        'firstname': 'public',
        'lastname': 'public',
        'gender': 'public',
        'birthday': 'public',
        'hobbies': 'public',
        'description': 'public',
        'email': 'private',
        'subscription': 'private'
    };
    this.saveButtonIsBlocked = true;
    this.birthdayError = false;

		$api.post("users/account/profile", {}, function (res) {

        if (res.errors.length === 0) {

            that.data = res.data;
            that.privacy = res.data.privacy;
            that.privacy.description = 'public';
        }
    });

    this.unblockSaveButton = function() {
        that.saveButtonIsBlocked = false;
    };

    this.blockSaveButton = function() {
        that.saveButtonIsBlocked = true;
    };

    this.saveIdentity = function() {

        var stringDate = "";
        if (that.data.birthday != "") {
            if (typeof that.data.birthday === "string") {
                stringDate = that.data.birthday.substr(0, 10);
            }
            else if (typeof that.data.birthday === "object") {
                stringDate = that.data.birthday.format('YYYY-MM-DD');
            }
        }

        var tags = [];
        that.data.tags.forEach(function(el) {
            tags.push(el.text);
        });


        var data = {
            firstname: that.data.firstname,
            lastname: that.data.lastname,
            birthday: stringDate,
            gender: that.data.gender,
            description: that.data.description,
            tags: tags.toString(),
            privacy: that.data.privacy,
            emails: that.data.emails,
            email: that.data.email
        };

	    $api.post("users/account/profile/update", data, function (res) {

            that.birthdayError = res.errors.includes("badbirthday");
            that.blockSaveButton();
        });
    };

    //Auto upload image
    this.userimage_errors = {};

    $scope.$watch(function(){return that.userimage}, function (image) {
      if(image){
        that.upload(image, "profile");
      }
    });

    $scope.$watch(function(){return that.coverimage}, function (image) {
      if(image){
        that.upload(image, "cover");
      }
    });

    this.upload = function (file, type) {
      if (type=="profile"){
        Upload.upload({
            url: 'ajax/users/account/profile/update_userimage',
            data: {file: this.userimage}
        }).then(function (resp) {
            if(resp.data.errors.length==0){
            //if(resp.data.data[0].result.errors.length==0){
              $user.update();
              that.userimage_errors = {};
            }else{
              that.userimage_errors = {"error":true};
              that.userimage=undefined;
            }
        }, function (resp) {
            that.userimage=undefined;
            that.userimage_errors = {"error":true};
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        });
      } else if (type=="cover") {
        Upload.upload({
            url: 'ajax/users/account/profile/update_coverimage',
            data: {file: this.coverimage}
        }).then(function (resp) {
            if(resp.data.errors.length==0){
            //if(resp.data.data[0].result.errors.length==0){
              $user.update();
              that.coverimage_errors = {};
            }else{
              that.coverimage_errors = {"error":true};
              that.coverimage=undefined;
            }
        }, function (resp) {
            that.coverimage=undefined;
            that.coverimage_errors = {"error":true};
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        });
      };
    };

});
