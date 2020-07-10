<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import Draggable from 'components/Draggable/Draggable.js';
import DriveElement from './DriveElement.js';
import './Drive.scss';
import UIFile from './UI/File.js';
import Loader from 'components/Loader/Loader.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import Languages from 'services/languages/languages.js';

export default class File extends DriveElement {
  constructor(props) {
    super();
    this.state = {
      loading: true,
    };
  }
  componentDidMount() {
    super.componentDidMount();
    if (this.state.loading) {
      setTimeout(() => {
        this.setState({ loading: false });
      }, 4000);
    }
  }
  render() {
    if (!this.state.element || !this.state.element.front_id) {
      return (
        <div className="file mini" style={{ textAlign: 'center' }}>
          {this.state.loading && <Loader color="#CCC" className="file_loader" />}
          {!this.state.loading && (
            <span className="text" style={{ opacity: 0.5 }}>
<<<<<<< HEAD
              {Languages.t('scenes.apps.drive.preview_bloc.error_file', [], 'File not found.')}
=======
              {Languages.t('scenes.apps.drive.preview_bloc.error_file', [], "File not found.")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            </span>
          )}
        </div>
      );
    } else {
      this.state.loading = false;
    }

    if (this.props.hide) {
      return '';
    }

    var mini = (!this.state.element.has_preview && this.props.notInDrive) || this.props.mini;
    return (
      <Draggable
        style={this.props.style}
        className={
          'js-drive-multi-selector-selectable fade_in file ' +
          (this.state.selected ? 'is_selected ' : '') +
          (mini ? 'mini ' : '') +
          this.props.className
        }
        refDraggable={node => (this.node = node)}
        onClick={evt => {
          this.clickElement(evt);
        }}
        onDoubleClick={this.props.onDoubleClick}
        parentClassOnDrag="drive_view grid"
        onDragStart={evt => {
          this.dragElement(evt);
        }}
        minMove={10}
        data={{ type: 'file', selection_type: this.props.selectionType, data: this.props.data }}
        deactivated={WorkspaceUserRights.isNotConnected()}
      >
        <UIFile data={this.state.element} menu={this.common_menu} details={true} />
      </Draggable>
    );
  }
}
