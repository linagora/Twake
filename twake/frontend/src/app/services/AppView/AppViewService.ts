import Observable from 'app/services/Observable/Observable';

export type ViewConfiguration = {
  app: any; //In depreciated app is used
  type: 'channel' | 'channel_thread' | 'channel_pinned' | 'channel_files' | 'application' | '';
};

export default class AppViewService extends Observable {
  public getViewType(): ViewConfiguration['type'] {
    return '';
  }
}
