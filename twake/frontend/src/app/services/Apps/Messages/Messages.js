import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import CurrentUser from 'services/user/current_user.js';
import UserService from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import ChannelsService from 'services/channels/channels.js';
import Workspaces from 'services/workspaces/workspaces.js';
import MenusManager from 'services/Menus/MenusManager.js';
import FilePicker from 'components/Drive/FilePicker/FilePicker.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';

import Globals from 'services/Globals.js';
import MessageEditors from './MessageEditors';

class Messages extends Observable {
  constructor() {
    super();
    this.setObservableName('app_messages_service');
    this.editedMessage = {};
    this.respondedMessage = {};
    this.current_ephemeral = {};
    this.edited_message_raw = [];
    this.registeredMessageList = {};
    this.futureScrollToMessage = {};

    Globals.window.msgService = this;

    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    Collections.get('messages').addWebsocketListener(this.onWebsocketMessage);

    this.writing_status = {};
    this.my_writing_status = {};
  }

  onWebsocketMessage(data) {
    if (data.type == 'writing') {
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

  iamWriting(channel, parentId, state) {
    if (this.writingTimeout) clearTimeout(this.writingTimeout);
    if (state) {
      this.writingTimeout = setTimeout(() => {
        this.iamWriting(channel, parentId, false);
      }, 4000);
    }
    if (this.my_writing_status[channel + '_' + parentId] == state) {
      return;
    }
    this.my_writing_status[channel + '_' + parentId] = state;
    Collections.get('messages').publishWebsocket({
      type: 'writing',
      status: state,
      parent_message: parentId,
      channel: channel,
      user: UserService.getCurrentUserId(),
    });
  }

  getWritingUsers(channel, parentId) {
    var obj = {};
    if (parentId) {
      obj = this.writing_status[channel + '_' + parentId] || {};
    } else {
      obj = this.writing_status[channel] || {};
    }
    var users = [];
    Object.keys(obj).forEach(user_id => {
      if (obj[user_id] + 5000 > new Date().getTime()) {
        users.push(user_id);
      } else {
        delete obj[user_id];
      }
    });
    return users;
  }

  getFileSystemMessage(strlen, multiple = false) {
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

  async sendMessage(value, options, collectionKey) {
    return new Promise(resolve => {
      if (Globals.window.mixpanel_enabled)
        Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Send Message');

      value = PseudoMarkdownCompiler.transformChannelsUsers(value);
      var channel = Collections.get('channels').find(options.channel_id);

      if (value[0] == '/') {
        var app = null;
        var app_name = value.split(' ')[0].slice(1);
        WorkspacesApps.getApps().map(_app => {
          if (_app.simple_name == app_name) {
            app = _app;
          }
        });

        if (!app) {
          AlertManager.alert(() => {}, {
            text: Languages.t(
              'services.apps.messages.no_command_possible',
              [value, app_name],
              "Nous ne pouvons pas executer la commande '$1' car '$2' n'existe pas ou ne permet pas de créer des commandes.",
            ),
            title: Languages.t(
              'services.apps.messages.no_app',
              [],
              "Cette application n'existe pas.",
            ),
          });
          resolve(false);
          return;
        }
        var data = {
          command: value.split(' ').slice(1).join(' '),
          channel: channel,
          parent_message: options.parent_message_id
            ? Collections.get('messages').find(options.parent_message_id) || null
            : null,
        };

        WorkspacesApps.notifyApp(app.id, 'action', 'command', data);

        resolve(false);
        return;
      }

      options = options || {};

      var message = Collections.get('messages').edit();
      var val = PseudoMarkdownCompiler.compileToJSON(value);

      const editorManager = MessageEditorsManager.get(options.channel_id);
      let filesAttachements =
        editorManager.filesAttachements[options.parent_message_id || 'main'] || [];

      const filesAttachementsToTwacode =
        filesAttachements.map(id => {
          return {
            type: 'file',
            mode: filesAttachements.length > 1 ? 'mini' : 'preview',
            content: id,
          };
        }) || {};

      const fileSystemMessage = this.getFileSystemMessage(
        val.original_str.length,
        filesAttachementsToTwacode.length > 1,
      );

      const preparedFiles = filesAttachementsToTwacode.length
        ? [...fileSystemMessage, ...filesAttachementsToTwacode]
        : [];

      val.files = preparedFiles;
      val.prepared.push({ type: 'nop', content: preparedFiles });
      message.channel_id = options.channel_id;
      message.parent_message_id = options.parent_message_id || '';
      message.sender = CurrentUser.get().id;

      if (message.parent_message_id) {
        var parent = Collections.get('messages').find(message.parent_message_id);
        Collections.get('messages').completeObject(
          { responses_count: parent.responses_count + 1 },
          parent.front_id,
        );
        Collections.get('messages').share(parent);
      }

      message.hidden_data = {};
      message.pinned = false;
      message.responses_count = 0;

      const max_message_time = Collections.get('messages')
        .findBy({ channel_id: options.channel_id })
        .map(i => i.creation_date)
        .reduce((a, b) => a + b, 0);
      message.creation_date = new Date().getTime() / 1000 + 1000; //To be on the bottom
      message.content = val;

      ChannelsService.markFrontAsRead(channel.id, message.creation_date);

      Collections.get('messages').save(message, collectionKey, message => {
        ChannelsService.markFrontAsRead(channel.id);
        ChannelsService.incrementChannel(channel);
        resolve(message);
      });

      CurrentUser.updateTutorialStatus('first_message_sent');
    });
  }

  triggerApp(channelId, threadId, app, from_icon, evt) {
    if (app.simple_name == 'twake_drive') {
      var menu = [];
      var has_drive_app = ChannelsService.getChannelForApp(app.id, Workspaces.currentWorkspaceId);
      if (has_drive_app) {
        menu.push({
          type: 'react-element',
          reactElement: () => (
            <FilePicker
              mode={'select_file'}
              onChoose={file => MessageEditors.get(channelId).onAddAttachment(threadId, file)}
            />
          ),
        });
      }

      MenusManager.openMenu(menu, { x: evt.clientX, y: evt.clientY }, 'center');
      return;
    }

    if ((((app.display || {}).messages_module || {}).in_plus || {}).should_wait_for_popup) {
      WorkspacesApps.openAppPopup(app.id);
    }

    var data = {
      channel: Collections.get('channels').find(channelId),
      parent_message: (threadId ? Collections.get('messages').find(threadId) : null) || null,
      from_icon: from_icon,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'open', data);
  }

  startEditingLastMessage(options) {
    let filter = {
      channel_id: options.channel_id,
      sender: CurrentUser.get().id,
    };
    if (options.parent_message_id !== undefined) {
      filter.parent_message_id = options.parent_message_id;
    }
    const last_message = Collections.get('messages')
      .findBy(filter)
      .filter(a => a.message_type == 0 || a.message_type == null)
      .sort((a, b) => b.creation_date - a.creation_date)[0];
    if (
      last_message &&
      new Date().getTime() / 1000 - last_message.creation_date < 60 * 60 * 24 * 7
    ) {
      MessageEditors.get(last_message.channel_id).openEditor(
        last_message.parent_message_id,
        last_message.id,
        'edition',
      );
    }
  }

  dropMessage(message, message_container, collectionKey) {
    if (!message) {
      return;
    }

    if (
      (!message_container && !message.parent_message_id) ||
      (message_container &&
        (message.id == message_container.id || message.parent_message_id == message_container.id))
    ) {
      return;
    }

    var moved = [];
    var old_count = message.responses_count || 0;
    if (message.responses_count > 0) {
      //Move all children in new parent
      Collections.get('messages')
        .findBy({ channel_id: message.channel_id, parent_message_id: message.id })
        .forEach(message => {
          Collections.get('messages').completeObject(
            { parent_message_id: message_container.id },
            message.front_id,
          );
          moved.push(message);
        });

      message.responses_count = 0;
    }

    var old_parent = null;
    if (message.parent_message_id) {
      old_parent = Collections.get('messages').find(message.parent_message_id);
      if (old_parent) {
        Collections.get('messages').completeObject(
          { responses_count: old_parent.responses_count - 1 },
          old_parent.front_id,
        );
      }
    }

    var new_parent = null;
    if (message_container) {
      new_parent = Collections.get('messages').find(message_container.id);
      Collections.get('messages').completeObject(
        { responses_count: new_parent.responses_count + 1 + Math.max(old_count, moved.length) },
        new_parent.front_id,
      );
    }

    message._once_replace_message = message.id;
    message._once_replace_message_parent_message = message.parent_message_id || '';

    message.parent_message_id = message_container ? message_container.id : '';

    Collections.get('messages').completeObject(message, message.front_id);
    Collections.get('messages').save(message, collectionKey, () => {
      var parent = Collections.get('messages').find(message.parent_message_id);
      if (parent && parent.parent_message_id != '') {
        Collections.get('messages').updateObject(
          { parent_message_id: parent.parent_message_id },
          message.front_id,
        );
      }

      if (old_parent) Collections.get('messages').share(old_parent);
      if (new_parent) Collections.get('messages').share(new_parent);

      moved.forEach(message => {
        Collections.get('messages').share(message);
      });
    }); //Call a notify
  }

  react(message, reaction, messagesCollectionKey) {
    if (reaction == message._user_reaction) {
      reaction = '';
    }

    (message.reactions[message._user_reaction] || {}).count =
      ((message.reactions[message._user_reaction] || {}).count || 1) - 1;
    if ((message.reactions[message._user_reaction] || {}).count <= 0) {
      delete message.reactions[message._user_reaction];
    }
    if (reaction) {
      (message.reactions[reaction] || {}).count =
        ((message.reactions[reaction] || {}).count || 0) + 1;
    }

    Collections.get('messages').completeObject({ _user_reaction: reaction }, message.front_id);
    Collections.get('messages').save(message, messagesCollectionKey);
    MessageEditors.get(message.channel_id).closeEditor();
  }

  pinMessage(message, value, messagesCollectionKey) {
    Collections.get('messages').completeObject({ pinned: value }, message.front_id);
    Collections.get('messages').save(message, messagesCollectionKey);
  }

  deleteMessage(message, messagesCollectionKey) {
    if (message.parent_message_id) {
      var parent = Collections.get('messages').find(message.parent_message_id);
      Collections.get('messages').completeObject(
        { responses_count: parent.responses_count - 1 },
        parent.front_id,
      );
      Collections.get('messages').share(parent);
    }

    Collections.get('messages').remove(message, messagesCollectionKey);
  }

  editMessage(messageId, value, messagesCollectionKey) {
    this.editedMessage = Collections.get('messages').find(messageId);
    let content = PseudoMarkdownCompiler.compileToJSON(value);

    let preparedFiles = this.editedMessage.content.files;
    if (preparedFiles) {
      content.prepared.push({ type: 'nop', content: preparedFiles });
    }

    this.editedMessage.content = Object.assign(this.editedMessage.content, content);
    Collections.get('messages').completeObject(this.editedMessage, this.editedMessage.front_id);
    Collections.get('messages').save(this.editedMessage, messagesCollectionKey);
  }

  prepareContent(_content, user_specific_content) {
    var content = _content;

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

    var modifiers = user_specific_content[CurrentUser.get().id];

    if (Object.keys(modifiers).length == 0) {
      return content;
    }

    var recursPrepareContent = (object, keys) => {
      if (!object) {
        return object;
      }
      if (object.content) {
        var child = object.content;
        var keys = keys;
        if (object.key && keys[object.key]) {
          child = keys[object.key];
          keys = [];
        }
        var replacement = {
          content: recursPrepareContent(child, keys),
        };
        Object.keys(object).forEach(key => {
          if (key != 'content') {
            replacement[key] = object[key];
          }
        });
        return replacement;
      } else if (object.length && object.map) {
        return object.map(o => recursPrepareContent(o, keys));
      } else {
        return object;
      }
    };

    return recursPrepareContent(content, modifiers);
  }

  setCurrentEphemeral(app, message, messagesCollectionKey) {
    if (
      this.current_ephemeral[app.id] &&
      (this.current_ephemeral[app.id][0].id != message.id ||
        this.current_ephemeral[app.id][0].front_id != message.front_id)
    ) {
      this.deleteMessage(this.current_ephemeral[app.id][0], this.current_ephemeral[app.id][1]);
      this.current_ephemeral[app.id] = false;
    }
    this.current_ephemeral[app.id] = [message, messagesCollectionKey];
  }

  showMessage(id) {
    const message = Collections.get('messages').find(id);
    const channel = Collections.get('channels').find(message.channel_id);
    ChannelsService.select(channel, true, { threadId: id });
  }

  scrollToMessage(channel, parent_id, id) {
    var registeredMessageList = this.registeredMessageList[channel + '_' + parent_id];
    if (registeredMessageList && registeredMessageList.showMessage) {
      registeredMessageList.showMessage(id);
    } else {
      this.futureScrollToMessage[channel + '_' + parent_id] = { id: id, date: new Date() };
    }
  }
}

const service = new Messages();
export default service;
