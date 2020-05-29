//test
window.config_use_cas = false;
window.mixpanel_enabled = false;
window.test_login_on_woodpecker = false;

window.env = 'dev';

if (window.env == 'local') {
  window.API_ROOT_URL = 'http://localhost:8080';
  window.WEBSOCKET_URL = 'localhost:8080/ws/';
} else if (window.env == 'dev') {
  window.API_ROOT_URL = 'https://albatros.twakeapp.com';
  window.WEBSOCKET_URL = 'albatros.twakeapp.com/ws/';
} else {
  window.API_ROOT_URL = 'https://app.twakeapp.com';
  window.WEBSOCKET_URL = 'app.twakeapp.com/ws/';
}
