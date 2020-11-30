import Observable from 'app/services/Observable/Observable';
import _ from 'lodash';

export type ViewTypes =
  | 'channel'
  | 'channel_thread'
  | 'channel_pinned'
  | 'channel_files'
  | 'application'
  | '';

export type ViewConfiguration = {
  app?: any; //In depreciated app is used
  collection?: any;
};

const defaultConfiguration: ViewConfiguration = {
  app: 'messages',
  collection: null,
};

export default class AppViewService extends Observable {
  private id: string = '';
  private configuration: ViewConfiguration = defaultConfiguration;

  public getViewType(): ViewTypes {
    return '';
  }

  public getId() {
    return this.id;
  }

  public getConfiguration() {
    return this.configuration;
  }

  public select(id: string, configuration?: ViewConfiguration) {
    this.id = id;
    this.configuration = _.merge(defaultConfiguration, configuration);
    this.notify();
  }
}
