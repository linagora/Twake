import moment from 'moment';

import Observable from 'app/deprecated/Observable/Observable';
import Languages from 'app/features/global/services/languages-service';
import { ToasterService as Toaster } from 'app/features/global/services/toaster-service';
import Login from 'app/features/global/services/login-service';
import { Collection } from '../CollectionsReact/Collections';
import {
  preferencesType,
  NotificationPreferencesResource,
} from 'app/features/users/types/notification-preferences-type';

type Keys = keyof preferencesType;
type Values = preferencesType[Keys];

class NotificationPreferencesService extends Observable {
  url = '/notifications/v1/preferences/';
  notificationPreferences!: NotificationPreferencesResource;

  async init(): Promise<void> {
    const collection = Collection.get(this.url, NotificationPreferencesResource);

    collection.addWatcher(
      () => {
        //Will be called each time something happen on this collection
        this.notificationPreferences = collection.findOne({}, { withoutBackend: true }); //Get preferences from collection store
        this.notify(); //Tell all subscribed components to reload
      },
      {},
      {},
    );
  }

  /**
   *
   * @param preferences
   */
  async save(preferences: { key: Keys; value: Values }[]): Promise<void> {
    const newPreferences: any = {};
    const user_id = Login.currentUserId;
    const workspace_id = 'all';
    const company_id = 'all';

    preferences.map(({ key, value }) => (newPreferences[key] = value));

    const collection = Collection.get(this.url, NotificationPreferencesResource);
    const currentPreferences = collection.findOne({ user_id, workspace_id, company_id });

    await collection.upsert(
      new NotificationPreferencesResource({
        ...currentPreferences.data,
        preferences: {
          ...currentPreferences.data.preferences,
          ...newPreferences,
        },
      }),
    );

    Toaster.success(Languages.t('services.user.notification_parameters_update_alert'), 3);
  }

  areNotificationsAllowed(): boolean {
    if (this.notificationPreferences) {
      const nightBreakIntrv = this.transformPeriod(
        this.notificationPreferences.data.preferences.night_break.from,
        this.notificationPreferences.data.preferences.night_break.to,
        -new Date().getTimezoneOffset() / 60,
      );

      const isNightBreak = this.isInPeriod(nightBreakIntrv[0], nightBreakIntrv[1]);
      const isDeactivate = moment
        .unix(this.notificationPreferences.data.preferences.deactivate_notifications_until)
        .diff(moment());

      return isNightBreak ? false : isDeactivate > 0 ? false : true;
    }

    return false;
  }

  /**
   *
   * @param timeToAdd Time to add
   * @param format Unit of time
   */
  deactivateNotificationsUntil(timeToAdd: number, format: 's' | 'm' | 'h' | 'd' | 'y'): void {
    this.save([
      { key: 'deactivate_notifications_until', value: moment().add(timeToAdd, format).unix() },
    ]);
  }

  private isInPeriod(a: number, b: number): boolean {
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

  private transformPeriod(
    start: number | string,
    end: number | string,
    offset: number,
  ): [any, any] {
    let a = Number(start);
    let b = Number(end);

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
}

export default new NotificationPreferencesService();
