import React, { Component } from 'react';
import './MediumPopupComponent.scss';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';

export default class MediumPopupComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mediumPopupManager: MediumPopupManager,
    };
    MediumPopupManager.addListener(this);
    this.eventClose = this.eventClose.bind(this);
  }
  componentWillUnmount() {
    MediumPopupManager.removeListener(this);
    document.removeEventListener('keydown', this.eventClose);
  }
  componentDidMount() {
    document.addEventListener('keydown', this.eventClose);

    setTimeout(() => {
      this.setState({});
    }, 500);
  }
  componentDidUpdate() {
    if (this.component) {
      var screen = window.screen;
      var size = JSON.parse(
        JSON.stringify((this.component && window.getBoundingClientRect(this.component)) || {}),
      );
      size.x = size.x || size.left;
      size.y = size.y || size.top;
      size.height = Math.max(this.component.offsetHeight, size.height);
      size.bottom = size.height + size.y;

      if (size.height && this.old_size != size.height) {
        this.old_size = size.height;
        if (size.bottom && size.bottom > document.documentElement.clientHeight) {
          this.setState({});
        }
        if (size.y && size.y < 0) {
          this.setState({});
        }
      }
    }
  }
  eventClose(evt) {
    if (evt.keyCode == 27 && MediumPopupManager.canClose()) {
      this.close();
    }
  }
  close() {
    if (MediumPopupManager.canClose) {
      MediumPopupManager.close();
    }
  }
  render() {
    if (!MediumPopupManager.isOpen()) {
      this.old_size = -1;
      this.component = null;
      return '';
    }

    var position = JSON.parse(JSON.stringify(MediumPopupManager.position));
    var screen = window.screen;
    var component_size = JSON.parse(
      JSON.stringify((this.component && window.getBoundingClientRect(this.component)) || {}),
    );
    component_size.x = component_size.x || component_size.left;
    component_size.y = component_size.y || component_size.top;
    if (this.component) {
      component_size.height = Math.max(this.component.offsetHeight, component_size.height);
      component_size.bottom = component_size.height + component_size.y;
    }
    var pare_style = {};
    var comp_style = {};
    var background_style = {};
    var animation_style = 'skew_in_bottom_nobounce';

    if (position) {
      if (position.no_background) {
        background_style.display = 'none';
      }

      if (position.size && position.size.width) {
        comp_style.width = position.size.width;
      }

      if (position.highlight) {
        if (position.highlight.x - (comp_style.width || 0) < 0) {
          if (position.position == 'left') {
            position.position = 'right';
          }
        }
        if (
          position.highlight.x +
            position.highlight.width +
            (comp_style.width || 0) -
            document.documentElement.clientWidth >
          0
        ) {
          if (position.position == 'right') {
            position.position = 'left';
            if (position.highlight.x - (comp_style.width || 0) < 0) {
              position.position = null;
            }
          }
        }

        if (position.position == 'left') {
          pare_style.left = position.highlight.x - (comp_style.width || 0) / 2;
          pare_style.right = 'unset';
          animation_style = 'skew_in_left_nobounce';
          if (position.margin) {
            comp_style.marginLeft = -position.margin;
          }
        }
        if (position.position == 'right') {
          pare_style.left =
            position.highlight.x + position.highlight.width + (comp_style.width || 0) / 2;
          pare_style.right = 'unset';
          animation_style = 'skew_in_right_nobounce';
          if (position.margin) {
            comp_style.marginLeft = position.margin;
          }
        }

        if (position.position) {
          pare_style.bottom = 'unset';
          pare_style.top = position.highlight.y + position.highlight.height / 2;
        }

        if (component_size && component_size.height) {
          if (component_size.height / 2 + pare_style.top > document.documentElement.clientHeight) {
            pare_style.top = document.documentElement.clientHeight - component_size.height / 2 - 15;
          }

          if (pare_style.top - component_size.height / 2 < 0) {
            pare_style.top = component_size.height / 2 + 15;
          }
        }
      }
    }

    return (
      <div className="mediumPopupComponent">
        <div
          className={'background ' + (background_style.opacity !== 0 ? 'fade_in ' : '')}
          style={background_style}
          onClick={() => {
            this.close();
          }}
        />
        <div className={'componentContainer ' + animation_style} style={pare_style}>
          <div
            ref={node => (this.component = node)}
            className="component"
            style={comp_style}
            onClick={evt => {
              if (
                evt.target.parentNode.tagName.toLowerCase() != 'a' &&
                evt.target.parentNode.tagName.toLowerCase() != 'button'
              ) {
                evt.stopPropagation();
                evt.preventDefault();
              }
            }}
          >
            {MediumPopupManager.getComponent()}
          </div>
        </div>
      </div>
    );
  }
}
