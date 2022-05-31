import React from 'react';
import Observable from 'app/deprecated/CollectionsV1/observable.js';
import Workspace from 'app/deprecated/workspaces/workspaces.js';
import Api from 'app/features/global/framework/api-service';
import { Message, MessageExtended, ThumbnailType } from 'features/messages/types/message';
import { ChannelType } from 'features/channels/types/channel';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import FileAPIClient from 'app/features/files/api/file-upload-api-client.ts';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { UserType } from 'features/users/types/user';
import Strings from 'features/global/utils/strings';
import Workspaces from 'deprecated/workspaces/workspaces';
import { delayRequest } from 'features/global/utils/managedSearchRequest';
import { FileType, FileUploadDataObjectType, MetaDataType } from 'features/files/types/file';

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
  }

  isOpen() {
    return this._isOpen;
  }

  clear() {
    this.setValue('');

    this.results.messages = [];
    this.results.channels = [];
    this.results.users = [];

    // this.recent.messages = [];
    this.recent.channels = [];
    this.recent.files = [];
    this.recent.media = [];
    // this.recent.users = [];

    this.notify();
  }

  open() {
    this._isOpen = true;
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

  public async recentContacts(): Promise<void> {
    this.recent.channels = await ChannelAPIClient.recent(Workspaces.currentGroupId, 10);
  }

  public async recentFiles(): Promise<void> {
    this.recent.files = await FileAPIClient.recent(Workspaces.currentGroupId, 'file', 10);
  }

  public async recentMedia(): Promise<void> {
    this.recent.media = await FileAPIClient.recent(Workspaces.currentGroupId, 'media', 10);
  }

  public async getRecent() {
    this.searchInProgress = true;
    await Promise.all([this.recentContacts()]);
    // await Promise.all([this.recentContacts(), this.recentFiles(), this.recentMedia()]);
    this.searchInProgress = false;
    this.notify();
  }

  search() {
    this.searchInProgress = true;
    delayRequest('search-service', () => {
      if (this.value) {
        if (this.value.length > 1) {
          this.notify();
          Promise.all([this.searchMessages(), this.searchChannels(), this.searchUsers()]).then(
            () => {
              this.searchInProgress = false;
              this.notify();
            },
          );
        }
      } else {
        this.clear();
        this.searchInProgress = false;
        this.notify();
      }
    });
  }
}

const search = new SearchService();
export default search;
