angular.module('twake')
.controller('startpageCtrl', function($api, $user,$state, $rootScope){
		$("#js-rotating").Morphext({
			animation: "flipInX",
			separator: ",",
			speed: 2000
		});
});

function generateStartpageBackground(element){

  var container = document.querySelector(element);
  var camera, scene, renderer;
  var raycaster;
  var mouse;
  var PI2 = Math.PI * 2;

  var programStroke = function ( context ) {
    context.lineWidth = 0.025;
    context.beginPath();
    context.arc( 0, 0, 0.5, 0, PI2, true );
    context.stroke();
  };

  var init = function() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 0, 300, 500 );
    scene = new THREE.Scene();
    for ( var i = 0; i < 100; i ++ ) {
      var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( { color: 0xFFFFFF, program: programStroke } ) );
      particle.position.x = Math.random() * 1600 - 800;
      particle.position.y = Math.random() * 1600 - 800;
      particle.position.z = Math.random() * 1600 - 800;
      particle.scale.x = particle.scale.y = Math.random() * 20 + 20;
      scene.add( particle );
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer = new THREE.CanvasRenderer();
    renderer.setClearColor( 0x2952B3 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
  }

  var onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  var onDocumentMouseMove = function( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  var animate = function() {
    requestAnimationFrame( animate );
    render();
  }

  var radius = 600;
  var theta = 0;
  var render = function() {
    // rotate camera
    theta += 0.1*mouse.y+0.05;
    camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
    camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
    camera.lookAt( scene.position );
    camera.updateMatrixWorld();
    renderer.render( scene, camera );
  }
  init();
  animate();



}
