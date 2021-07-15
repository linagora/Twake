import Observable from 'app/services/Depreciated/observable';
import Api from 'services/Api';
import DateTime from 'services/utils/datetime';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

class Languages extends Observable {
  private i18nt: Function | null = null;
  private language: string = 'en';
  private default = 'en';
  private available = ['en', 'fr', 'de', 'es', 'ja', 'ru'];

  constructor() {
    super();
    this.setObservableName('i18n');
    (window as any).languageService = this;

    this.init();
  }

  async init() {
    this.i18nt = await i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next) // passes i18n down to react-i18next
      .init({
        fallbackLng: this.default,
        supportedLngs: this.available,
        backend: { loadPath: '/locales/{{lng}}.json' },
        interpolation: {
          escapeValue: false, // react already safes from xss
        },
      });
  }

  async setLanguage(language: string) {
    var oldLanguage = this.language;
    this.language = language;

    if (!language) {
      language = this.default;
    }

    await i18n.changeLanguage(language);
    DateTime.setCurrentLanguage(language);

    if (oldLanguage && language !== oldLanguage) {
      Api.post(
        'users/account/language',
        { language: language, sentByLanguageService: true },
        (_: any) => {},
      );
    }

    this.notify();
  }

  t(route: string, parameters: any[] = [], fallback?: string) {
    let replace: any = {};

    let translation = '';

    if (this.i18nt) {
      translation = this.i18nt!(route, fallback, { replace });
    }

    if (typeof parameters === 'object' && parameters.forEach) {
      for (var i = 1; i <= parameters.length; i++) {
        var find = '\\$' + i;
        var re = new RegExp(find, 'g');
        translation = translation.replace(re, parameters[i - 1]);
      }
    }

    return translation;
  }
}

export default new Languages();
