import React, { Component } from 'react';
import Picker from 'components/Picker/Picker.js';
import Emojione from 'components/Emojione/Emojione.js';
import emojiService from 'services/emojis/emojis.js';
import { List } from 'react-virtualized';
import './EmojiPicker.scss';
import Languages from 'services/languages/languages.js';

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
  render() {
    var that = this;

    var bloc_i = 0;
    return (
      <div className="emojiPicker" ref={this.props.refDom}>
        <div className="prefered ">
          {this.getPrefered()
            .slice(0, 6)
            .map(name => {
              return (
                <div
                  className={
                    'menu itemResult emojiPrefered hoverable ' +
                    (this.props.selected == name ? 'is_selected' : '')
                  }
                  onClick={() => {
                    this.select(emojiService.getEmoticon(name) || { id: 0, shortname: name });
                  }}
                >
                  <Emojione type={name} />
                </div>
              );
            })}
        </div>
        {!this.props.noPicker && [
          <Picker
            ref={picker => {
              this.picker = picker;
            }}
            title={false}
            search={(text, cb) => {
              emojiService.search(text, res => {
                var categories = [];
                res.forEach(item => {
                  if (item.type == 'category') {
                    categories.push(item.value);
                  }
                });
                this.setState({ suggestions: res, availableCategories: categories });
              });
            }}
            max={0}
            value={this.state.list}
            onChange={list => this.onChange(list)}
            onChangeSuggested={list => this.setState({ suggestionLength: list.length })}
            renderItem={item => {
              return this.renderItem(item);
            }}
            renderItemChoosen={item => {
              return this.renderItemChoosen(item);
            }}
            renderItemSimply={item => {
              return item.shortname;
            }}
            disableNavigationKey={true}
            placeholder={
              Languages.t('scenes.apps.drive.left.search', [], 'Search') + ' EmojiOne...'
            }
          />,

          <div className="scroller">
            {this.state.suggestions.length > 0 && [
              /*<div className="emoji_top_title">
                          {this.state.currentTitle}
                        </div>,*/
              <List
                ref={node => (this.list_node = node)}
                width={250}
                height={220}
                rowCount={this.state.suggestions.length}
                rowHeight={32.9}
                scrollToAlignment={'start'}
                scrollToIndex={this.state.scrollToRow}
                onScroll={() => (this.clickScrollToRow = false)}
                onRowsRendered={({
                  overscanStartIndex,
                  overscanStopIndex,
                  startIndex,
                  stopIndex,
                }) => {
                  if (startIndex == this.state.scrollToRow - 1) {
                    startIndex = this.state.scrollToRow;
                  }
                  if (this.clickScrollToRow !== false) {
                    startIndex = this.clickScrollToRow;
                  }
                  var category = '';
                  if (this.state.suggestions[startIndex].type == 'category') {
                    category = this.state.suggestions[startIndex].value;
                  } else {
                    category = this.state.suggestions[startIndex][0].category;
                  }
                  if (this.state.currentTitle != category) {
                    this.state.currentTitle = category;
                    this.setState({ currentTitle: category });
                  }
                }}
                rowRenderer={({ key, index, isScrolling, isVisible, style }) => {
                  return (
                    <div
                      className={
                        'bloc ' + (this.state.suggestions[index].type == 'category' ? 'title' : '')
                      }
                      style={style}
                      key={key}
                    >
                      {this.state.suggestions[index].type == 'category' &&
                        this.state.suggestions[index].value}
                      {this.state.suggestions[index].type != 'category' &&
                        this.state.suggestions[index].map(emoji => {
                          if (emoji) {
                            return (
                              <div
                                className={
                                  'menu itemResult hoverable ' +
                                  (this.props.selected == emoji.shortname ? 'is_selected' : '')
                                }
                                onClick={() => this.picker.onSelect(emoji)}
                              >
                                <Emojione type={emoji.shortname} />
                              </div>
                            );
                          }
                        })}
                    </div>
                  );
                }}
              />,
            ]}

            {this.state.suggestions.length == 0 && (
              <div className="menu-text" style={{ marginTop: '20%', textAlign: 'center' }}>
                {Languages.t('components.user_picker.modal_no_result', [], 'Pas de résultats')}{' '}
                <Emojione type={':confused:'} />
              </div>
            )}
          </div>,

          <div className="categories">
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'people' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('people') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('people');
              }}
            >
              <img src={'/public/emojione/categories/people.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'nature' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('nature') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('nature');
              }}
            >
              <img src={'/public/emojione/categories/nature.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'food' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('food') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('food');
              }}
            >
              <img src={'/public/emojione/categories/food.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'activity' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('activity') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('activity');
              }}
            >
              <img src={'/public/emojione/categories/activity.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'travel' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('travel') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('travel');
              }}
            >
              <img src={'/public/emojione/categories/travel.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'objects' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('objects') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('objects');
              }}
            >
              <img src={'/public/emojione/categories/objects.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'symbols' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('symbols') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('symbols');
              }}
            >
              <img src={'/public/emojione/categories/symbols.svg'} />
            </div>
            <div
              className={
                'category ' +
                (this.state.currentTitle == 'flags' ? 'selected ' : '') +
                (this.state.availableCategories.indexOf('flags') < 0 ? 'disabled' : '')
              }
              onClick={() => {
                this.scrollToCategory('flags');
              }}
            >
              <img src={'/public/emojione/categories/flags.svg'} />
            </div>
          </div>,
        ]}
      </div>
    );
  }
}
