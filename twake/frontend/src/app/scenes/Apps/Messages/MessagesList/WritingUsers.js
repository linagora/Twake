<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

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
<<<<<<< HEAD
      "sont en train d'écrire..."
=======
      "sont en train d'écrire...",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
    if (writing_users.length == 1) {
      phrase = Languages.t(
        'scenes.apps.messages.messageslist.get_writing_user',
        [],
<<<<<<< HEAD
        "est en train d'écrire..."
=======
        "est en train d'écrire...",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
