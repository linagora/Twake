import React from 'react';
import Globals from 'services/Globals';

export default class WindowState {
  constructor() {
    if (!Globals.isReactNative) {
      WindowState.original = document.title;
    }
    WindowState.focused = true;
    Globals.window.windowService = this;
  }

  static allGetParameter() {
    if (Globals.isReactNative) {
      return;
    }

    var result = {},
      tmp = [];
    Globals.window.location.search
      .substr(1)
      .split('&')
      .forEach(function (item) {
        tmp = item.split('=');
        result[tmp[0]] = tmp[1];
      });
    return result;
  }

  static findGetParameter(parameterName) {
    if (Globals.isReactNative) {
      return;
    }

    var result = null,
      tmp = [];
    Globals.window.location.search
      .substr(1)
      .split('&')
      .forEach(function (item) {
        tmp = item.split('=');
        if (tmp[0] === parameterName) {
          result = decodeURIComponent(tmp[1]);
          if (tmp[1] === undefined) {
            result = true;
          }
        }
      });
    return result;
  }

  static setNotificationsInTitle(count) {
    if (Globals.isReactNative) {
      return;
    }

    document.title =
      (count > 0 ? ' (' + count + ') ' : '') + document.title.replace(/^\([0-9\-]+\) */, '');
  }

  static setTitle(text, icon) {
    if (Globals.isReactNative) {
      return;
    }

    if (!icon || true) {
      //Always using Twake icon for now
      icon = '/favicon.png';
    }

    if (!text) {
      text = 'Twake';
    }

    if (text != 'Twake') {
      text = 'Twake - ' + text;
    }

    (function () {
      var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = icon;
      document.getElementsByTagName('head')[0].appendChild(link);
      document.title = text;
    })();
  }

  static setUrl(url, removeParameters) {
    if (Globals.isReactNative) {
      return;
    }

    if (!removeParameters) {
      var parameters = WindowState.allGetParameter();

      if (Object.keys(parameters || {}).length > 0) {
        url =
          url +
          '?' +
          Object.keys(parameters)
            .map(k => (k ? k + '=' + parameters[k] : ''))
            .join('&');
      }
    }
    Globals.window.history.pushState({ pageTitle: document.title }, '', url);
  }

  static nameToUrl(str) {
    if (Globals.isReactNative) {
      return str;
    }

    str = str.trim();
    str = str.replace(/[ -/]+/g, '_');
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/[^@a-zA-Z0-9_]/g, '');
    return str;
  }

  static reduceUUID4(id) {
    if (!id) {
      return undefined;
    }
    id = id.replace(/(.)\1{2,3}/g, '$1i');
    id = id.replace(/(.)\1{1,2}/g, '$1h');
    return id.replace(/-/g, 'g');
  }

  static expandUUID4(id) {
    if (!id) {
      return undefined;
    }
    id = id.replace(/(.)i/g, '$1$1$1');
    id = id.replace(/(.)h/g, '$1$1');
    id = id.replace(/[^0-9a-g]/g, '');
    return id.replace(/g/g, '-') || undefined;
  }

  static getInfoFromUrl() {
    if (Globals.isReactNative) {
      return;
    }

    var result = {};
    var url = document.location.pathname.replace(/^\/client/, '');
    if (url) {
      if (url.indexOf('/private/') == 0) {
        url = url.split('/').pop();
        var list = url.split('-');
        result.channel_id = WindowState.expandUUID4(list[1]);
        result.message = list[2] ? WindowState.expandUUID4(list[2]) : false;
        if (!result.channel_id) {
          result = {};
        }
      } else {
        url = url.split('/').pop();
        var list = url.split('-');
        var channel_id = list[2];
        var workspace_id = list[1];
        result.message = list[3] ? WindowState.expandUUID4(list[3]) : false;
        result.channel_id = WindowState.expandUUID4(channel_id);
        result.workspace_id = WindowState.expandUUID4(workspace_id);
        if (!result.workspace_id || !result.channel_id) {
          result = {};
        }
      }
    }
    return result;
  }
}
