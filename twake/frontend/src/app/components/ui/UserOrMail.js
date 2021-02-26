import React, { Component } from 'react';
import './elements.scss';
import { Avatar, Col, Typography } from 'antd';
import UsersService from 'services/user/user.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';

const { Text } = Typography;
export default class UserOrMail extends React.Component {
  constructor(props) {
    super();
    Collections.get('users').addListener(this);
  }
  componentWillUnmount() {
    Collections.get('users').removeListener(this);
  }
  render() {
    var text = '';
    var item = this.props.item;
    var id = this.props.item.id || this.props.item;

    if (typeof item == 'string' && (item.indexOf('@') >= 0 || item.indexOf('+') == 0)) {
      text = [
        <div className="icon">
          <div className="user_head email">{item.indexOf('+') == 0 ? item : '@'}</div>
        </div>,
        <div className="text" style={{ fontStyle: 'italic' }}>
          {item}
        </div>,
      ];
    } else {
      var item = Collections.get('users').find(id);
      if (!item) {
        UsersService.asyncGet(id);
        return '';
      } else {
        Collections.get('users').listenOnly(this, [item.front_id]);
        text = [
          <Col className="icon">
            <Avatar size={20} src={UsersService.getThumbnail(item)} />
          </Col>,
          <Col className="text" flex="auto">
            <Text strong>{UsersService.getFullName(item)}</Text>
            <Text>{item.email ? ', ' + item.email : ''}</Text>
          </Col>,
        ];
      }
    }

    return text;
  }
}
