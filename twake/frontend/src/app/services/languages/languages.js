import React from 'react';
import Observable from 'services/observable.js';
import Api from 'services/api.js';
import locale_en from './locale/en.js';
import locale_fr from './locale/fr.js';
import locale_de from './locale/de.js';
import locale_es from './locale/es.js';
import locale_ja from './locale/ja.js';
import locale_ru from './locale/ru.js';
import WindowState from 'services/utils/window.js';
import LocalStorage from 'services/localStorage.js';
import DateTime from 'services/utils/datetime.js';
import Globals from 'services/Globals.js';

class Languages extends Observable {
  constructor() {
    super();

    Globals.window.languageService = this;

    this.setObservableName('i18n');
    this.data = {};
    this.default_data = {};
    this.available = ['en', 'fr', 'de', 'es', 'ja', 'ru'];
    this.language = 'en';

    //Determine default language
    var that = this;
    LocalStorage.getItem('language', language => {
      if (language) {
        that.setLanguage(that.language);
      } else if (Globals.getDefaultLanguage()) {
        that.language = that.getNavigatorLanguage();

        that.setLanguage(that.language);

        if (Globals.window.Twake) {
          Globals.window.Twake.on('language_change', data => {
            that.setLanguage(data.language);
          });
        }
      } else {
        that.setLanguage();
      }
    });

    this.testMode = WindowState.findGetParameter('test_mode') || LocalStorage.getItem('test_mode');
  }

  getNavigatorLanguage() {
    var language = this.language;
    this.available.forEach(function (ln) {
      if (Globals.getDefaultLanguage().toLocaleLowerCase().indexOf(ln) >= 0) {
        language = ln;
      }
    });
    return language;
  }

  setLanguage(language) {
    var oldLanguage = this.language;

    if (!language) {
      language = this.language;
    }

    if (language == 'fr') {
      this.data = locale_fr;
    }
    if (language == 'es') {
      this.data = locale_es;
    }
    if (language == 'de') {
      this.data = locale_de;
    }
    if (language == 'en') {
      this.data = locale_en;
    }
    if (language == 'ja') {
      this.data = locale_ja;
    }
    if (language == 'ru') {
      this.data = locale_ru;
    }

    this.default_data = locale_en;

    LocalStorage.setItem('language', language);
    this.language = language;
    this.notify();

    DateTime.setCurrentLanguage(this.language);

    if (oldLanguage && language != oldLanguage) {
      Api.post(
        'users/account/language',
        { language: language, sentByLanguageService: true },
        function (res) {},
      );
    }
  }

  t(route, parameters, fallback) {
    if (this.testMode) {
      return route;
    }

    if (typeof parameters == 'string') {
      parameters = [parameters];
    }

    if (!parameters) {
      parameters = [];
    }

    var translation = this.data[route] || this.default_data[route] || fallback || route;

    if (translation == route) {
      console.log(route + ' : not translated');
    }

    for (var i = 1; i <= parameters.length; i++) {
      var find = '\\$' + i;
      var re = new RegExp(find, 'g');
      translation = translation.replace(re, parameters[i - 1]);
    }

    return translation;
  }
}

Globals.services.languagesService = Globals.services.languagesService || new Languages();
export default Globals.services.languagesService;
