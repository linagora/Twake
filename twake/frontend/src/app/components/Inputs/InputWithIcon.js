import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione';
import MenusManager from 'services/Menus/MenusManager.js';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import Input from 'components/Inputs/Input.js';
import './Inputs.scss';

export default class InputWithIcon extends React.Component {
  constructor(props) {
    super();
    this.allChanEmojies = [
      ':fire_engine:',
      ':scroll:',
      ':newspaper:',
      ':factory:',
      ':package:',
      ':mailbox:',
      ':moneybag:',
      ':smiley_cat:',
      ':sunglasses:',
      ':8ball:',
      ':dart:',
      ':joystick:',
      ':video_game:',
      ':bar_chart:',
      ':crystal_ball:',
      ':speech_balloon:',
      ':bulb:',
      ':deciduous_tree:',
      ':palm_tree:',
      ':earth_americas:',
      ':open_file_folder:',
      ':penguin:',
      ':seedling:',
      ':sailboat:',
    ];
  }
  componentWillMount() {
    this.randomizeEmojies();
  }
  randomizeEmojies() {
    this.allChanEmojies.sort((a, b) => {
      if (b == this.props.value[0]) {
        return -1;
      }
      if (a == this.props.value[0]) {
        return 1;
      }
      return Math.floor(Math.random() * 3) - 1;
    });
  }
  outsideMenuListener() {
    this.closeEmojiPicker();
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.outsideClickListener);
  }
  componentDidMount() {
    if (this.props.focusOnDidMount && this.input) {
      this.input.focus();
    }
    this.outsideClickListener = event => {
      if (
        this.emojiPickerIsOpen &&
        this.emojipicker_dom &&
        !this.emojipicker_dom.contains(event.target) &&
        document.contains(event.target)
      ) {
        this.outsideMenuListener();
      }
    };
    this.outsideClickListener = this.outsideClickListener.bind(this);
    document.addEventListener('click', this.outsideClickListener);
  }
  closeEmojiPicker() {
    if (!this.emojiPickerIsOpen) {
      return;
    }

    if (this.props.menu_level !== undefined) {
      MenusManager.closeSubMenu(this.props.menu_level);
    } else {
      MenusManager.closeMenu();
    }

    this.emojiPickerIsOpen = false;
  }
  openEmojiPicker() {
    if (this.emojiPickerIsOpen) {
      return;
    }

    var preferedEmojis = [this.props.value[0]];
    if (this.props.preferedEmoji) {
      preferedEmojis = this.props.preferedEmoji;
    } else {
      this.randomizeEmojies();
      for (var i = 0; i < 5; i++) {
        preferedEmojis[i + 1] = this.allChanEmojies[i];
      }
    }

    var menu = [
      {
        type: 'react-element',
        className: 'menu-cancel-margin',
        reactElement: () => {
          return (
            <EmojiPicker
              refDom={node => (this.emojipicker_dom = node)}
              onChange={emoji => this.selectEmoji(emoji)}
            />
          );
        },
      },
    ];
    var elementRect = window.getBoundingClientRect(this.emoji_dom);
    elementRect.x = elementRect.x || elementRect.left;
    elementRect.y = elementRect.y || elementRect.top;
    if (this.props.menu_level !== undefined) {
      MenusManager.openSubMenu(menu, elementRect, this.props.menu_level, 'bottom');
    } else {
      MenusManager.openMenu(menu, elementRect, 'bottom');
    }

    setTimeout(() => {
      this.emojiPickerIsOpen = true;
    }, 200);
  }
  selectEmoji(emoji) {
    this.closeEmojiPicker();
    var value = [emoji.native, this.props.value[1]];
    this.onChange(value);
  }
  onChange(value) {
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }
  render() {
    var icon = this.props.value[0];
    if (!this.props.value[0]) {
      this.onChange([this.allChanEmojies[0], this.props.value[1]]);
      icon = this.allChanEmojies[0];
    }
    return (
      <div className="full_width input_with_emoji">
        <div
          className="emoji"
          ref={node => (this.emoji_dom = node)}
          onClick={evt => {
            this.openEmojiPicker();
          }}
        >
          <Emojione type={icon} />
        </div>
        <Input
          className="full_width medium"
          autoFocus
          refInput={obj => (this.input = obj)}
          type="text"
          placeholder={this.props.placeholder}
          value={this.props.value[1]}
          onEnter={this.props.onEnter}
          onChange={evt => {
            if (this.onChange) this.onChange([this.props.value[0], evt.target.value]);
          }}
        />
      </div>
    );
  }
}
