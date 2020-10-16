import React, { Component } from 'react';
import Emojione from 'components/Emojione/Emojione';
import './EmojiPicker.scss';
import Languages from 'services/languages/languages.js';
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';
export default class EmojiPicker extends React.Component {
  /*
        props = {
            preferedEmoji : Array of emoji's shortname
            onChange : called when a smiley is selected
        }
    */
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      suggestions: [],
      currentTitle: '',
      availableCategories: [],
      scrollToRow: 0,
      loaded: false,
    };
    this.currentTitleIndex = 100000;
    this.clickScrollToRow = 0;
  }
  componentWillUnmount() {}
  onUpdate(item) {}
  onRemove(item, ev) {}
  onChange(list) {
    if (list.length > 0) {
      if (this.props.onChange) {
        this.props.onChange(list[0]);
      }
      this.setState({ list: [] });
    }
  }
  renderItemChoosen(item) {
    return (
      <div className="itemResult itemResultChoosen">
        <Emojione type={(item || {}).shortname} />
      </div>
    );
  }
  renderItem(item) {
    return (
      <div className="itemResult hoverable">
        <Emojione type={item.shortname} />
      </div>
    );
  }
  scrollToCategory(category) {
    var index = 0;
    this.state.suggestions.forEach((item, i) => {
      if (item.value == category) {
        index = i;
        return false;
      }
    });
    this.clickScrollToRow = index;
    if (this.state.scrollToRow != index) {
      this.setState({ scrollToRow: index });
    } else {
      this.list_node.forceUpdateGrid();
    }
  }
  select(emoji) {
    if (this.picker) {
      this.picker.onSelect(emoji);
    } else {
      this.onChange([emoji]);
    }
  }
  getPrefered() {
    var pref = this.props.preferedEmoji || [
      ':thumbsup:',
      ':thumbsdown:',
      ':hearts:',
      ':tada:',
      ':smile:',
      ':confused:',
    ];
    if (this.props.selected && pref.indexOf(this.props.selected) < 0) {
      pref.unshift(this.props.selected);
    }
    return pref;
  }
  componentDidMount() {
    setTimeout(() => {
      this.setState({ loaded: true });
    }, 300);
  }
  render() {
    if (!this.state.loaded) {
      return <div style={{ height: 356 }}></div>;
    }
    return (
      <div className="menu-cancel-margin">
        <Picker
          set="apple"
          showPreview={false}
          showSkinTones={false}
          autoFocus
          perLine={6}
          onSelect={this.props.onChange}
          color={'var(--primary)'}
          emojiSize={20}
        />
      </div>
    );
  }
}
