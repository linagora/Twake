import moment from 'moment';
import { message } from 'antd';

import Observable from 'services/Observable/Observable';
import Languages from 'services/languages/languages.js';
import FeedbackMessageManager from 'services/FeedbackMessageManager/FeedbackMessageManager';
import Login from 'services/login/login.js';

import { Collection } from '../CollectionsReact/Collections';
import {
    preferencesType,
    NotificationPreferencesResource,
  } from 'app/models/NotificationPreferences';

type Keys = keyof preferencesType;
type Values = preferencesType[Keys];

class NotificationParametersService extends Observable {
  constructor() {
    super();
  }
  
  url = '/notifications/v1/preferences/';
  notificationPreferences!: NotificationPreferencesResource;

  async init() {
    const collection = Collection.get(this.url, NotificationPreferencesResource);

    collection.addWatcher(()=>{
      //Will be called each time something happen on this collection
      this.notificationPreferences = collection.findOne({}, {withoutBackend: true}); //Get preferences from collection store
      this.notify(); //Tell all subscribed components to reload
    }, {}, {})
  }

  /**
   * 
   * @param preferences 
   */
  async save(preferences: {key:Keys, value:Values}[]) {
    const newPreferences:any = {},
      user_id = Login.currentUserId,
      workspace_id = "all",
      company_id = "all";

    preferences.map(({key, value})=> newPreferences[key] = value);

    const collection = Collection.get(this.url, NotificationPreferencesResource);
    const currentPreferences = collection.findOne({user_id, workspace_id, company_id});

    await collection.upsert(
      new NotificationPreferencesResource({
        ...currentPreferences.data,
        preferences: {
          ...currentPreferences.data.preferences,
          ...newPreferences
        }
      })
    );

    FeedbackMessageManager.success(Languages.t('services.user.notification_parameters_update_alert'), 3);
  }


  areNotificationsAllowed() {
    const _is_in_period = (a:number, b:number) => {
      const currentDate = new Date().getHours() + Math.floor(new Date().getMinutes() / 30) / 2;
      if (a != null && b != null) {
        if (a < b && currentDate >= a && currentDate < b) {
          return true;
        }
        if (a > b && (currentDate >= a || currentDate < b)) {
          return true;
        }
      }
      return false;
    }

    const _transform_period = (a:any, b:any, offset:number) => {
      a = parseFloat(a);
      b = parseFloat(b);
  
      if (offset > 0) {
        offset += -24;
      }
  
      a += offset;
      b += offset;
  
      if (a < 0 || b < 0) {
        a += 24;
        b += 24;
  
        if (b >= 24) {
          if (a < b) {
            b += -24;
          } else {
            b += -24;
            const c = b;
            b = a;
            a = c;
          }
        }
  
        if (a >= 24) {
          if (b < a) {
            a += -24;
          } else {
            a += -24;
            const c = a;
            a = b;
            b = c;
          }
        }
      }
  
      return [a, b];
    }

    if (this.notificationPreferences) {
      const nightBreakIntrv = _transform_period(
        this.notificationPreferences.data.preferences.night_break.from,
        this.notificationPreferences.data.preferences.night_break.to,
        -new Date().getTimezoneOffset() / 60,
      );

      const isNightBreak = _is_in_period(nightBreakIntrv[0], nightBreakIntrv[1]);
      const isDeactivate = moment.unix(this.notificationPreferences.data.preferences.deactivate_notifications_until).diff(moment());

      return isNightBreak ? false : isDeactivate > 0 ? false : true;
    }

    return false;
  } 

  /**
   * 
   * @param timeToAdd Time to add
   * @param format Unit of time
   */
  deactivateNotificationsUntil(timeToAdd:number, format:'s'|'m'|'h'|'d'|'y') {
    const unixtimestamp = moment().add(timeToAdd, format).unix();

    this.save([{key:"deactivate_notifications_until", value:unixtimestamp}])
  }
}

export default new NotificationParametersService();