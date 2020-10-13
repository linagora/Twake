import React, { Component } from 'react';
import DriveElement from 'components/Drive/DriveElement.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import SelectionsManager from 'services/SelectionsManager/SelectionsManager.js';
import Collections from 'services/Collections/Collections.js';
import Emojione from 'components/Emojione/Emojione';
import Languages from 'services/languages/languages.js';

export default class PathElement extends DriveElement {
  dropFile(data, directory) {
    var objects_ids = [data.data.id];
    if (data.selection_type) {
      var selected = Object.keys(SelectionsManager.selected_per_type[data.selection_type]);
      if (selected && selected.length > 1) {
        var objects_ids = selected;
      }
    }
    var objects = objects_ids.map(id => Collections.get('drive').find(id));

    if (this.props.inTrash && !directory.parent_id) {
      if (data.data.trash) {
        super.dropFile(data, directory);
      } else {
        DriveService.remove(objects, this.props.driveCollectionKey);
      }

      return;
    }

    DriveService.moveFile(objects_ids, directory, this.props.driveCollectionKey);
  }
  click() {
    this.props.parent.changeCurrentDirectory(this.props.data);
  }
  render() {
    var directory = this.props.data;
    var workspace = this.props.workspace || {};

    directory = Collections.get('drive').find(directory.id) || directory;

    var app = {};
    if (directory.application_id) {
      app = Collections.get('applications').find(directory.application_id) || {};
    }

    var list = [];
    if (DriveService.current_directory_channels[this.props.channel].parent_id == 'trash') {
      list = [
        <div
          className={'directory_in_path exit_trash_btn app_back_btn'}
          onClick={() => {
            DriveService.toggleInTrash(this.props.channel);
          }}
        >
          <Icon type="angle-left m-icon-small" />
        </div>,
      ];
    }

    list.push(
      <DroppableZone
        types={['file']}
        onLongOver={() => {
          this.click();
        }}
        onDrop={data => this.dropFile(data, directory)}
        style={{ display: 'inline-block' }}
      >
        <div
          className={
            'directory_in_path ' +
            (!(this.props.showOptions && directory.parent_id) ? 'app_back_btn' : '')
          }
          onClick={() => {
            this.click();
          }}
        >
          {directory.application_id && (
            <span style={{ marginRight: '8px' }}>
              <Emojione type={app.icon_url} />
            </span>
          )}

          {directory.parent_id && directory.parent_id != 'trash'
            ? directory.name
            : this.props.inTrash
            ? Languages.t('scenes.apps.drive.trash', [], 'Trash')
            : workspace.name}

          {directory.application_id && app.name && <i> ({app.name})</i>}

          {this.props.showOptions &&
            directory.parent_id &&
            directory.parent_id != 'trash' &&
            this.common_menu.length > 0 && (
              <Menu menu={this.common_menu} className="options">
                <Icon type="ellipsis-h" />
              </Menu>
            )}
        </div>
      </DroppableZone>,
    );

    return list;
  }
}
