import React, { Component } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Languages from 'services/languages/languages.js';

import Directory from 'components/Drive/Directory.js';
import File from 'components/Drive/File.js';
import AttachmentPicker from 'components/AttachmentPicker/AttachmentPicker.js';
import DriveService from 'services/Apps/Drive/Drive.js';

class DelayedElement extends Component {
  render() {
    var Element = File;
    if (this.props.directories) {
      Element = Directory;
    }

    if (this.props.delay - new Date().getTime() > 0) {
      setTimeout(() => {
        this.setState({});
      }, this.props.delay - new Date().getTime() + 10);

      return <div />;
    }

    var attachmentMenu = {
      type: 'menu',
      text: Languages.t('scenes.apps.tasks.modals.attachments', [], 'Attachments'),
      submenu: [
        {
          type: 'title',
          text: Languages.t('scenes.apps.tasks.modals.attachments', [], 'Attachments'),
        },
        {
          type: 'react-element',
          reactElement: () => (
            <AttachmentPicker
              attachments={this.state.element.attachments}
              onChange={attachments => this.change('attachments', attachments)}
            />
          ),
        },
        {
          type: 'menu',
          text: Languages.t('scenes.apps.drive.remove_attachs', [], 'Remove attachments'),
          class: 'error',
          onClick: () => {
            var x = this.state.element;
            x.attachments = [];
            DriveService.save(x, this.props.driveCollectionKey || this.driveCollectionKey);
          },
        },
      ],
    };

    return (
      <Element
        attachmentMenu={attachmentMenu}
        driveCollectionKey={this.props.driveCollectionKey}
        selectionType={this.props.selectionType}
        data={this.props.data}
        onClick={this.props.onClick}
      />
    );
  }
}

export default class List extends Component {
  constructor() {
    super();

    this.state = {};

    this.creationTime = new Date().getTime();
  }

  render() {
    var Element = File;
    if (this.props.directories) {
      Element = Directory;
    }

    return (
      <TransitionGroup style={{ fontSize: 0 }}>
        {this.props.data.map((element, i) => {
          return (
            <CSSTransition
              className={'animated-' + (this.props.view_mode == 'list' ? 'list' : 'grid')}
              timeout={{ enter: 1, exit: 200 }}
              key={element.front_id}
            >
              <DelayedElement
                delay={this.creationTime + (i - 20) * 100}
                directories={this.props.directories}
                driveCollectionKey={this.props.driveCollectionKey}
                selectionType={this.props.selectionType}
                data={element}
                onClick={this.props.onClick ? () => this.props.onClick(element) : undefined}
              />
            </CSSTransition>
          );
        })}
      </TransitionGroup>
    );
  }
}
