import React, { Component } from 'react';

import File from 'components/Drive/File.js';
import FilePicker from 'components/Drive/FilePicker/FilePicker.js';
import TaskPicker from 'components/TaskPicker/TaskPicker.js';
import Menu from 'components/Menus/Menu.js';
import Icon from 'components/Icon/Icon.js';
import Button from 'components/Buttons/Button.js';
import UploadZone from 'components/Uploads/UploadZone.js';
import MenusManager from 'services/Menus/MenusManager.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Languages from 'services/languages/languages.js';
import './AttachmentPicker.scss';

export default class AttachmentPicker extends Component {
  /*
        props : {
            readOnly : bool
            attachments : []
            onChange
            className
        }
    */

  constructor(props) {
    super(props);
  }
  getIcon(att) {
    if (att.type.toLocaleLowerCase() == 'event') {
      return 'calendar-alt';
    }
    if (att.type.toLocaleLowerCase() == 'file') {
      return 'folder';
    }
    if (att.type.toLocaleLowerCase() == 'task') {
      return 'check-square';
    }
  }
  addAttachment(attachment) {
    var attachments = this.props.attachments || [];
    attachments.push(attachment);
    if (this.props.onChange) {
      this.props.onChange(attachments);
    }
  }
  removeAttachment(attachment) {
    var attachments = this.props.attachments || [];
    var index = attachments.indexOf(attachment);
    if (index >= 0) {
      attachments.splice(index, 1);
      if (this.props.onChange) {
        this.props.onChange(attachments);
      }
    }
  }
  render() {
    return (
      <div className={'attachmentPicker ' + (this.props.className || '')}>
        <div className="attachments">
          {(Object.values(this.props.attachments || {}) || []).map(att => {
            if (att.type == 'file') {
              var additionalMenu = [];
              if (!this.props.readOnly) {
                additionalMenu = [
                  {
                    type: 'menu',
                    text: Languages.t(
                      'components.attachmentpicker.remove_attach',
                      [],
                      'Remove attachment',
                    ),
                    onClick: () => {
                      this.removeAttachment(att);
                    },
                  },
                ];
              }
              return (
                <div className="attachment attachment_file drive_view list">
                  <File
                    data={{ id: att.id || '' }}
                    additionalMenu={additionalMenu}
                    notInDrive={true}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              );
            }
            return (
              <div className="attachment">
                <Icon className="app-icon" type={this.getIcon(att)} />
                {att.name}
                {!this.props.readOnly && (
                  <Icon
                    className="remove"
                    type="times"
                    onClick={() => {
                      this.removeAttachment(att);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {!this.props.readOnly && (
          <Menu
            style={{ display: 'inline-block' }}
            menu={[
              {
                type: 'menu',
                text: Languages.t('components.attachmentpicker.file', [], 'File'),
                icon: 'file',
                submenu: [
                  {
                    type: 'menu',
                    icon: 'desktop',
                    text: Languages.t(
                      'components.attachmentpicker.from_computer',
                      [],
                      'From computer',
                    ),
                    onClick: () => {
                      this.upload_zone.open();
                      MenusManager.closeMenu();
                    },
                  },
                  {
                    type: 'menu',
                    icon: 'folder',
                    text: Languages.t(
                      'components.attachmentpicker.from_twake',
                      [],
                      'From Twake Documents',
                    ),
                    submenu: [
                      {
                        type: 'react-element',
                        reactElement: (
                          <FilePicker
                            mode={'select_file'}
                            onChoose={res => {
                              this.addAttachment({ type: 'file', id: res.id, name: res.name });
                              MenusManager.closeMenu();
                            }}
                            initialDirectory={{ id: '' }}
                          />
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                type: 'menu',
                text: Languages.t('scenes.apps.tasks.task', [], 'Task'),
                icon: 'check-square',
                submenu: [
                  {
                    type: 'react-element',
                    reactElement: (
                      <TaskPicker
                        mode={'select_task'}
                        onChoose={res => {
                          this.addAttachment({ type: 'task', id: res.id, name: res.title });
                          MenusManager.closeMenu();
                        }}
                      />
                    ),
                  },
                ],
              },
            ]}
          >
            {' '}
            <Button className="small secondary-text right-margin">
              <Icon type="plus" className="m-icon-small" />{' '}
              {Languages.t(
                'components.attachmentpicker.add_attachment',
                [],
                'Ajouter des pièces jointes',
              )}
            </Button>
          </Menu>
        )}

        <UploadZone
          ref={node => (this.upload_zone = node)}
          disableClick
          parent={''}
          driveCollectionKey={'attachment_' + Workspaces.currentWorkspaceId}
          uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
          onUploaded={res => {
            this.addAttachment({ type: 'file', id: res.id, name: res.name });
          }}
          multiple={false}
        />
      </div>
    );
  }
}
