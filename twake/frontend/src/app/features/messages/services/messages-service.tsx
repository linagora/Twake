import React from 'react';
import Languages from 'services/languages/languages';
import Observable from 'app/services/Depreciated/observable.js';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import UserService from 'app/features/users/services/current-user-service';
import DepreciatedCollections, {
  Collection,
} from 'app/services/Depreciated/Collections/Collections.js';
import Collections from 'app/services/CollectionsReact/Collections';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager';
import ChannelsService from 'app/deprecated/channels/channels.js';
import Workspaces from 'services/workspaces/workspaces.js';
import MenusManager from 'app/components/menus/menus-manager.js';
import FilePicker from 'components/drive/file-picker/file-picker.js';
import MessageEditorManager from './message-editor-service-factory';
import MessagesListServerUtilsManager from './message-loader-factory';
import { ChannelResource, ChannelType } from 'app/features/channels/types/channel';
import SideViewService from 'app/services/AppView/SideViewService';
import { Message, MessageFileType } from '../types/message';
import { Application } from 'app/features/applications/types/application';
import {
  getCompanyApplications,
  getCompanyApplication,
} from 'app/features/applications/state/company-applications';
import Groups from 'services/workspaces/groups.js';
import MainViewService from 'app/services/AppView/MainViewService';
import MessageExternalFilePicker from 'app/views/applications/messages/input/parts/MessageExternalFilePicker';
import FileUploadAPIClient from 'app/components/file-uploads/file-upload-api-client';

class Messages extends Observable {
  editedMessage: { [key: string]: any };
  respondedMessage: { [key: string]: any };
  current_ephemeral: { [key: string]: any };
  edited_message_raw: any;
  registeredMessageList: { [key: string]: any };
  futureScrollToMessage: { [key: string]: any };
  writing_status: { [key: string]: any };
  my_writing_status: { [key: string]: any };
  writingTimeout?: ReturnType<typeof setTimeout>;
  collection: Collection;

  constructor() {
    super();
    this.setObservableName('app_messages_service');
    this.editedMessage = {};
    this.respondedMessage = {};
    this.current_ephemeral = {};
    this.edited_message_raw = [];
    this.registeredMessageList = {};
    this.futureScrollToMessage = {};
    this.collection = DepreciatedCollections.get('messages');

    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.collection.addWebsocketListener(this.onWebsocketMessage);

    this.writing_status = {};
    this.my_writing_status = {};
  }

  onWebsocketMessage(data: any) {
    if (data.type === 'writing') {
      if (!this.writing_status[data.channel + '_' + data.parent_message]) {
        this.writing_status[data.channel + '_' + data.parent_message] = {};
      }
      if (!this.writing_status[data.channel]) {
        this.writing_status[data.channel] = {};
      }
      this.writing_status[data.channel + '_' + data.parent_message][data.user] = data.status
        ? new Date().getTime()
        : 0;
      this.writing_status[data.channel][data.user] = data.status ? new Date().getTime() : 0;
      this.notify();
    }
  }

  iamWriting(channel: string, parentId: string, state: any) {
    if (this.writingTimeout) clearTimeout(this.writingTimeout);
    if (state) {
      this.writingTimeout = setTimeout(() => {
        this.iamWriting(channel, parentId, false);
      }, 4000);
    }
    if (this.my_writing_status[channel + '_' + parentId] === state) {
      return;
    }
    this.my_writing_status[channel + '_' + parentId] = state;
    this.collection.publishWebsocket({
      type: 'writing',
      status: state,
      parent_message: parentId,
      channel: channel,
      user: UserService.getCurrentUserId(),
    });
  }

  getWritingUsers(channel: string, parentId: string) {
    let obj: any = {};
    if (parentId) {
      obj = this.writing_status[channel + '_' + parentId] || {};
    } else {
      obj = this.writing_status[channel] || {};
    }
    let users: any = [];
    Object.keys(obj).forEach(user_id => {
      if (obj[user_id] + 5000 > new Date().getTime()) {
        users.push(user_id);
      } else {
        delete obj[user_id];
      }
    });
    return users;
  }

