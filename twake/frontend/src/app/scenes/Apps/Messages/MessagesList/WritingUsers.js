import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import UserService from 'services/user/user.js';
import MessagesService from 'services/Apps/Messages/Messages.js';

export default class WritingUsers extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
    Collections.get('messages').addListener(this);
    MessagesService.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('messages').removeListener(this);
    MessagesService.removeListener(this);
  }
  componentDidUpdate() {
    var writing_users = MessagesService.getWritingUsers(this.props.channel.id, this.props.parentId);
    if (writing_users.length > 0) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.setState({});
      }, 5000);
    }
  }
  render() {
    var writing_users = MessagesService.getWritingUsers(this.props.channel.id, this.props.parentId);

    if (writing_users.length == 0) {
      return '';
    }

    var phrase = Languages.t(
      'scenes.apps.messages.messageslist.get_writing_users',
      [],
      "sont en train d'écrire..."
    );
    if (writing_users.length == 1) {
      phrase = Languages.t(
        'scenes.apps.messages.messageslist.get_writing_user',
        [],
        "est en train d'écrire..."
      );
    }

    return [
      <div className="writing_message">
        {writing_users
          .map(id => {
            return UserService.getFullName(Collections.get('users').find(id));
          })
          .join(', ')}{' '}
        {phrase}
      </div>,
    ];
  }
}
