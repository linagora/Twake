import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import Twacode from 'components/Twacode/Twacode.js';
import User from 'services/user/user.js';
import Emojione from 'components/Emojione/Emojione.js';
import Moment from 'react-moment';
import Icon from 'components/Icon/Icon.js';
import moment from 'moment';
import 'moment-timezone';
import Loader from 'components/Loader/Loader.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import Draggable from 'components/Draggable/Draggable.js';
import Responses from './Responses.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import MessageOptions from './MessageOptions.js';
import Input from '../Input/Input.js';
import Button from 'components/Buttons/Button.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Tooltip from 'components/Tooltip/Tooltip.js';
import Globals from 'services/Globals.js';
import './Message.scss';
import MenusManager from 'services/Menus/MenusManager.js';
import UserCard from 'app/components/UserCard/UserCard.js';
import ChannelsService from 'services/channels/channels.js';
import DragIndicatorRoundedIcon from '@material-ui/icons/DragIndicatorRounded';

import FirstMessage from './Types/FirstMessage.js';

export default class Message extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      messages_repository: Collections.get('messages'),
      users_repository: Collections.get('users'),
      app_messages_service: MessagesService,
      is_hover: false,
      is_hover_handler: false,
      is_selected: false,
      loading_interaction: false,
      userCard: false,
    };

    Languages.addListener(this);
    Collections.get('messages').addListener(this);
    Collections.get('users').addListener(this);
    MessagesService.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('messages').removeListener(this);
    Collections.get('users').removeListener(this);
    MessagesService.removeListener(this);
    if (this.state.workspaces_apps) {
      WorkspacesApps.removeListener(this);
    }
    clearTimeout(this.loading_interaction_timeout);
  }
  componentDidUpdate() {
    if (this.node) {
      var message_height = this.node.clientHeight;
      if (this.old_height && this.props.measure && this.old_height != message_height) {
        this.old_height = message_height;
        this.props.measure();
      }
    }
  }
  componentWillUpdate(nextProps, nextState) {
    if (JSON.stringify(this.props.message.content) != this.saved_content) {
      nextState.loading_interaction = false;
      clearTimeout(this.loading_interaction_timeout);
      this.saved_content = JSON.stringify(this.props.message.content);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    /*var stringified = JSON.stringify([
      this.props.message, this.props.previousMessage, this.props.new, this.props.hasTimeline,
      this.state.is_hover, this.state.is_selected, this.state.loading_interaction
    ]);
    if(stringified != this.saved_stringified){
      this.saved_stringified = stringified;
      return true;
    }
    return false;*/
    return true;
  }

  displayUserCard(user) {
    if (!this.props.message.application_id) {
      let box = window.getBoundingClientRect(this.user_details);
      this.setState({ userCard: !this.state.userCard });

      MenusManager.openMenu(
        [
          {
            type: 'react-element',
            reactElement: () => (
              <UserCard user={user} onClick={() => ChannelsService.openDiscussion([user.id])} />
            ),
          },
        ],
        box,
        null,
        { margin: 8 },
      );
    }
  }

  dropMessage(message) {
    if (Globals.window.mixpanel_enabled) {
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Send respond Event');
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Drop message Event');
    }
    MessagesService.dropMessage(message, this.props.message, this.props.messagesCollectionKey);
  }
  editMessage() {
    this.state.app_messages_service.edited_message_raw[this.props.message.front_id] =
      this.state.app_messages_service.edited_message_raw[this.props.message.front_id] !== undefined
        ? this.state.app_messages_service.edited_message_raw[this.props.message.front_id]
        : PseudoMarkdownCompiler.compileToText(this.props.message.content);
    MessagesService.editMessage(
      this.state.app_messages_service.edited_message_raw[this.props.message.front_id],
      this.props.messagesCollectionKey,
    );
    this.state.app_messages_service.edited_message_raw[this.props.message.front_id] = undefined;
    this.setState({});
  }
  onInteractiveMessageAction(action_id, context, passives, evt) {
    var app_id = this.props.message.application_id;
    var type = 'interactive_message_action';
    var event = action_id;
    var data = {
      interactive_context: context,
      form: passives,
      message: this.props.message,
    };
    WorkspacesApps.notifyApp(app_id, type, event, data);
  }
  onAction(type, id, context, passives, evt) {
    if (type == 'interactive_action') {
      this.setState({ loading_interaction: true });
      clearTimeout(this.loading_interaction_timeout);
      this.loading_interaction_timeout = setTimeout(() => {
        this.setState({ loading_interaction: false });
      }, 5000);
      this.onInteractiveMessageAction(id, context, passives, evt);
    }
  }
  render() {
    var user = null;

    if (this.props.message.sender) {
      user = this.state.users_repository.known_objects_by_id[this.props.message.sender];
      if (!user) {
        User.asyncGet(this.props.message.sender);
      } else {
        this.state.users_repository.listenOnly(this, [user.front_id]);
      }
    }

    var listenOnly = [this.props.message.front_id];
    if (this.props.previousMessage && this.props.previousMessage.front_id) {
      listenOnly.push(this.props.previousMessage.front_id);
    }
    this.state.messages_repository.listenOnly(this, listenOnly);

    var isFirstNewMessage = this.props.message.creation_date > this.props.unreadAfter;

    var show_user =
      isFirstNewMessage ||
      this.props.previousMessage.sender != this.props.message.sender ||
      this.props.previousMessage.sender == null ||
      this.props.message.responses_count > 0 ||
      this.props.previousMessage.responses_count > 0 ||
      this.props.message.creation_date - this.props.previousMessage.creation_date > 60 * 5 || //5 minutes
      this.props.message.pinned;
    var canDropIn = !this.props.isResponse;
    var canDrag = true;
    var className =
      ' ' +
      (isFirstNewMessage ? 'new ' : '') +
      (this.props.isResponse ? 'response ' : '') +
      (show_user ? '' : 'without_title ') +
      (this.state.is_selected ? 'is_selected ' : '') +
      (this.props.message.pinned ? 'pinned ' : '');
    +(this.props.message.starred ? 'starred ' : '');

    var message = '';
    var app = null;
    if (this.props.message.message_type == 2) {
      //System message
      if ((this.props.message.hidden_data || {}).type == 'init_channel') {
        message = <FirstMessage channelId={this.props.message.channel_id} />;
      }

      canDrag = false;
      canDropIn = false;
      className += ' system';
    } else {
      if (this.props.message.message_type == 1) {
        //App message

        if (!this.state.workspaces_apps) {
          this.state.workspaces_apps = WorkspacesApps;
          WorkspacesApps.addListener(this);
        }

        var app = Collections.get('applications').find(this.props.message.application_id) || {};
        if (!app.id) {
          WorkspacesApps.getApp(this.props.message.application_id);
        } else {
          user = {
            username: 'app#' + app.simple_name,
            firstname: app.name,
            lastname: '',
            thumbnail: WorkspacesApps.getAppIcon(app),
          };
        }

        if (this.props.message._user_ephemeral) {
          className += ' ephemeral';
          MessagesService.setCurrentEphemeral(
            app,
            this.props.message,
            this.props.messagesCollectionKey,
          );
        }
        if (
          this.props.message._user_ephemeral ||
          (this.props.message.hidden_data || {}).disable_drag
        ) {
          canDrag = false;
        }
        if (
          this.props.message._user_ephemeral ||
          (this.props.message.hidden_data || {}).disable_responses
        ) {
          canDropIn = false;
        }
      }

      if (this.state.app_messages_service.editedMessage.front_id == this.props.message.front_id) {
        className += ' edited ';
      }

      message = [
        <div
          className={
            'message_bloc_and_response ' +
            (isFirstNewMessage ? 'new ' : '') +
            (this.props.message.responses_count > 0 ? 'has_responses ' : '') +
            (this.props.message.parent_message_id ? 'is_response ' : '')
          }
        >
          <div
            className={'message_bloc ' + className}
            onMouseOver={() => this.setState({ was_hover: true })}
          >
            {this.state.was_hover && (
              <DragIndicatorRoundedIcon
                className={'js-drag-handler handler-icon ' + (app ? 'is_app ' : '')}
              />
            )}

            <div className="sender">
              {show_user && user && (
                <div
                  className={'user-image ' + (app ? 'is_app ' : '')}
                  style={{
                    backgroundImage:
                      "url('" +
                      ((this.props.message.hidden_data || {}).custom_icon ||
                        User.getThumbnail(user)) +
                      "')",
                  }}
                />
              )}
              {!show_user && <div></div>}
            </div>
            <div key="container" className="container">
              <div className="message_container">
                {show_user && (
                  <div className="top">
                    {(this.props.message.hidden_data || {}).custom_title && (
                      <div className="user_fullname">
                        {(this.props.message.hidden_data || {}).custom_title}
                      </div>
                    )}
                    {!(this.props.message.hidden_data || {}).custom_title && user && (
                      <div
                        ref={node => (this.user_details = node)}
                        onClick={() => this.displayUserCard(user)}
                        className="user_fullname"
                      >
                        {User.getFullName(user)}
                      </div>
                    )}
                    {user && user.status_icon && user.status_icon[0] && (
                      <div className="user_status">
                        <Emojione type={user.status_icon[0]} /> {user.status_icon[1]}
                      </div>
                    )}
                    {!this.props.message._user_ephemeral && (
                      <div className="date">
                        <Moment tz={moment.tz.guess()} format="h:mm a" style={{ marginLeft: 5 }}>
                          {this.props.message.creation_date * 1000}
                        </Moment>
                      </div>
                    )}

                    {this.props.message.starred && (
                      <div className="starred">
                        <Icon type="star" />
                        {Languages.t('scenes.apps.messages.message.starred', [], 'Étoilé')}
                      </div>
                    )}
                    {this.props.message.pinned && (
                      <div className="pinned">
                        <Icon type="map-pin-alt" />
                        {Languages.t('scenes.apps.messages.message.pinned', [], 'Épinglé')}
                      </div>
                    )}
                  </div>
                )}

                {this.state.app_messages_service.editedMessage.front_id !=
                  this.props.message.front_id && (
                  <Twacode
                    className="content allow_selection"
                    onDoubleClick={evt => {
                      evt.preventDefault();
                      evt.stopPropagation();
                    }}
                    content={MessagesService.prepareContent(
                      this.props.message.content,
                      this.props.message.user_specific_content,
                    )}
                    id={this.props.message.front_id}
                    isApp={this.props.message.message_type == 1}
                    after={
                      this.props.message.edited &&
                      this.props.message.message_type == 0 && <div className="edited">(edited)</div>
                    }
                    onAction={(type, id, context, passives, evt) =>
                      this.onAction(type, id, context, passives, evt)
                    }
                  />
                )}
                {this.state.app_messages_service.editedMessage.front_id ==
                  this.props.message.front_id && (
                  <div
                    className="content_edited"
                    onDoubleClick={evt => {
                      evt.preventDefault();
                      evt.stopPropagation();
                    }}
                  >
                    <Input
                      onResize={this.props.measure}
                      disableLocalStorage
                      disableSend
                      disableApps
                      value={
                        this.state.app_messages_service.edited_message_raw[
                          this.props.message.front_id
                        ] !== undefined
                          ? this.state.app_messages_service.edited_message_raw[
                              this.props.message.front_id
                            ]
                          : PseudoMarkdownCompiler.compileToText(this.props.message.content)
                      }
                      onChange={val => {
                        this.state.app_messages_service.edited_message_raw[
                          this.props.message.front_id
                        ] = val;
                        this.setState({});
                      }}
                      onSend={val => {
                        this.editMessage();
                      }}
                      onEscape={() => {
                        MessagesService.startEditing(false);
                        this.state.app_messages_service.edited_message_raw[
                          this.props.message.front_id
                        ] = undefined;
                        this.setState({});
                      }}
                    />
                    <Button
                      value={Languages.t(
                        'scenes.apps.messages.message.save_button',
                        [],
                        'Enregistrer',
                      )}
                      className="small right-margin"
                      onClick={() => this.editMessage()}
                    />
                    <Button
                      value={Languages.t(
                        'scenes.apps.messages.message.cancel_button',
                        [],
                        'Annuler',
                      )}
                      className="small secondary"
                      style={{ marginRight: 10 }}
                      onClick={() => {
                        MessagesService.startEditing(false);
                        this.setState({ edited_message_raw: undefined });
                      }}
                    />
                  </div>
                )}

                {!(this.props.message.hidden_data || {}).disable_reactions &&
                  this.props.message.reactions &&
                  Object.keys(this.props.message.reactions).length > 0 && (
                    <div className="reactions">
                      {Object.keys(this.props.message.reactions)
                        .sort(
                          (a, b) =>
                            this.props.message.reactions[b] - this.props.message.reactions[a],
                        )
                        .map(reaction => {
                          var value = (this.props.message.reactions[reaction] || {}).count || 0;
                          var members = Object.values(
                            (this.props.message.reactions[reaction] || {}).users || [],
                          );
                          if (value <= 0) {
                            return '';
                          }
                          return (
                            <Tooltip
                              position="top"
                              className="reaction_container"
                              tooltip={members.map(id => {
                                var user = Collections.get('users').find(id);
                                if (!user) {
                                  return '';
                                }
                                var name = User.getFullName(user);
                                return <div style={{ whiteSpace: 'nowrap' }}>{name}</div>;
                              })}
                            >
                              <div
                                className={
                                  'reaction ' +
                                  (this.props.message._user_reaction == reaction
                                    ? 'is_selected '
                                    : '')
                                }
                                onClick={() => {
                                  MessagesService.react(
                                    this.props.message,
                                    reaction,
                                    this.props.messagesCollectionKey,
                                  );
                                }}
                                onMouseOver={() => {
                                  this.setState({ hover_reaction: reaction });
                                }}
                                onMouseOut={() => {
                                  this.setState({ hover_reaction: '' });
                                }}
                              >
                                <Emojione type={reaction} />
                                {parseInt(value)}
                              </div>
                            </Tooltip>
                          );
                        })}
                    </div>
                  )}

                {this.state.app_messages_service.editedMessage.front_id !=
                  this.props.message.front_id &&
                  this.state.was_hover && (
                    <div
                      className="message_options"
                      onDoubleClick={evt => {
                        evt.preventDefault();
                        evt.stopPropagation();
                      }}
                    >
                      <MessageOptions
                        parent={this}
                        channelId={this.props.message.channel_id}
                        message={this.props.message}
                        messagesCollectionKey={this.props.messagesCollectionKey}
                        disableResponses={this.props.disableResponses}
                      />
                    </div>
                  )}
              </div>

              {!this.props.message._created && <Loader color="#CCC" className="loader_message" />}
            </div>
          </div>
          {!(this.props.message.hidden_data || {}).disable_responses &&
            this.props.message.id &&
            !this.props.message.parent_message_id &&
            !this.props.message._user_ephemeral &&
            !this.props.disableResponses && (
              <Responses
                isLastMessage={this.props.isLastMessage}
                channelId={this.props.message.channel_id}
                parentMessage={this.props.message}
                messagesCollectionKey={this.props.messagesCollectionKey}
                measure={this.props.measure}
              />
            )}
        </div>,
      ];
    }

    if (this.state.loading_interaction) {
      className += ' loading_interaction';
    }

    if (this.props.highlighted) {
      className += ' highlighted';
    }

    return (
      <DroppableZone
        deactivated={!canDropIn}
        types={['message']}
        onDrop={data => this.dropMessage(data.data)}
      >
        {!!(
          !this.props.previousMessage ||
          (this.props.message.creation_date &&
            isFirstNewMessage &&
            this.props.previousMessage.creation_date <= this.props.unreadAfter)
        ) && (
          <div className="message_timeline new_messages">
            <div className="time_container">
              <div className="time">
                {Languages.t('scenes.apps.messages.message.new_messages_bar', [], 'New messages')}
              </div>
            </div>
          </div>
        )}
        {!!(
          !this.props.previousMessage ||
          this.props.message.creation_date - this.props.previousMessage.creation_date > 60 * 60 * 2
        ) && (
          <div className="message_timeline">
            <div className="time_container">
              <div className="time">
                {(new Date().getTime() / 1000 - this.props.message.creation_date > 24 * 60 * 60
                  ? moment(this.props.message.creation_date * 1000).format('LL')
                  : moment(this.props.message.creation_date * 1000).fromNow()) || '-'}
              </div>
            </div>
          </div>
        )}
        <Draggable
          refDraggable={node => {
            this.node = node;
            if (this.props.refDom) {
              this.props.refDom(node);
            }
          }}
          dragHandler="js-drag-handler"
          data={{ type: 'message', data: this.props.message }}
          parentClassOnDrag=""
          onDragStart={evt => {}}
          minMove={10}
          className={'message fade_in'}
          /*onDoubleClick={() => {
            if (canDropIn) {
              MessagesService.showMessage(this.props.message.id);
            }
          }}*/
          deactivated={!canDrag}
        >
          {message}
        </Draggable>
      </DroppableZone>
    );
  }
}
