import Observable from 'app/deprecated/CollectionsV1/observable.js';
import { FileSearchResult, MessageExtended } from 'features/messages/types/message';
import { ChannelType } from 'features/channels/types/channel';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import FileAPIClient from 'app/features/files/api/file-upload-api-client';
import UserAPIClient from 'app/features/users/api/user-api-client';
import MessageAPIClient from 'app/features/messages/api/message-api-client';
import { UserType } from 'features/users/types/user';
import Workspaces from 'deprecated/workspaces/workspaces';
import { delayRequest } from 'features/global/utils/managedSearchRequest';
import { FileType } from 'features/files/types/file';
import { isEmpty } from 'lodash';
import Logger from 'features/global/framework/logger-service';

type ResultTypes = {
  messages: MessageExtended[];
  channels: ChannelType[];
  files: FileSearchResult[];
  media: FileSearchResult[];
  users: UserType[];
};

class SearchService extends Observable {
  public results: ResultTypes = {} as ResultTypes;
  public recent: ResultTypes = {} as ResultTypes;
  public value = '';
  private searchHTTPTimeout: any;
  private searchLoading = false;
  private _isOpen = false;
  public searchInProgress = false;
  private currentTab: 'all' | 'chats' | 'media' | 'files' = 'all';
  public recentInProgress = true;
  private logger = Logger.getLogger('SearchService');

  constructor() {
    super();
    this.setObservableName('SearchService');
    // Globals.window.searchPopupService = this;
    this.clear();
    this.recent.channels = [];
    this.recent.files = [];
    this.recent.media = [];
  }

  isOpen() {
    return this._isOpen;
  }

  setCurrentTab(val: 'all' | 'chats' | 'media' | 'files') {
    this.currentTab = val;
    this.search();
    this.notify();
  }

  clear() {
    this.setValue('');

    this.results.messages = [];
    this.results.channels = [];
    this.results.users = [];
    this.results.files = [];

    // this.recent.messages = [];
    // this.recent.users = [];

    this.notify();
  }

  open() {
    this._isOpen = true;
    this.setCurrentTab(this.currentTab);
    this.getRecent().then(a => {
      this.notify();
    });
  }

  close() {
    this._isOpen = false;
    this.notify();
  }

  setValue(text: string) {
    this.value = text;
    this.notify();
  }

  // loadMore() {
  //     this.search(true, { more: true });
  // }

  private async searchMessages(clearResult: boolean, limit?: number) {
    if (clearResult) {
      this.results.messages = [];
    }
    const res = await MessageAPIClient.search(this.value);
    this.results.messages = res.resources;
    this.notify();
  }

  private async searchChannels(clearResult: boolean, limit?: number) {
    if (clearResult) {
      this.results.channels = [];
    }
    const res = await ChannelAPIClient.search(this.value, { limit });
    this.results.channels = res.resources;
    this.logger.debug('search channels, found', res.resources.length);
    this.notify();
  }

  private searchUsers(clearResult: boolean, limit?: number) {
    if (clearResult) {
      this.results.users = [];
    }
    return UserAPIClient.search<UserType>(this.value, {
      scope: 'company',
      companyId: Workspaces.currentGroupId,
    }).then(users => {
      this.results.users = users;
      this.logger.debug('search users, found', users.length);
      this.notify();
    });
  }

  private async searchFiles(clearResult: boolean, limit?: number) {
    if (clearResult) {
      this.results.files = [];
    }
    const res = await MessageAPIClient.searchFile(this.value, {
      limit,
      is_file: true,
    });

    this.results.files = res.resources;
    this.notify();
  }

  private async searchMedia(clearResult: boolean, limit?: number) {
    if (clearResult) {
      this.results.media = [];
    }
    const res = await MessageAPIClient.searchFile(this.value, {
      limit: limit,
      is_media: true,
    });

    this.results.media = res.resources;
    this.logger.debug('Search for media: got ', res.resources.length);

    this.notify();
  }

  public async getRecent(): Promise<void> {
    this.logger.debug('Loading recent');
    this.recentInProgress = true;
    this.notify();

    const promises = [
      ChannelAPIClient.recent(Workspaces.currentGroupId, 14).then(a => {
        this.recent.channels = a;
        this.notify();
      }),

      MessageAPIClient.searchFile(null, {
        limit: 100,
        is_file: true,
      })
        .then(a => {
          this.recent.files = a.resources;
          this.notify();
        })
        .catch(e => {
          this.logger.error(e);
        }),

      MessageAPIClient.searchFile(null, {
        limit: 100,
        is_media: true,
      })
        .then(a => {
          a.resources.sort((a, b) => b.created_at - a.created_at);
          this.recent.media = a.resources;
          this.notify();
        })
        .catch(e => {
          this.logger.error(e);
        }),

      // FileAPIClient.recent(Workspaces.currentGroupId, 'file', 10).then(a => {
      //   this.recent.files = a;
      //   this.notify();
      // }),
      // FileAPIClient.recent(Workspaces.currentGroupId, 'media', 10).then(a => {
      //   this.recent.media = a;
      //   this.notify();
      // }),
    ];

    Promise.any(promises).then(() => {
      this.recentInProgress = false;
      this.logger.debug('Loaded first of items');
      this.notify();
    });
  }

  searchContacts(clearResult: boolean, limit?: number) {
    return Promise.all([
      this.searchChannels(clearResult, limit),
      this.searchUsers(clearResult, limit),
    ]);
  }

  search(clearResult = false) {
    if (!this.value) {
      return;
    }
    this.searchInProgress = true;
    delayRequest(
      'search-service',
      () => {
        if (this.readyToSearch()) {
          let promises = [];
          switch (this.currentTab) {
            case 'all':
              promises = [
                this.searchContacts(clearResult, 12),
                this.searchMedia(clearResult, 10),
                this.searchFiles(clearResult, 4),
                this.searchMessages(clearResult, 12),
              ];
              break;
            case 'chats':
              promises = [
                this.searchContacts(clearResult, 12),
                this.searchMessages(clearResult, 100),
              ];
              break;
            case 'media':
              promises = [this.searchMedia(clearResult, 100)];
              break;
            case 'files':
              promises = [this.searchFiles(clearResult, 100)];
              break;
          }

          // @ts-ignore
          Promise.all(promises)
            .then(a => {
              new Promise(resolve => setTimeout(resolve, 500)).then(() => {
                this.logger.debug(`All searches complete`);
                this.searchInProgress = false;
                this.notify();
              });
            })
            .catch(e => {
              console.error(e);
            });
        }
      },
      { doInitialCall: false, timeout: 750 },
    );
  }

  readyToSearch() {
    return !isEmpty(this.value);
  }
}

const search = new SearchService();
export default search;
