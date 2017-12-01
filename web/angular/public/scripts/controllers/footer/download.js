angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      .state('download', {
        url:'/download',
        templateUrl : '@pviews/footer/download.html',
        parent: 'general',
      })
})
.controller('downloadCtrl',function(){

    this.linkApp ={
        "Windows" : "http://twakeapp.com/public/img/home/windows.svg",
        "Mac OS" : "http://twakeapp.com/public/img/home/mac.svg",
        "Linux" : "http://twakeapp.com/public/img/home/linux.svg",
    }
    this.getOs = function(){
        var userAgent = window.navigator.userAgent,
            platform = window.navigator.platform,
            macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
            windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
            iosPlatforms = ['iPhone', 'iPad', 'iPod'],
            os = null;
        var userAgent = window.navigator.userAgent,
            platform = window.navigator.platform,
            macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
            windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
            iosPlatforms = ['iPhone', 'iPad', 'iPod'],
            os = null;
        if (macosPlatforms.indexOf(platform) !== -1) {
            os = 'Mac OS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
            os = 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
            os = 'Windows';
        } else if (/Android/.test(userAgent)) {
            os = 'Android';
        } else if (!os && /Linux/.test(platform)) {
            os = 'Linux';
        }

        return os;
    }

    this.download = function(){
        console.log("download");
        window.location = "/public/img/home/screenDescktop.jpg";
    }


    this.os = this.getOs();
    this.osSelected = this.os;
});
