import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import Icon from 'components/Icon/Icon.js';
import Mlist from 'services/Apps/Messages/MessagesList.js';
import Numbers from 'services/utils/Numbers.js';
import Message from '../Message/Message.js';
import MessagesScroller from './MessagesScroller.js';
import UserService from 'services/user/user.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import WritingUsers from './WritingUsers.js';

export default class MessagesList extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    window.test_message_list = this;

    this.state = {
      i18n: Languages,
      loading: false,
      last_message: null,
    };

    this.fixedToBottom = true;
    this.positions = {};

    this.key = this.props.channel.id + '_' + this.props.parentMessageId;

    if (!Mlist.states[this.key]) {
      Mlist.states[this.key] = {};
    }

    Languages.addListener(this);
    Collections.get('messages').addListener(this);

    this.messages_collection_key = this.props.messagesCollectionKey;

    if (
      !Mlist.states[this.key] &&
      !(Collections.get('messages').sources[this.messages_collection_key] || {}).did_first_load
    ) {
      console.log('loading set to true A');
      this.state.loading = true;
    }

    Collections.get('messages').addSource(
      {
        http_base_url: 'discussion',
        http_options: {
          channel_id: this.props.channel.id,
          parent_message_id: this.props.parentMessageId,
          limit: 20,
          _http_force_load: !Mlist.states[this.key].visible_max_id,
        },
        websockets: [{ uri: 'messages/' + this.props.channel.id, options: { type: 'messages' } }],
      },
      this.messages_collection_key,
      res => {
        this.state.loading = false;
        var tmp = res.filter(message => message.parent_message_id == this.props.parentMessageId);
        if (
          tmp.length < 20 ||
          (tmp.length > 0 && (tmp[0].hidden_data || {}).type == 'init_channel')
        ) {
          Mlist.states[this.key].know_first_message = true;
        }
        Mlist.states[this.key].detached = false;
        Mlist.states[this.key].know_last_message = true;
        this.clearIdInRange();
        this.clearIdInWindow();
        this.addIdInRange((tmp[0] || {}).id);
        this.addIdInRange((tmp[tmp.length - 1] || {}).id);
        this.setVisibleWindow(
          (tmp[0] || {}).id,
          (tmp[tmp.length - 1] || {}).id,
<<<<<<< HEAD
          (tmp[tmp.length - 1] || {}).id
        );
      }
=======
          (tmp[tmp.length - 1] || {}).id,
        );
      },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
  componentDidMount() {
    MessagesService.registeredMessageList[
      this.props.channel.id + '_' + (this.props.parent_message_id || '')
    ] = this;
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('messages').removeListener(this);

    if (this.messages_collection_key) {
      Collections.get('messages').removeSource(this.messages_collection_key);
    }
  }
  componentWillUpdate(nextProps, nextState) {
    MessagesService.registeredMessageList[
      nextProps.channel.id + '_' + (this.props.parent_message_id || '')
    ] = this;
    var tmp = Collections.get('messages')
      .findBy({ channel_id: this.props.channel.id, parent_message_id: this.props.parentMessageId })
      .filter(message => !message._user_ephemeral)
      .sort((a, b) => a.creation_date - b.creation_date);
    if (tmp.length > 0 && (tmp[tmp.length - 1] || {}).id && Mlist.states[this.key].max_id) {
      if (
        !this.fixedToBottom &&
        this.state.last_message &&
        this.last_message_viewed != this.state.last_message.id
      ) {
        //Show last message on bottom
        nextState.showLastMessage = tmp[tmp.length - 1];
        if (this.showLastMessageTimeout) clearTimeout(this.showLastMessageTimeout);
        this.showLastMessageTimeout = setTimeout(() => {
          this.last_message_viewed = this.state.showLastMessage.id;
          this.setState({ showLastMessage: false });
        }, 5000);
      }

      nextState.last_message = tmp[tmp.length - 1];
      if (Mlist.states[this.key].max_id == Mlist.states[this.key].window_max_id) {
        this.addIdInWindow((tmp[tmp.length - 1] || {}).id);
      }
      if (Mlist.states[this.key].max_id == Mlist.states[this.key].visible_max_id) {
        Mlist.states[this.key].visible_max_id = (tmp[tmp.length - 1] || {}).id;
      }
      Mlist.states[this.key].max_id = (tmp[tmp.length - 1] || {}).id;
    }
    return true;
  }
  addIdInRange(id) {
    if (!id) {
      return;
    }
    if (!Mlist.states[this.key].min_id) {
      Mlist.states[this.key].min_id = id;
    }
    if (!Mlist.states[this.key].max_id) {
      Mlist.states[this.key].max_id = id;
    }
    Mlist.states[this.key].min_id = Numbers.minTimeuuid(Mlist.states[this.key].min_id, id);
    Mlist.states[this.key].max_id = Numbers.maxTimeuuid(Mlist.states[this.key].max_id, id);
    if (!Mlist.states[this.key].detached) {
      this.addIdInWindow(id);
    }
  }
  clearIdInRange() {
    Mlist.states[this.key].min_id = null;
    Mlist.states[this.key].max_id = null;
  }
  addIdInWindow(id) {
    if (!id) {
      return;
    }
    if (!Mlist.states[this.key].window_min_id) {
      Mlist.states[this.key].window_min_id = id;
    }
    if (!Mlist.states[this.key].window_max_id) {
      Mlist.states[this.key].window_max_id = id;
    }
    Mlist.states[this.key].window_min_id = Numbers.minTimeuuid(
      Mlist.states[this.key].window_min_id,
<<<<<<< HEAD
      id
    );
    Mlist.states[this.key].window_max_id = Numbers.maxTimeuuid(
      Mlist.states[this.key].window_max_id,
      id
=======
      id,
    );
    Mlist.states[this.key].window_max_id = Numbers.maxTimeuuid(
      Mlist.states[this.key].window_max_id,
      id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
  clearIdInWindow() {
    Mlist.states[this.key].window_min_id = null;
    Mlist.states[this.key].window_max_id = null;
  }
  setVisibleWindow(min, current, max) {
    Mlist.states[this.key].visible_min_id = min;
    Mlist.states[this.key].visible_current_id = current;
    Mlist.states[this.key].visible_max_id = max;
  }
  loadRange(offset, limit, callback, force) {
    if (this.state.loading && !force) {
      return;
    }

    if (
      offset == Mlist.states[this.key].max_id &&
      Mlist.states[this.key].know_last_message &&
      limit <= 0
    ) {
      return false;
    }
    if (
      offset == Mlist.states[this.key].min_id &&
      Mlist.states[this.key].know_first_message &&
      limit >= 0
    ) {
      return false;
    }

    this.setState({ loading: true });
    Collections.get('messages').sourceLoad(
      this.messages_collection_key,
      { offset: offset, limit: limit },
      res => {
        this.state.loading = false;

        var tmp = res.filter(message => message.parent_message_id == this.props.parentMessageId);

        if (callback) callback(tmp);

        if (tmp.length < Math.abs(limit)) {
          if (limit < 0) {
            Mlist.states[this.key].know_last_message = true;
          } else {
            Mlist.states[this.key].know_first_message = true;
          }
          console.log('no more in this direction');
        }

        if (tmp.length == 0) {
          return;
        }

        var min = (tmp[0] || {}).id;
        var max = (tmp[tmp.length - 1] || {}).id;
        if (Numbers.compareTimeuuid(min, max) > 0) {
          var tmp = max;
          max = min;
          min = tmp;
        }

        //If this loaded window cross the all known consecutive messages window we are no longer detached
        if (
          Numbers.compareTimeuuid(max, Mlist.states[this.key].min_id) >= 0 &&
          Mlist.states[this.key].detached
        ) {
          Mlist.states[this.key].detached = false;
          this.addIdInRange(Mlist.states[this.key].window_min_id);
          this.clearIdInWindow();
          this.addIdInWindow(min);
          this.addIdInWindow(Mlist.states[this.key].max_id);
        }

        if (!Mlist.states[this.key].detached) {
          this.addIdInRange(min);
          this.addIdInRange(max);
        } else {
          this.addIdInWindow(min);
          this.addIdInWindow(max);
        }

        //If changed window we recalculate visible min and max around current "centered" message
        if (!Mlist.states[this.key].visible_max_id || !Mlist.states[this.key].visible_min_id) {
          if (
            !Mlist.states[this.key].visible_max_id &&
            Numbers.compareTimeuuid(max, Mlist.states[this.key].visible_current_id) > 0
          ) {
            Mlist.states[this.key].visible_max_id = max;
          }
          if (
            !Mlist.states[this.key].visible_min_id &&
            Numbers.compareTimeuuid(min, Mlist.states[this.key].visible_current_id) < 0
          ) {
            Mlist.states[this.key].visible_min_id = min;
          }
        } else {
          //Else we just move current window

          if (Numbers.compareTimeuuid(max, Mlist.states[this.key].visible_max_id) > 0) {
            Mlist.states[this.key].visible_min_id = Mlist.states[this.key].visible_current_id;
            Mlist.states[this.key].visible_current_id = Mlist.states[this.key].visible_max_id;
            Mlist.states[this.key].visible_max_id = max;
          } else if (Numbers.compareTimeuuid(min, Mlist.states[this.key].visible_min_id) < 0) {
            Mlist.states[this.key].visible_max_id = Mlist.states[this.key].visible_current_id;
            Mlist.states[this.key].visible_current_id = Mlist.states[this.key].visible_min_id;
            Mlist.states[this.key].visible_min_id = min;
          }
        }
<<<<<<< HEAD
      }
=======
      },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
  showMessage(id) {
    if (!id) {
      return;
    }

    var old_detached = Mlist.states[this.key].detached;
    var old_min = Mlist.states[this.key].visible_min_id;
    var old_current = Mlist.states[this.key].visible_current_id;
    var old_max = Mlist.states[this.key].visible_max_id;

    this.clearIdInWindow();
    if (Numbers.compareTimeuuid(id, Mlist.states[this.key].min_id) >= 0) {
      Mlist.states[this.key].detached = false;
    } else {
      Mlist.states[this.key].detached = true;
    }

    this.setVisibleWindow(id, id, null);
    this.node_messages_scroller.fixedToBottom = false;
    this.loadRange(id, -20, r => {
      this.state.loading = true;
      if (r.length == 0) {
        AlertManager.alert(() => {}, {
          text: Languages.t(
            'scenes.apps.messages.messageslist.no_message_alert',
            [],
<<<<<<< HEAD
            'Impossible de trouver ce message.'
=======
            'Impossible de trouver ce message.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          ),
        });
        this.scrollToBottom();
      } else {
        this.node_messages_scroller.fixedToBottom = false;
        this.node_messages_scroller.registerMessageToCenter(id);
        this.node_messages_scroller.contentChanged();
        setTimeout(() => {
          this.setState({ loading: false });
        }, 500);
      }
    });
  }
  scrollToBottom() {
    this.setState({ showLastMessage: false });
    if (Mlist.states[this.key].max_id != Mlist.states[this.key].visible_max_id) {
      this.setVisibleWindow(null, Mlist.states[this.key].max_id, Mlist.states[this.key].max_id);
      this.loadRange(Mlist.states[this.key].max_id, 20, () => {
        this.node_messages_scroller.fixedToBottom = true;
        setTimeout(() => {
          this.node_messages_scroller.scrollToBottom();
        }, 500);
      });
    }
    this.node_messages_scroller.scrollToBottom();
  }
  registerPositionForId(id, dom) {
    this.positions[id] = dom;
  }
  render() {
    if (false) {
      return (
        <div className="messages_list" style={{ display: 'inline-block' }}>
          <a
            onClick={() => {
              this.loadRange(Mlist.states[this.key].visible_min_id, 20);
            }}
          >
            {Languages.t(
              'scenes.apps.messages.messageslist.load_before_button',
              [],
<<<<<<< HEAD
              'Charger avant'
=======
              'Charger avant',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </a>
          <br />
          {Languages.t('scenes.apps.messages.messageslist.connected_to', [], 'Connecté à : ')}
          {this.props.channel.id}
          <br />
          <br />
          {Languages.t('scenes.apps.messages.messageslist.min_id', [], 'Identifiant minimum : ')}
          {Mlist.states[this.key].min_id}
          <br />
          {Languages.t('scenes.apps.messages.messageslist.max_id', [], 'Identifiant maximum : ')}
          {Mlist.states[this.key].max_id}
          <br />
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.min_window_id',
            [],
<<<<<<< HEAD
            'Identifiant de fenêtre minimum : '
=======
            'Identifiant de fenêtre minimum : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {Mlist.states[this.key].window_min_id}
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.max_windoq_id',
            [],
<<<<<<< HEAD
            'Identifiant de fenêtre maximum : '
=======
            'Identifiant de fenêtre maximum : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {Mlist.states[this.key].window_max_id}
          <br />
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.min_visible_id',
            [],
<<<<<<< HEAD
            'Identifiant minimum visible : '
=======
            'Identifiant minimum visible : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {Mlist.states[this.key].visible_min_id}
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.current_visible_id',
            [],
<<<<<<< HEAD
            'Identifiant actuel visible : '
=======
            'Identifiant actuel visible : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {Mlist.states[this.key].visible_current_id}
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.max_visible_id',
            [],
<<<<<<< HEAD
            'Identifiant maximum visible : '
=======
            'Identifiant maximum visible : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {Mlist.states[this.key].visible_max_id}
          <br />
          <br />
          {Languages.t(
            'scenes.apps.messages.messageslist.number_visibled_messages',
            [],
<<<<<<< HEAD
            'Nombre de messages visibles : '
=======
            'Nombre de messages visibles : ',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {
            Collections.get('messages')
              .findBy({
                channel_id: this.props.channel.id,
                parent_message_id: this.props.parentMessageId,
              })
              .filter(
                m =>
                  Mlist.states[this.key].visible_min_id &&
                  Mlist.states[this.key].visible_max_id &&
                  ((!m.id &&
                    Mlist.states[this.key].visible_max_id == Mlist.states[this.key].max_id) ||
                    (m.id &&
                      Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_min_id) >= 0 &&
<<<<<<< HEAD
                      Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_max_id) <= 0))
=======
                      Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_max_id) <= 0)),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              ).length
          }
          <br />

          <br />
          <a
            onClick={() => {
              this.loadRange(Mlist.states[this.key].visible_max_id, -20);
            }}
          >
            {Languages.t(
              'scenes.apps.messages.messageslist.load_after_button',
              [],
<<<<<<< HEAD
              'Charger après'
=======
              'Charger après',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </a>
        </div>
      );
    }

    var previous = null;

    var messages = Collections.get('messages')
      .findBy({
        channel_id: this.props.channel.id,
        parent_message_id: this.props.parentMessageId,
        _user_ephemeral: undefined,
      })
      .filter(
        m =>
          !Mlist.states[this.key].visible_min_id ||
          !Mlist.states[this.key].visible_max_id ||
          (!m.id && Mlist.states[this.key].visible_max_id == Mlist.states[this.key].max_id) ||
          (m.id &&
            Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_min_id) >= 0 &&
<<<<<<< HEAD
            Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_max_id) <= 0)
=======
            Numbers.compareTimeuuid(m.id, Mlist.states[this.key].visible_max_id) <= 0),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      )
      .filter(message => !message._user_ephemeral)
      .sort((a, b) => a.creation_date - b.creation_date);

    /*
    if (this.props.parentMessageId) {
      console.log('rerender list ' + this.props.parentMessageId);
      console.log(
        Collections.get('messages').findBy({
          channel_id: this.props.channel.id,
          parent_message_id: this.props.parentMessageId,
          _user_ephemeral: undefined,
        }),
      );
      console.log(messages);
      console.log(Mlist.states[this.key]);
    }*/

    //Auto scroll to searched or requested message
    var scroll_to_key = this.props.channel.id + '_' + (this.props.parentMessageId || '');
    if (
      messages.length > 0 &&
      MessagesService.futureScrollToMessage[scroll_to_key] &&
      new Date().getTime() - MessagesService.futureScrollToMessage[scroll_to_key].date.getTime() <
        1000 * 10
    ) {
      console.log('WILL SCROLL NOW !', scroll_to_key);
      setTimeout(() => {
        this.showMessage(MessagesService.futureScrollToMessage[scroll_to_key].id);
      }, 100);
      MessagesService.futureScrollToMessage[scroll_to_key] = null;
    }

    return [
      <MessagesScroller
        key="scroller_bloc"
        ref={node => (this.node_messages_scroller = node)}
        lastMessageVisible={
          Mlist.states[this.key].visible_max_id == Mlist.states[this.key].max_id &&
          Mlist.states[this.key].know_last_message
        }
        onFixedBottomChange={state => {
          //console.log("fixed bottom", state);
          if (!state && this.fixedToBottom) {
            this.last_message_viewed = Mlist.states[this.key].max_id;
          }
          if (state && !this.fixedToBottom) {
            this.setState({ showLastMessage: false });
          }
          this.fixedToBottom = state;
        }}
        className={this.state.loading ? 'loading ' : ''}
        getPositions={id => this.positions[id]}
      >
        {messages.length > 0 &&
          !this.state.loading &&
          (Mlist.states[this.key].visible_min_id != Mlist.states[this.key].min_id ||
            !Mlist.states[this.key].know_first_message) && (
            <a
              className="load_before"
              onClick={() => {
                this.loadRange(Mlist.states[this.key].visible_min_id, 20);
              }}
            >
              {Languages.t(
                'scenes.apps.messages.messageslist.load_before—button',
                [],
<<<<<<< HEAD
                'Charger avant'
=======
                'Charger avant',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </a>
          )}

        <div className="messages_flex">
          {messages.map((message, index) => {
            if (!message) {
              return '';
            }
            var _previous = previous;
            previous = message;
            return (
              <Message
                isLastMessage={index == messages.length - 1}
                key={message.front_id}
                messagesCollectionKey={this.props.messagesCollectionKey}
                message={message}
                previousMessage={_previous || {}}
                unreadAfter={this.props.unreadAfter}
                hasTimeline={true}
                refDom={node => this.registerPositionForId(message.id, node)}
              />
            );
          })}
        </div>

        {messages.length > 0 &&
          !this.state.loading &&
          (Mlist.states[this.key].visible_max_id != Mlist.states[this.key].max_id ||
            !Mlist.states[this.key].know_last_message) && [
            <a
              key="load_after_1"
              className="load_after"
              onClick={() => {
                this.loadRange(Mlist.states[this.key].visible_max_id, -20);
              }}
            >
              {Languages.t(
                'scenes.apps.messages.messageslist.load_after_button',
                [],
<<<<<<< HEAD
                'Charger après'
=======
                'Charger après',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </a>,
            <a
              key="load_after_2"
              className="load_end"
              onClick={() => {
                this.loadRange(Mlist.states[this.key].max_id, -20);
              }}
            >
              {Languages.t(
                'scenes.apps.messages.messageslist.go_last_message_button',
                [],
<<<<<<< HEAD
                'Aller au dernier message'
=======
                'Aller au dernier message',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </a>,
          ]}
      </MessagesScroller>,
      <div
        key="last_message"
        className={
          'new_messages_bottom_container ' + (this.state.showLastMessage ? 'visible ' : '')
        }
      >
        {this.state.last_message && (
          <div
            className="new_messages_bottom"
            onClick={() => {
              this.scrollToBottom();
            }}
          >
            <Icon type="arrow-down" className="left_icon" />
            {Collections.get('users').find(this.state.last_message.sender) && (
              <div
                className="user-image"
                style={{
                  backgroundImage:
                    "url('" +
                    UserService.getThumbnail(
<<<<<<< HEAD
                      Collections.get('users').find(this.state.last_message.sender)
=======
                      Collections.get('users').find(this.state.last_message.sender),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    ) +
                    "')",
                }}
              />
            )}
            {PseudoMarkdownCompiler.compileToSimpleHTML(
              MessagesService.prepareContent(
                this.state.last_message.content,
<<<<<<< HEAD
                this.state.last_message.user_specific_content
              )
=======
                this.state.last_message.user_specific_content,
              ),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
        )}
      </div>,
      <WritingUsers
        key="writing_bloc"
        channel={this.props.channel}
        parentId={this.props.parentMessageId}
      />,
    ];
  }
}
