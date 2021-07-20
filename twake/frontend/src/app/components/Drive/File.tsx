import React from 'react';
import Draggable from 'components/Draggable/Draggable.js';
import DriveElement from './DriveElement.js';
import './Drive.scss';
import UIFile from './UI/File.js';
import Loader from 'components/Loader/Loader.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import Languages from 'services/languages/languages';

type PropsType = { [key: string]: any };

type StateType = any;

type NodeType = any;

export default class File extends DriveElement {
  node: NodeType;
  state: StateType;
  constructor(props: PropsType) {
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
        <div
          className={'file mini ' + (this.props.notInDrive ? 'notInDrive ' : '')}
          style={{ textAlign: 'center' }}
        >
          {this.state.loading && <Loader color="#CCC" className="file_loader" />}
          {!this.state.loading && (
            <span className="text" style={{ opacity: 0.5 }}>
              {Languages.t('scenes.apps.drive.preview_bloc.error_file', [], 'File not found.')}
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
          'js-drive-multi-selector-selectable file ' +
          (this.state.selected ? 'is_selected ' : '') +
          (this.props.notInDrive ? 'notInDrive ' : '') +
          (mini ? 'mini ' : '') +
          this.props.className
        }
        refDraggable={(node: NodeType) => (this.node = node)}
        onClick={(evt: any) => this.clickElement(evt, this.props.previewonly)}
        onDoubleClick={this.props.onDoubleClick}
        parentClassOnDrag="drive_view list"
        onDragStart={(evt: any) => {
          this.dragElement(evt);
        }}
        minMove={10}
        data={{ type: 'file', selection_type: this.props.selectionType, data: this.props.data }}
        deactivated={WorkspaceUserRights.isNotConnected() || this.props.notInDrive}
      >
        <UIFile
          data={this.state.element}
          menu={!this.props.removeIcon && this.common_menu}
          details={true}
          removeIcon={this.props.removeIcon}
          removeOnClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            this.props.removeOnClick();
          }}
        />
      </Draggable>
    );
  }
}
