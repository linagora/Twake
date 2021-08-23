import React, { Component } from 'react';
import Picker from 'components/Picker/Picker.js';
import Icon from 'components/Icon/Icon.js';
import './UserPicker.scss';
import User from 'components/ui/User.js';
import UsersService from 'services/user/UserService';
import Languages from 'services/languages/languages';

export default class UserPicker extends React.Component {
  /*
        hello
    */
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      currentSelected: [],
      inputValue: '',
      currentList: [],
      selected: [],
    };
  }
  componentWillUnmount() {}
  onUpdate(item) {}
  onRemove(item, ev) {}
  renderItem(item, withEditor) {
    return (
      <div
        className={
          'itemContoured ' + (withEditor ? 'itemSelected ' : '') + (this.props.mini ? 'mini ' : '')
        }
      >
        <User data={item} mini={this.props.mini} />

        {!this.props.readOnly && withEditor && (
          <div
            className="close"
            onClick={ev => {
              this.picker.onRemove(item);
              ev.stopPropagation();
              ev.preventDefault();
            }}
          >
            <Icon type="close" />
          </div>
        )}
      </div>
    );
  }
  search(text, cb) {
    UsersService.search(text, { scope: this.props.scope || 'all' }, res => {
      cb(res);
    });
    //cb(Collections.get("users").findBy({}))
  }
  render() {
    return (
      <Picker
        className="userPicker"
        ref={picker => {
          this.picker = picker;
        }}
        title={
          this.props.title || Languages.t('components.drive.modify_uslist', [], 'Modify user list')
        }
        search={(text, cb) => {
          this.search(text, cb);
        }}
        renderItem={item => {
          return this.renderItem(item, false);
        }}
        renderItemChoosen={item => {
          return this.renderItem(item, true);
        }}
        renderItemSimply={item => {
          item = item || {};
          return item.username;
        }}
        max={10}
        onSelect={item => this.onSelect(item)}
        onChange={this.props.onChange}
        value={this.props.value}
        readOnly={this.props.readOnly}
        inline={this.props.inline}
      />
    );
  }
}