  getFileSystemMessage(strlen: number, multiple: boolean = false) {
    const user = UserService.getCurrentUser();
    if (strlen === 0) {
      return [
        {
          type: 'system',
          content: multiple
            ? Languages.t('scenes.apps.drive.message_added_mutiple_files', [
                UserService.getFullName(user),
              ])
            : Languages.t('scenes.apps.drive.message_added_file_no_name', [
                UserService.getFullName(user),
              ]),
        },
        { type: 'br' },
      ];
    } else return [{ type: 'br' }];
  }

  async sendMessage(
    value: string,
    options: { [key: string]: any },
    collectionKey: string,
    attachements: MessageFileType[],
  ) {
    return new Promise(async resolve => {
      value = PseudoMarkdownCompiler.transformChannelsUsers(value);
      let channel = await this.findChannel(options.channel_id);

      if (value[0] === '/') {
        let app: any = null;
        let app_name = value.split(' ')[0].slice(1);
        // eslint-disable-next-line array-callback-return
        getCompanyApplications(Groups.currentGroupId).map((_app: any) => {
          if (_app?.identity?.code === app_name) {
            app = _app;
          }
        });

        if (!app) {
          AlertManager.alert(() => {}, {
            text: Languages.t('services.apps.messages.no_command_possible', [value, app_name]),
            title: Languages.t('services.apps.messages.no_app'),
          });

          resolve(false);
          return;
        }
        let data = {
          command: value.split(' ').slice(1).join(' '),
          channel: channel.data,
          parent_message: options.parent_message_id
            ? this.collection.find(options.parent_message_id, () => {}) || null
            : null,
        };

        WorkspacesApps.notifyApp(app.id, 'action', 'command', data);

        resolve(false);
        return;
      }

      options = options || {};

      let message: Message = this.collection.edit(null);
      let val = PseudoMarkdownCompiler.compileToJSON(value);

      message.text = value;
      message.channel_id = options.channel_id;
      message.parent_message_id = options.parent_message_id || '';
      message.sender = CurrentUser.get().id;

      this.updateParentCounter(message);

      message.hidden_data = {};
      message.pinned = false;
      message.responses_count = 0;

      message.files = [
        ...attachements.filter(f => f.metadata?.source !== 'pending').map(file => file),
      ];

      message.creation_date = new Date().getTime() / 1000 + 10; //To be on the bottom
      message.content = val;
      /*
      ChannelsService.markFrontAsRead(channel.id, message.creation_date);
      this.collection.save(message, collectionKey, (message: Message) => {
        if (message) {
          ChannelsService.markFrontAsRead(channel.id);
          ChannelsService.incrementChannel(channel);
        }
        resolve(message);
      });
      */

      //TODO      MessageAPIClient.save("", "", message);
    });
  }

  async retrySendMessage(message: Message, collectionKey: string) {
    (message as any)._retrying = true;
    const channel = await this.findChannel(message.channel_id || '');
    ChannelsService.markFrontAsRead(channel.id, message.creation_date);

    this.collection.save(message, collectionKey, (message: Message) => {
      if (message) {
        ChannelsService.markFrontAsRead(channel.id);
        ChannelsService.incrementChannel(channel);
      }
    });

    CurrentUser.updateTutorialStatus('first_message_sent');
  }

  updateParentCounter(message: Message) {
    if (message.parent_message_id) {
      let parent = this.collection.find(message.parent_message_id);
      this.collection.completeObject(
        { responses_count: parent.responses_count + 1 },
        parent.front_id,
      );
      this.collection.share(parent);
    }
  }

