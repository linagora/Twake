import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Globals from 'services/Globals.js';

export default class MessagesScroller extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      i18n: Languages,
    };

    this.ignoreNextScrollUntil = 0;
    this.scrollHeight = 0;
    this.fixedToBottom = true;

    this.contentChanged = this.contentChanged.bind(this);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.contentChanged);
    this.observer.disconnect();
  }
  componentDidMount() {
    window.addEventListener('resize', this.contentChanged);
    this.observer = new MutationObserver(() => this.contentChanged());
    this.observer.observe(this.node, { childList: true, subtree: true });
    this.contentChanged();
  }
  contentChanged() {
    this.scrollHeight = this.node.scrollHeight;
    if (this.fixedToBottom) {
      this.scrollToBottom();
      setTimeout(() => {
        this.scrollToBottom();
      }, 200);
    }

    if (this.messageToCenter) {
      if (this.messageToCenterTimeout) {
        clearTimeout(this.messageToCenterTimeout);
      }
      this.messageToCenterTimeout = setTimeout(() => {
        this.fixedToBottom = false;
        if (this.props.getPositions(this.messageToCenter)) {
          var node = this.props.getPositions(this.messageToCenter);
          node.classList.remove('highlighted_animation');
          setTimeout(() => {
            node.classList.add('highlighted_animation');
          }, 200);
          this.scrollTo(node.offsetTop - this.node.clientHeight / 2 + node.clientHeight / 2);
          this.messageToCenter = null;
        } else {
          setTimeout(() => {
            this.contentChanged();
          }, 200);
        }
      }, 500);
    }
  }
  scroll(evt) {
    if (this.ignoreNextScrollUntil > new Date().getTime()) {
      return;
    }
    if (this.node.scrollHeight - this.node.scrollTop - this.node.clientHeight < 40) {
      this.fixedToBottom = true;
      if (this.props.lastMessageVisible) {
        this.props.onFixedBottomChange && this.props.onFixedBottomChange(true);
      }
    } else {
      this.fixedToBottom = false;
      this.props.onFixedBottomChange && this.props.onFixedBottomChange(false);
      if (
        Globals.window.mixpanel_enabled &&
        this.node.scrollHeight - this.node.scrollTop - this.node.clientHeight > 200
      )
        Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Scroll Event');
    }
  }
  scrollTo(position) {
    if (!this.node) {
      return;
    }
    this.ignoreNextScrollUntil = new Date().getTime() + 200;
    this.scrollToAnimated(this.node, position, 1000);
    if (this.props.lastMessageVisible) {
      if (this.node.scrollHeight - this.node.scrollTop - this.node.clientHeight < 40) {
        this.props.onFixedBottomChange && this.props.onFixedBottomChange(true);
      } else {
        this.props.onFixedBottomChange && this.props.onFixedBottomChange(false);
      }
    }
  }
  scrollToAnimated(element, to, duration) {
    var that = this;

    if (that.animatingScroll || !that.animation_did_firstTime) {
      duration = 0;
    }

    if (!element) {
      return;
    }

    that.animation_did_firstTime = true;
    that.animatingScroll = true;
    this.animation_start = element.scrollTop;
    this.animation_change = to - this.animation_start;
    this.animation_startDate = +new Date();
<<<<<<< HEAD
    const easeInOutQuad = function (t, b, c, d) {
=======
    const easeInOutQuad = function(t, b, c, d) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    if (!this.animation_index) {
      this.animation_index = 0;
    }
    this.animation_index++;

<<<<<<< HEAD
    that.animation_animateScroll = function (index) {
      const currentDate = +new Date();
      const currentTime = currentDate - that.animation_startDate;
      element.scrollTop = parseInt(
        easeInOutQuad(currentTime, that.animation_start, that.animation_change, duration)
=======
    that.animation_animateScroll = function(index) {
      const currentDate = +new Date();
      const currentTime = currentDate - that.animation_startDate;
      element.scrollTop = parseInt(
        easeInOutQuad(currentTime, that.animation_start, that.animation_change, duration),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      );
      if (currentTime < duration) {
        if (index == that.animation_index) {
          requestAnimationFrame(() => that.animation_animateScroll(index));
        }
      } else {
        that.animatingScroll = false;
        element.scrollTop = to;
      }
    };
    that.animation_animateScroll(this.animation_index);
  }
  scrollToBottom() {
    this.scrollTo(this.scrollHeight);
  }
  registerMessageToCenter(id) {
    this.messageToCenter = id;
  }
  render() {
    return (
      <div
        ref={node => (this.node = node)}
        className={'messages_scroller ' + (this.props.className || '')}
        onScroll={evt => this.scroll(evt)}
      >
        {this.props.children}
      </div>
    );
  }
}
