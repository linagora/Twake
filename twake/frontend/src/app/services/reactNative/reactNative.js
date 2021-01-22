import Number from 'services/utils/Numbers.js';
import $ from 'jquery';
import Languages from 'services/languages/languages.js';

import Globals from 'services/Globals.js';

class ReactNative {
  constructor() {
    Globals.window.ReactNative = this;
    this.device = undefined;

    var that = this;
    Globals.window.addEventListener(
      'message',
      function (data) {
        that.receiveMessage(data);
      },
      false,
    );
    this.callbacks = {};

    if (this.isReactNative()) {
      this.callReactNative('showView', {});
    }
  }

  init() {
    $('body').addClass('reactNative');

    this.initPushRegistration();
    var that = this;
    that.improveLinks();
    setInterval(function () {
      that.improveLinks();
    }, 5000);
  }

  callReactNative(method, data, callback) {
    var unid = Number.unid();

    this.callbacks[unid] = callback;

    var that = this;
    setTimeout(function () {
      delete that.callbacks[unid];
    }, 10 * 1000);

    var data = {
      unid: unid,
      method: method,
      data: data,
    };

    this.sendMessage(data);
  }

  sendMessage(data) {
    data = JSON.stringify(data);
    Globals.window.postMessage(data, '*');
  }

  receiveMessage(data) {
    try {
      data = JSON.parse(data.data);
    } catch (e) {
      return;
    }
    if (data.origin && data.origin == 'reactnative') {
      if (this.callbacks[data.unid]) {
        this.callbacks[data.unid](data);
      } else if (data.method && this[data.method]) {
        this[data.method](data);
      }
    }
  }

  openLink(link, a, b, c) {
    if (!Globals.window.reactNative) {
      return;
    }

    var req = {
      link: link,
    };

    this.callReactNative('openlink', req, function (data) {});
  }

  isReactNative() {
    return Globals.window.reactNative == true;
  }

  improveLinks() {
    if (!Globals.window.reactNative) {
      return;
    }
    Globals.window.open = this.openLink;
    $(document).off('click', 'a');
    $(document).on('click', 'a', function (e) {
      var $this = $(this),
        target = '_blank'; // system open the device browser. _blank open inappbrowser
      if ($this.attr('href')) {
        e.preventDefault();
        Globals.window.ReactNative.openLink($this.attr('href'));
      }
    });
  }

  updateNotifications(total) {}

  copy(text) {
    if (!Globals.window.reactNative) {
      return;
    }
    this.callReactNative('copy', { text: text });
  }

  actionsheet(actions, endCallback) {
    if (!Globals.window.reactNative) {
      return;
    }

    var options = [];
    var destructiveButtonIndex = 1000000;
    var callbacks = {};
    var index = 0;
    for (var i = 0; i < actions.length; i++) {
      if (actions[i].type == 'delete') {
        options.push(actions[i].value || Languages.t('general.delete')),
          (destructiveButtonIndex = index);
      } else {
        options.push(actions[i].value);
      }
      callbacks[index] = actions[i].callback;
      index++;
    }

    options.push(Languages.t('general.cancel'));

    var req = {
      options: options,
      cancelButtonIndex: index,
      destructiveButtonIndex: destructiveButtonIndex,
    };

    this.callReactNative('actionsheet', req, function (data) {
      if (callbacks[data.data.index]) {
        callbacks[data.data.index]();
      }
      if (endCallback) endCallback();
    });
  }

  confirm(title, message, yes, no, callbackYes, callbackNo) {
    if (!Globals.window.reactNative) {
      return;
    }

    var req = {
      title: title,
      message: message,
      yes: yes,
      no: no,
    };

    this.callReactNative('confirm', req, function (data) {
      if (data.data == 'yes') {
        if (callbackYes) callbackYes();
      } else {
        if (callbackNo) callbackNo();
      }
    });
  }

  registerPushNotifications(data) {
    var token = data;
    this.device = {
      value: data.registrationId,
      type: data.registrationType,
    };
  }

  didOpenPushNotification(data) {}

  resumeApp() {
    document.dispatchEvent(new Event('resume'));
  }

  pauseApp() {
    document.dispatchEvent(new Event('pause'));
  }

  backButton() {}
}

const instanceReactNative = new ReactNative();
export default instanceReactNative;
