import Observable from 'app/deprecated/CollectionsV1/observable.js';
import Workspace from 'app/deprecated/workspaces/workspaces.js';
import Api from 'app/features/global/framework/api-service';
import { MessageExtended } from 'features/messages/types/message';
import { ChannelType } from 'features/channels/types/channel';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import FileAPIClient from 'app/features/files/api/file-upload-api-client';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { UserType } from 'features/users/types/user';
import Workspaces from 'deprecated/workspaces/workspaces';
import { delayRequest } from 'features/global/utils/managedSearchRequest';
import { FileType } from 'features/files/types/file';

type ResultTypes = {
  messages: MessageExtended[];
  channels: ChannelType[];
  files: FileType[];
  media: FileType[];
  users: UserType[];
};

class SearchService extends Observable {
  public results: ResultTypes = {} as ResultTypes;
  public recent: ResultTypes = {} as ResultTypes;
  public value: string = '';
  private searchHTTPTimeout: any;
  private searchLoading: boolean = false;
  private _isOpen: boolean = false;
  public searchInProgress: boolean = false;

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
    Promise.all([this.recentContacts(), this.recentFiles(), this.recentMedia()]).then(() => {});
    this.notify();
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

  private searchMessages() {
    this.results.messages = [];
    return Api.get<{ resources: MessageExtended[] }>(
      `/internal/services/messages/v1/companies/${Workspace.currentGroupId}/search?q=${this.value}`,
    ).then(res => {
      this.results.messages = res.resources;
      this.notify();
    });
  }

  private searchChannels() {
    this.results.channels = [];

    return Api.get<{ resources: ChannelType[] }>(
      `/internal/services/channels/v1/companies/${Workspace.currentGroupId}/search?q=${this.value}`,
    ).then(res => {
      this.results.channels = res.resources;
      this.notify();
    });
  }

  private searchUsers() {
    return UserAPIClient.search<UserType>(this.value, {
      scope: 'company',
      companyId: Workspaces.currentGroupId,
    }).then(users => {
      this.results.users = users;
      this.notify();
    });
  }

  private async searchFiles() {
    Api.get<{ resources: MessageExtended[] }>(
      `/internal/services/messages/v1/companies/${Workspace.currentGroupId}/search?q=${this.value}&hasFiles=true&hasMedias=true`,
    ).then(res => {
      this.results.files = [];
      const files = [] as any;
      res.resources.forEach(res => {
        res.files?.forEach(file => {
          files.push(file);
        });
      });
      this.results.files = files;
      this.notify();
    });
  }

  private async searchMedia() {}

  public async recentContacts(): Promise<void> {
    this.recent.channels = await ChannelAPIClient.recent(Workspaces.currentGroupId, 12);
    this.notify();
  }

  public async recentFiles(): Promise<void> {
    this.recent.files = await FileAPIClient.recent(Workspaces.currentGroupId, 'file', 10);
    this.notify();
  }

  public async recentMedia(): Promise<void> {
    this.recent.media = await FileAPIClient.recent(Workspaces.currentGroupId, 'media', 10);
    this.notify();
  }

  search() {
    this.searchInProgress = true;
    delayRequest('search-service', () => {
      if (this.value) {
        if (this.value.length > 1) {
          this.notify();
          Promise.all([
            this.searchMessages(),
            this.searchChannels(),
            this.searchUsers(),
            this.searchFiles(),
          ]).then(() => {
            this.searchInProgress = false;
            this.notify();
          });
        }
      } else {
        this.clear();
        this.searchInProgress = false;
        this.notify();
      }
    });
  }

  readyToSearch() {
    return this.value && this.value.length > 1;
  }

  getFiles() {
    this.readyToSearch() ? this.searchFiles() : this.recentFiles();
  }

  getMedia() {
    this.readyToSearch() ? this.searchMedia() : this.recentMedia();
  }
}

const search = new SearchService();
export default search;
