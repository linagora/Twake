import React from 'react';
import Languages from 'app/features/global/services/languages-service';
import Observable from 'app/deprecated/CollectionsV1/observable.js';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import UserService from 'app/features/users/services/current-user-service';
import DepreciatedCollections, {
  Collection,
} from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Collections from 'app/deprecated/CollectionsReact/Collections';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import ChannelsService from 'app/deprecated/channels/channels.js';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import MenusManager from 'app/components/menus/menus-manager.js';
import FilePicker from 'components/drive/file-picker/file-picker.js';
import MessageEditorManager from './message-editor-service-factory';
import { ChannelType } from 'app/features/channels/types/channel';
import SideViewService from 'app/features/router/services/side-view-service';
import { Message, MessageFileType } from '../types/message';
import { Application } from 'app/features/applications/types/application';
import {
  getCompanyApplications,
  getCompanyApplication,
} from 'app/features/applications/state/company-applications';
import Groups from 'app/deprecated/workspaces/groups.js';
import MainViewService from 'app/features/router/services/main-view-service';
import MessageExternalFilePicker from 'app/views/applications/messages/input/parts/MessageExternalFilePicker';
import FileUploadAPIClient from 'app/features/files/api/file-upload-api-client';

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

  async showMessage(id?: string, channel?: ChannelType) {
    if (!id) return;

    const message = this.collection.find(id);

    SideViewService.select(channel?.id || '', {
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
    return null;
  }

  getCollection(channelId: string, companyId?: string, workspaceId?: string | null) {
    return null;
  }
}

export default new Messages();