  async triggerApp(channel: ChannelType, threadId: string, app: any, from_icon: any, evt: any) {
    if (app?.identity?.code === 'twake_drive') {
      let menu = [];
      let has_drive_app = getCompanyApplication(app.id);

      if (has_drive_app) {
        menu.push({
          type: 'react-element',
          reactElement: () => {
            let fileHandler: (file: MessageFileType) => void;
            return (
              <MessageExternalFilePicker
                channel={channel}
                threadId={threadId}
                setHandler={handler => (fileHandler = handler)}
              >
                <FilePicker
                  mode="select_file"
                  onChoose={(file: any) => {
                    if (fileHandler)
                      fileHandler({
                        metadata: {
                          external_id: {
                            id: file.id,
                            workspace_id: file.workspace_id,
                            parent_id: file.parent_id,
                            company_id: channel.company_id || '',
                          },
                          source: 'drive',
                          name: file.name,
                          size: parseInt(file.size),
                          mime: FileUploadAPIClient.extensionToMime(file.extension),
                          thumbnails: file.preview_has_been_generated
                            ? [
                                {
                                  mime: 'image/png',
                                  url: file.preview_link,
                                },
                              ]
                            : [],
                        },
                      });
                  }}
                />
              </MessageExternalFilePicker>
            );
          },
        });
      }

      MenusManager.openMenu(menu, { x: evt.clientX, y: evt.clientY }, 'center', {});
      return;
    }

    if ((app as Application).display?.twake?.chat?.input) {
      WorkspacesApps.openAppPopup(app.id);
    }

    let data = {
      channel,
      parent_message: (threadId ? this.collection.find(threadId) : null) || null,
      from_icon: from_icon,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'open', data);
  }

  startEditingLastMessage(options: { [key: string]: any }) {
    let filter: { [key: string]: any } = {
      channel_id: options.channel_id,
      sender: CurrentUser.get().id,
    };

    if (options.parent_message_id !== undefined) {
      filter.parent_message_id = options.parent_message_id;
    }
    const last_message = DepreciatedCollections.get('messages')
      .findBy(filter)
      .filter((a: any) => a.message_type === 0 || a.message_type === null)
      .sort((a: any, b: any) => b.creation_date - a.creation_date)[0];
    if (
      last_message &&
      new Date().getTime() / 1000 - last_message.creation_date < 60 * 60 * 24 * 7
    ) {
      MessageEditorManager.get(last_message.channel_id).openEditor(
        last_message.parent_message_id,
        last_message.id,
        'edition',
      );
    }
  }

  dropMessage(message: any, message_container: Message | null, collectionKey: string) {
    if (!message) {
      return;
    }

    if (
      (!message_container && !message.parent_message_id) ||
      (message_container &&
        (message.id === message_container.id || message.parent_message_id === message_container.id))
    ) {
      return;
    }

    let moved: any = [];
    let old_count = message.responses_count || 0;
    if ((message?.responses_count || 0) > 0) {
      //Move all children in new parent
      DepreciatedCollections.get('messages')
        .findBy({ channel_id: message.channel_id, parent_message_id: message.id })
        .forEach((message: Message) => {
          this.collection.completeObject(
            { parent_message_id: message_container?.id || '' },
            message.front_id,
          );
          moved.push(message);
        });

      message.responses_count = 0;
    }

    let old_parent: any = null;
    if (message.parent_message_id) {
      old_parent = this.collection.find(message.parent_message_id);
      if (old_parent) {
        this.collection.completeObject(
          { responses_count: old_parent.responses_count - 1 },
          old_parent.front_id,
        );
      }
    }

    let new_parent: any = null;
    if (message_container) {
      new_parent = this.collection.find(message_container.id);
      this.collection.completeObject(
        { responses_count: new_parent.responses_count + 1 + Math.max(old_count, moved.length) },
        new_parent.front_id,
      );
    }

    message._once_replace_message = message.id;
    message._once_replace_message_parent_message = message.parent_message_id || '';

    message.parent_message_id = message_container ? message_container.id : '';

    this.collection.completeObject(message, message.front_id);
    this.collection.save(message, collectionKey, () => {
      let parent = this.collection.find(message.parent_message_id);
      if (parent && parent.parent_message_id !== '') {
        this.collection.updateObject(
          { parent_message_id: parent.parent_message_id },
          message.front_id,
        );
      }

      if (old_parent) this.collection.share(old_parent);
      if (new_parent) this.collection.share(new_parent);

      moved.forEach((message: any) => {
        this.collection.share(message);
      });
    }); //Call a notify
  }

  pinMessage(message: Message, value: any, messagesCollectionKey: string) {
    this.collection.completeObject({ pinned: value }, message.front_id);
    this.collection.save(message, messagesCollectionKey);
  }

