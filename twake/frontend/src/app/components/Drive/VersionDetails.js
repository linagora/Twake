<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import Languages from 'services/languages/languages.js';
import Icon from 'components/Icon/Icon.js';
import Collections from 'services/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import UploadZone from 'components/Uploads/UploadZone.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
<<<<<<< HEAD
import {
  ObjectModal,
  ObjectModalSectionTitle,
  ObjectModalTitle,
} from 'components/ObjectModal/ObjectModal.js';
=======
import {ObjectModal, ObjectModalSectionTitle, ObjectModalTitle,} from 'components/ObjectModal/ObjectModal.js';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import UIFile from './UI/File.js';
import 'moment-timezone';

import './Drive.scss';

export default class VersionDetails extends React.Component {
  constructor() {
    super();
    this.state = {
      workspaces: Workspaces,
      i18n: Languages,
    };
    Languages.addListener(this);
    DriveService.addListener(this);
    Collections.get('drive').addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    DriveService.removeListener(this);
    Collections.get('drive').removeListener(this);
  }
  componentWillMount() {}
  componentDidUpdate(prevProps, prevState) {
    console.log('update', this.props.file);
  }
  render() {
    var countVersion = (this.props.file.versions || []).length;
    return (
      <ObjectModal
        onClose={() => MediumPopupManager.closeAll()}
        footer={
          <div className="footerVersionDetails">
            <div className="addVersion">
              <div
                className="addVersionButton"
                onClick={() => {
                  console.log('hi');
                  if (this.upload_zone) {
                    this.upload_zone.open();
                  } else {
                    console.log('nop');
                  }
                }}
              >
                <div className="icon">
                  <Icon type="plus" className="m-icon-small iconWithBackground" />
                </div>
<<<<<<< HEAD
                <div className="footerTitle">
                  {Languages.t('components.drive.new_versions', [], 'Ajouter une nouvelle version')}
                </div>
=======
                <div className="footerTitle">{Languages.t('components.drive.new_versions', 
                [], "Ajouter une nouvelle version")}</div>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              </div>
            </div>
          </div>
        }
        title={
          <div className="title allow_selection">
            <ObjectModalTitle>Versions</ObjectModalTitle>
          </div>
        }
      >
        <div className="versionDetails list">
          <UploadZone
            disabled={WorkspaceUserRights.isNotConnected()}
            disableClick
            ref={node => (this.upload_zone = node)}
            driveCollectionKey={''}
            parent={this.props.file.parent_id}
            driveCollectionKey={{ id: this.props.file.parent_id }}
            uploadOptions={{
              workspace_id: this.state.workspaces.currentWorkspaceId,
              new_version: true,
              file_id: this.props.file.id,
            }}
            allowPaste={true}
          >
            {(this.props.file.versions || [])
              .sort((a, b) => {
                return b.added - a.added;
              })
              .map((version, index) => {
                var data = {};
                if (index > 0) {
                  data.extension = this.props.file.extension;
                  data.name = version.name;
                  data.creator = version.creator;
                  data.size = version.size;
                } else {
                  data = JSON.parse(JSON.stringify(this.props.file));
                }
                data.added = version.added;
                return (
                  <div className="file" key={'version-' + version.id}>
                    <UIFile
                      isVersion
                      versionLabel={
                        index == 0 ? 'Version actuelle' : 'Version ' + (countVersion - index)
                      }
                      data={data}
                      menu={[
                        {
                          type: 'menu',
<<<<<<< HEAD
                          text: Languages.t(
                            'scenes.apps.drive.preview_bloc.operations_download',
                            [],
                            'Télécharger'
                          ),
=======
                          text: Languages.t('scenes.apps.drive.preview_bloc.operations_download', [], 'Télécharger'),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                          onClick: () => {
                            var link = DriveService.getLink(this.props.file, version.id, 1);
                            console.log(link);
                            window.open(link);
                          },
                        },
                      ]}
                      details={true}
                    />
                  </div>
                );
              })}

            <div className="no-more text">Nothing more</div>
          </UploadZone>
        </div>
      </ObjectModal>
    );
  }
}
