import React, { Component } from 'react';

import './AutoComplete.scss';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import Input from 'components/Inputs/Input.js';

export default class AutoComplete extends Component {
  /*
        props : {
            placeholder : string,
            search : Array of search function,
            max : Array of maximum of proposition
            onSelect : callback on selection
            renderItem(item) : how to render item
            renderItemChoosen(item) : how to add item in input
            regexHooked : on which regex start auto completed ex : /\@([A-z])/ -> check match on [A-z] after @
            onChange
            value
            onChangeCurrentList : return currentList,selected when update of selected proposition or proposition
            hideResult
            onBackspace : when backspace on empty input
            disableNavigationKey
            showResultsOnInit
            position: top / bottom
        }
    */

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      currentList: [],
      currentRegexUsed: -1,
      selected: -1,
      resultPosition: '',
    };

    this.keyUp = this.keyUp.bind(this);
    this.keyDown = this.keyDown.bind(this);

    var that = this;
    window.addEventListener('keydown', function (evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ('key' in evt) {
        isEscape = evt.key === 'Escape' || evt.key === 'Esc';
      } else {
        isEscape = evt.keyCode === 27;
      }
      if (isEscape) {
        that.is_open = false;
        if (that.props.onHide) that.props.onHide();
      }
    });
  }
  keyDown(ev) {
    var that = this;
    var key = ev.which;
    if (
      this.is_open &&
      key &&
      that.state.currentRegexUsed >= 0 &&
      (key == 13 || key == 9 || key == 39 || key == 38 || key == 40)
    ) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (key == 27 && !this.is_open && that.props.onEscape) {
      that.props.onEscape();
    }
    if (key == 27 && this.is_open && that.props.onHide) {
      this.is_open = false;
      that.props.onHide();
    }
  }
  keyUp(ev) {
    var that = this;
    var key = ev.which;
    var allText = that.getValueBeforeCaret();
    if (key == 8 && that.input.value.length == 0 && that.props.onBackspace) {
      that.props.onBackspace();
    }
    for (var i = 0; i < that.props.regexHooked.length; i++) {
      var text = allText.match(that.props.regexHooked[i]);
      if (text && allText) {
        if (that.state.currentRegexUsed < 0 || that.state.currentRegexUsed != i) {
          that.state.currentRegexUsed = i;
        }
        var text = text[1] || '';
        if (
          key &&
          !that.props.disableNavigationKey &&
          (key == 13 || key == 9 || key == 39 || key == 38 || key == 40)
        ) {
          ev.preventDefault();
          ev.stopPropagation();
          if (key == 13 || key == 9 || key == 39) {
            //Select (enter)
            that.select(that.state.currentList[that.state.selected]);
          } else if (key == 38 || key == 40) {
            //Up // down
            if (
              (key == 38 && that.state.resultPosition == 'top') ||
              (key == 40 && that.state.resultPosition == 'bottom')
            ) {
              that.setState({
                selected: (that.state.selected + 1) % that.state.currentList.length,
              });
            } else {
              that.setState({
                selected:
                  (that.state.selected + that.state.currentList.length - 1) %
                  that.state.currentList.length,
              });
            }
          }
        } else {
          that.is_open = true;
          that.search(text, i);
        }
        if (that.props.onChangeCurrentList) {
          that.props.onChangeCurrentList(that.state.currentList, that.state.selected);
        }
        return;
      }
    }

    that.setState({ currentList: [], currentRegexUsed: -1, resultPosition: '' });
    this.props.keyUp && this.props.keyUp(ev);
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.outsideClickListener);
  }
  componentDidMount() {
    var that = this;

    var element = this.container;
    this.outsideClickListener = event => {
      if (!element.contains(event.target) && document.contains(event.target)) {
        this.setState({ focused: false });
      }
    };
    this.outsideClickListener = this.outsideClickListener.bind(this);
    document.addEventListener('click', this.outsideClickListener);

    this.input.addEventListener('keydown', this.keyDown);
    this.input.addEventListener('keyup', this.keyUp);

    if (this.props.showResultsOnInit) {
      that.state.currentRegexUsed = 0;
      that.search('', 0);
      that.props.onChangeCurrentList(that.state.currentList, that.state.selected);
    }
  }
  search(query, i) {
    var that = this;
    that.props.search[that.state.currentRegexUsed](query, function (results) {
      if (!that.is_open) {
        return;
      }

      var suggestions = [];
      for (
        var j = 0;
        j < Math.min(that.props.max[that.state.currentRegexUsed], results.length);
        j++
      ) {
        results[j].autocomplete_id = j;
        suggestions.push(results[j]);
      }

      that.state.currentList = suggestions;
      that.setState({
        selected: 0,
        currentList: suggestions,
        currentRegexUsed: i,
      });

      if (that.props.onChangeCurrentList) {
        that.props.onChangeCurrentList(that.state.currentList, that.state.selected);
      }
    });
  }
  getValueBeforeCaret() {
    return this.input.value.substr(0, this.input.selectionStart);
  }
  putTextAtCursor(text, alreadyTypedLength) {
    var that = this;

    alreadyTypedLength = alreadyTypedLength || 0;

    var myValue = text;

    if (that.input.selectionStart || that.input.selectionStart == '0') {
      var startPos = that.input.selectionStart;
      var endPos = that.input.selectionEnd;
      that.input.value =
        that.input.value.substring(0, startPos - alreadyTypedLength) +
        myValue +
        that.input.value.substring(endPos, that.input.value.length);
      that.input.selectionStart = that.input.selectionStart + myValue.length;
      that.input.selectionEnd = that.input.selectionStart + myValue.length;
    } else {
      that.input.value += myValue;
    }

    if (this.props.onChange) this.props.onChange({ target: { value: that.input.value } });

    that.input.focus();
    that.input.dispatchEvent(new Event('input'));

    that.setState({
      selected: -1,
      currentList: [],
    });
  }
  select(item) {
    if (!item) {
      return;
    }

    var that = this;
    var m = that.getValueBeforeCaret().match(that.props.regexHooked[that.state.currentRegexUsed]);
    if (m == null) {
      return;
    }
    var alreadyTypedLength = m[0].length;

    this.putTextAtCursor(
      this.props.renderItemChoosen[this.state.currentRegexUsed](item),
      alreadyTypedLength,
    );

    if (that.props.onSelect) {
      that.props.onSelect(item, that.state.currentRegexUsed);
    }
    this.is_open = false;
  }
  setPositionResult() {
    if (this.input && this.state.resultPosition == '' && this.state.currentList.length > 0) {
      var size = this.state.currentList.length * 32 + 5;
      if (
        document.documentElement.clientHeight - window.getBoundingClientRect(this.input).bottom <
          size ||
        this.props.position == 'top'
      ) {
        this.setState({ resultPosition: 'top' });
      } else {
        this.setState({ resultPosition: 'bottom' });
      }
    }
  }
  focus() {
    this.input.focus();
    this.setState({ focused: true });
    this.keyUp({});
  }
  blur() {
    this.input.blur();
    this.setState({ focused: false });
  }
  setContent(content) {
    this.input.value = content;
  }
  render() {
    this.setPositionResult();
    return (
      <div
        className={
          'autocomplete ' +
          (this.props.className || '') +
          ' ' +
          (this.state.focused && this.state.currentList.length ? 'focused ' : '')
        }
        onClick={() => {
          this.focus();
          this.setState({ focused: true });
        }}
        ref={node => (this.container = node)}
      >
        <div className={this.state.resultPosition}>
          {this.props.autoHeight && (
            <AutoHeight
              className={'' + (this.props.big ? ' big' : this.props.small ? ' small' : ' medium')}
              refInput={ref => {
                this.input = ref;
              }}
              onResize={this.props.onResize}
              placeholder={this.props.placeholder}
              value={this.props.value}
              onChange={this.props.onChange}
              onKeyUp={this.props.onKeyUp}
              onKeyDown={this.props.onKeyDown}
              onKeyPress={this.props.onKeyPress}
              onFocus={() => {
                if (this.props.onFocusChange) {
                  this.props.onFocusChange(true);
                }
              }}
              onBlur={() => {
                if (this.props.onFocusChange) {
                  this.props.onFocusChange(false);
                }
              }}
              autoFocus={this.props.autoFocus}
            />
          )}
          {!this.props.autoHeight && (
            <Input
              className={
                'full_width ' + (this.props.big ? ' big' : this.props.small ? ' small' : ' medium')
              }
              refInput={ref => {
                this.input = ref;
              }}
              placeholder={this.props.placeholder}
              value={this.props.value}
              onChange={this.props.onChange}
              onKeyUp={this.props.onKeyUp}
              onKeyDown={this.props.onKeyDown}
              onKeyPress={this.props.onKeyPress}
              onFocus={() => {
                if (this.props.onFocusChange) {
                  this.props.onFocusChange(true);
                }
              }}
              onBlur={() => {
                if (this.props.onFocusChange) {
                  this.props.onFocusChange(false);
                }
              }}
              autoFocus={this.props.autoFocus}
            />
          )}
          {!this.props.hideResult && this.state.currentList.length > 0 ? (
            <div
              className={
                'menu-list as_frame inline ' +
                (this.state.focused && this.state.currentList.length ? 'fade_in ' : '') +
                this.state.resultPosition
              }
            >
              {this.state.currentList.map((item, index) => {
                return (
                  <div
                    className={
                      'menu ' +
                      (!this.props.disableNavigationKey &&
                      item.autocomplete_id == this.state.selected
                        ? 'is_selected'
                        : '')
                    }
                    onClick={() => this.select(item)}
                  >
                    {item && this.props.renderItem[this.state.currentRegexUsed](item)}
                  </div>
                );
              })}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    );
  }
}
