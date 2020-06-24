import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import CurrentUser from 'services/user/current_user.js';
import Input from './Input/Input.js';
import Message from './Message/Message.js';
import UploadZone from 'components/Uploads/UploadZone.js';
import 'moment-timezone';
import './Messages.scss';
import Loader from 'components/Loader/Loader.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import MenusManager from 'services/Menus/MenusManager.js';
import FilePicker from 'components/Drive/FilePicker/FilePicker.js';
import MessagesList from './MessagesList/MessagesList.js';
import ChannelsService from 'services/channels/channels.js';

export default class MainView extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      i18n: Languages,
      messages_repository: Collections.get('messages'),
      users_repository: Collections.get('users'),
      auto_scroll_activated: true,
    };

    this.options = this.props.options || {};

    Languages.addListener(this);
    Collections.get('messages').addListener(this);
    MessagesService.addListener(this);

    this.parentMessageId = this.options.threadId || '';
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('messages').removeListener(this);
    MessagesService.removeListener(this);

    /*if(this.messages_collection_key){
      Collections.get("messages").removeSource(this.messages_collection_key);
    }*/
  }
  componentWillMount() {
    this.did_mount = false;
    this.onUpdate();
  }
  componentWillUpdate() {
    this.onUpdate();
  }
  onMediumPopupClose() {
    MessagesService.showMessage('');
  }
  onUpdate() {
    this.messages_collection_key = 'messages_' + this.props.channel.id + '_' + this.parentMessageId;
  }
  sendMessage(val) {
    this.input.setValue('');

    MessagesService.iamWriting(this.props.channel.id, this.parentMessageId, false);
    MessagesService.sendMessage(
      val,
      {
        channel_id: this.props.channel.id,
        parent_message_id: this.parentMessageId || '',
      },
      this.messages_collection_key,
    );
    if (this.message_list_node) {
      this.message_list_node.scrollToBottom();
    }
  }
  triggerApp(app, from_icon, evt) {
    if (app.simple_name == 'twake_drive') {
      var channelId = this.props.channel.id;

      var menu = [
        {
          text: Languages.t('scenes.apps.messages.select_computer', [], 'Select from computer'),
          onClick: () => {
            this.upload_zone.open();
          },
        },
      ];
      var has_drive_app = ChannelsService.getChannelForApp(app.id, Workspaces.currentWorkspaceId);
      if (has_drive_app) {
        menu.push({
          text: Languages.t('scenes.apps.messages.select_twake', [], 'Select in Documents'),
          submenu: [
            {
              type: 'react-element',
              reactElement: () => (
                <FilePicker
                  mode={'select_file'}
                  onChoose={file =>
                    DriveService.sendAsMessage(channelId, this.parentMessageId, file)
                  }
                />
              ),
            },
          ],
        });
      }

      MenusManager.openMenu(menu, { x: evt.clientX, y: evt.clientY }, 'center');
      return;
    }

    if ((((app.display || {}).messages_module || {}).in_plus || {}).should_wait_for_popup) {
      WorkspacesApps.openAppPopup(app.id);
    }
    var data = {
      channel: this.props.channel,
      parent_message:
        (this.props.messageDetails
          ? Collections.get('messages').find(this.parentMessageId)
          : null) || null,
      from_icon: from_icon,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'open', data);
  }
  render() {
    //Add delay to make everything look more fast (loading all message add delay)
    if (!this.did_mount) {
      setTimeout(() => {
        this.did_mount = true;
        this.setState({});
      }, 10);
    }

    if (!this.last_messages || true) {
      //this.state.messages_repository.did_change > this.last_messages_change){
      this.last_messages = this.state.messages_repository
        .findBy({ channel_id: this.props.channel.id, parent_message_id: '' })
        .filter(message => !message._user_ephemeral)
        .sort((a, b) => a.creation_date - b.creation_date);
      this.last_messages_change = this.state.messages_repository.did_change;
    }
    var messages = this.last_messages;

    if (this.state.auto_scroll_activated) {
      this.last_message_viewed = this.last_messages[this.last_messages.length - 1];
    }

    var channelId = this.props.channel.id;
    var parentMessageId = this.parentMessageId;

    var ephemerals_messages = this.state.messages_repository
      .findBy({
        channel_id: this.props.channel.id,
        parent_message_id: this.parentMessageId,
        _user_ephemeral: true,
      })
      .filter(message => {
        try {
          if (message.ephemeral_message_recipients) {
            return (message.ephemeral_message_recipients || []).indexOf(CurrentUser.get().id) >= 0;
          }
        } catch (e) {}
        return true;
      })
      .sort((a, b) => a.creation_date - b.creation_date);

    return (
      <div className="app">
        <div className={'messages_app ' + (this.props.messageDetails ? 'in_modal ' : '')}>
          <UploadZone
            className="messages_main"
            ref={node => (this.upload_zone = node)}
            disableClick
            parent={''}
            driveCollectionKey={this.messages_collection_key}
            uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
            onUploaded={file => {
              DriveService.sendAsMessage(channelId, this.parentMessageId, file);
            }}
            multiple={false}
            allowPaste={true}
          >
            {this.parentMessageId && Collections.get('messages').find(this.parentMessageId) && (
              <div className="message_header">
                <Message
                  messagesCollectionKey={this.messages_collection_key}
                  message={Collections.get('messages').find(this.parentMessageId)}
                  previousMessage={{}}
                  new={false}
                  measure={() => {}}
                  hasTimeline={false}
                  disableResponses
                />
              </div>
            )}

            {(!this.state.messages_repository.sources[this.messages_collection_key] ||
              this.state.messages_repository.sources[this.messages_collection_key].http_loading) &&
              messages.length == 0 && (
                <div className="loading">
                  <Loader color="#92929C" className="app_loader" />
                </div>
              )}

            <div className="messages_list">
              <MessagesList
                ref={node => (this.message_list_node = node)}
                key={this.props.channel.id}
                messagesCollectionKey={this.messages_collection_key}
                channel={this.props.channel}
                parentMessageId={parentMessageId}
              />

              {ephemerals_messages.length > 0 && (
                <div className="ephemerals">
                  <div className="ephemerals_text">
                    {Languages.t(
                      'scenes.apps.messages.just_you',
                      [],
                      'Visible uniquement par vous',
                    )}
                  </div>
                  {ephemerals_messages.map(message => {
                    if (!message) {
                      return '';
                    }
                    return (
                      <Message
                        messagesCollectionKey={this.messages_collection_key}
                        message={message}
                        previousMessage={{}}
                        new={false}
                        measure={() => {}}
                        hasTimeline={false}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <DroppableZone
              className="bottom_input"
              types={['message']}
              onDrop={data =>
                MessagesService.dropMessage(data.data, null, this.messages_collection_key)
              }
            >
              <Input
                localStorageIdentifier={this.props.channel.id}
                enableAutoFocus
                ref={node => (this.input = node)}
                onResize={() => {
                  return this.node_infinite_messages && this.node_infinite_messages.onUpdate();
                }}
                onSend={val => {
                  this.sendMessage(val);
                }}
                onEditLastMessage={() => {
                  MessagesService.startEditingLastMessage({
                    channel_id: this.props.channel.id,
                    parent_message_id:
                      (this.props.messageDetails ? this.parentMessageId : undefined) || undefined,
                  });
                }}
                triggerApp={(app, from_icon, evt) => this.triggerApp(app, from_icon, evt)}
                onChange={() => {
                  MessagesService.iamWriting(this.props.channel.id, this.parentMessageId, true);
                }}
                disabled={this.parentMessageId != this.parentMessageId}
                onFocus={() => MessagesService.startRespond(false)}
              />
            </DroppableZone>
          </UploadZone>

          {/*<div className="messages_bar">

          </div>*/}
        </div>
      </div>
    );
  }
}
