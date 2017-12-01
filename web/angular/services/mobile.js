function serviceMobile(app){
  return app
  .service('$mobile', function($rootScope, $window){
    $rootScope.mobile = this;
    this.reset = function(){
      $window.initMobile();
    };
  })
  .run(function($mobile){})
  ;
};

var initMobileVerified = function(){

  var initPos = 0;
  var currentPos = 0;
  var rightOpen = false;
  var leftOpen = false;
  var inertiaTimeout = setTimeout("");

  var handleCloseAll = function(){
	  $("main").removeClass("moving showContacts").addClass("closed");
    initPos = 0;
    rightOpen = false;
    leftOpen = false;
  }

  var handleOpenRight = function(){
	  $("main").removeClass("moving closed").addClass("showContacts");
	  initPos = -200;
  }

  // Pan touch

  var handleInertia = function(e){
    var vx = e.velocityX;
	  if (vx > 1 && rightOpen) {
      handleCloseAll();
      return;
    }
	  if (vx < -1 && !rightOpen && !leftOpen) {
      handleOpenRight();
      return;
    }
    clearTimeout(inertiaTimeout);
    inertiaTimeout = setTimeout(function(){
        if(Math.abs(vx)>0.1){
          initPos = currentPos;
          e.deltaX = e.velocityX*3;
          e.velocityX = vx*0.88;
          handlePan(e);
          handleInertia(e);
        }else{
          handlePanEnd(e);
        }
    },10);
  }

  var handlePanEnd = function(e){
	  if (currentPos > -100 && currentPos < 0) {
      handleCloseAll();
      return;
    }
	  if (currentPos < -100) {
      handleOpenRight();
      return;
    }
  }

  var handlePan = function(e){

    var pos = e.deltaX + initPos;
    //Right
	  pos = Math.max(-200, pos);
    pos = Math.min(0,pos);
    currentPos = pos;
    rightOpen = currentPos<0;

	  $("main").addClass("moving").removeClass("showContacts closed").css({"transform": "translateX(" + currentPos + "px)"});
  }

  var handlePanFromLeft = function(e){
  }

  var handleStartPan = function(e){
	  initPos = parseInt($('main').css('transform').split(',')[4]);
    if(isNaN(initPos)){
      initPos = 0;
    }
  }

  var handlePanFromRight = function(e){
    //console.log(e);
    if(e.type!="pan"){
      return;
    }
    clearTimeout(inertiaTimeout);
    handlePan(e);
  }

  var handlePanFromCenter = function(e){
    //console.log(rightOpen);
    if(rightOpen){
      handlePanFromRight(e);
      return;
    }
    if(leftOpen){
      handlePanFromLeft(e);
      return;
    }
  }

  var rightMenuSelector = Hammer($(".mobileRightMenuTouch")[0]);
  var rightMenu = Hammer($(".mobileRightMenu")[0]);
	//var Center = Hammer($("main")[0]);
  rightMenuSelector.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
  rightMenu.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
  //Center.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );

  rightMenuSelector.on("panstart", handleStartPan);
  rightMenu.on("panstart", handleStartPan);
  //Center.on("panstart", handleStartPan);

  rightMenuSelector.on("pan", handlePanFromRight);
  rightMenu.on("pan", handlePanFromRight);
  //Center.on("pan", handlePanFromCenter);

  rightMenuSelector.on("panend", handleInertia);
  rightMenu.on("panend", handleInertia);
  //Center.on("panend", handleInertia);

}

var initMobile = function(){
  if( screen.width <= 600 ){
    window.ismobile = true;
    initMobileVerified();
  }
}