  deleteMessage(message: Message, messagesCollectionKey: string) {
    if (message.parent_message_id) {
      let parent = this.collection.find(message.parent_message_id);
      this.collection.completeObject(
        { responses_count: parent.responses_count - 1 },
        parent.front_id,
      );
      this.collection.share(parent);
    }

    message.subtype = 'deleted';

    this.collection.remove(message, messagesCollectionKey, null);
    this.collection.completeObject(message, message.front_id);
  }

  editMessage(messageId: string, value: string, messagesCollectionKey: string) {
    this.editedMessage = this.collection.find(messageId);
    let content = PseudoMarkdownCompiler.compileToJSON(value);

    let preparedFiles = this.editedMessage.content.files;
    if (preparedFiles) {
      content.prepared.push({ type: 'br', content: preparedFiles });
    }

    this.editedMessage.content = Object.assign(this.editedMessage.content, content);
    this.collection.completeObject(this.editedMessage, this.editedMessage.front_id);
    this.collection.save(this.editedMessage, messagesCollectionKey);
  }

  prepareContent(_content: { [key: string]: any }, user_specific_content: { [key: string]: any }) {
    let content = _content;

    if (!user_specific_content) {
      return content;
    }

    if (!content) {
      return content;
    }

    if (_content.formatted || _content.prepared) {
      content = _content.formatted || _content.prepared;
    }

    if (!user_specific_content[CurrentUser.get().id]) {
      return content;
    }

    let modifiers = user_specific_content[CurrentUser.get().id];

    if (Object.keys(modifiers).length === 0) {
      return content;
    }

    let recursPrepareContent = (object: { [key: string]: any }, keys: any) => {
      if (!object) {
        return object;
      }
      if (object.content) {
        let child = object.content;
        if (object.key && keys[object.key]) {
          child = keys[object.key];
          keys = [];
        }
        let replacement: any = {
          content: recursPrepareContent(child, keys),
        };
        Object.keys(object).forEach(key => {
          if (key !== 'content') {
            replacement[key] = object[key];
          }
        });
        return replacement;
      } else if (object.length && object.map) {
        return object.map((o: any) => recursPrepareContent(o, keys));
      } else {
        return object;
      }
    };

    return recursPrepareContent(content, modifiers);
  }

  setCurrentEphemeral(
    app: { [key: string]: any },
    message: Message,
    messagesCollectionKey: string,
  ) {
    if (
      this.current_ephemeral[app.id] &&
      (this.current_ephemeral[app.id][0].id !== message.id ||
        this.current_ephemeral[app.id][0].front_id !== message.front_id)
    ) {
      this.deleteMessage(this.current_ephemeral[app.id][0], this.current_ephemeral[app.id][1]);
      this.current_ephemeral[app.id] = false;
    }
    this.current_ephemeral[app.id] = [message, messagesCollectionKey];
  }

  async showMessage(id?: string) {
    if (!id) return;

    const message = this.collection.find(id);
    const channel = await this.findChannel(message.channel_id);

    SideViewService.select(channel.id, {
      collection: MainViewService.getViewCollection(),
      app: { identity: { code: 'messages' } } as Application,
      context: {
        viewType: 'channel_thread',
        threadId: id,
      },
    });
  }

  scrollToMessage(channel: string, parent_id: string, id: string) {
    let registeredMessageList = this.registeredMessageList[channel + '_' + parent_id];
    if (registeredMessageList && registeredMessageList.showMessage) {
      registeredMessageList.showMessage(id);
    } else {
      this.futureScrollToMessage[channel + '_' + parent_id] = { id: id, date: new Date() };
    }
  }

  async findChannel(channelId: string, companyId?: string, workspaceId?: string) {
    return this.getCollection(channelId, companyId, workspaceId).findOne(
      { id: channelId },
      { withoutBackend: true },
    );
  }

  getCollection(channelId: string, companyId?: string, workspaceId?: string | null) {
    if (!companyId || !workspaceId) {
      const context = MessagesListServerUtilsManager.channelsContextById[channelId];
      companyId = context.companyId;
      workspaceId = context.workspaceId;
    }
    const path = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    return Collections.get(path, ChannelResource);
  }
}

export default new Messages();
