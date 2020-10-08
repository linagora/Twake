import React, { Component } from 'react';

import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import Numbers from 'services/utils/Numbers.js';
import FileType from './FileType.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import '../Drive.scss';
import moment from 'moment';
import 'moment-timezone';

export default class File extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var mini = this.props.mini;

    var date = false;
    if (this.props.data.modified) {
      date = moment(this.props.data.modified * 1000);
    }
    if (this.props.data.added && this.props.isVersion) {
      date = moment(this.props.data.added * 1000);
    }

    var date_string = date ? date.format('L') : '-';
    if (new Date().getTime() - date.unix() * 1000 < 1000 * 23 * 60 * 60) {
      date_string = date ? date.format('LT') : '-';
    }

    return [
      <div
        key="preview"
        className={
          'preview file_type_icon ' +
          DriveService.getFileType(this.props.data) +
          ' ' +
          (this.props.data.has_preview ? '' : 'no_preview')
        }
        style={
          this.props.data.has_preview
            ? {
                backgroundImage:
                  "url('" + window.addApiUrlIfNeeded(this.props.data.preview_link) + "')",
              }
            : {}
        }
      >
        <div className="tags_list">
          <TagPicker inline readOnly noPlaceholder value={this.props.data.tags || []} />
        </div>
      </div>,
      <div key="data" className="data">
        <div className={'file_type_icon'}>
          <FileType type={DriveService.getFileType(this.props.data)} scale={0.75} fill={'#000'} />
        </div>
        <div className="text">
          {!!this.props.versionLabel && <div className="inline-tag">{this.props.versionLabel}</div>}
          {this.props.data.name}
          {!this.props.isVersion && (this.props.data.versions || {}).length > 1 && (
            <span style={{ opacity: 0.5, marginLeft: 4 }}>
              ({(this.props.data.versions || {}).length} versions)
            </span>
          )}
          &nbsp;&nbsp;
          <TagPicker
            className="no-grid"
            inline
            readOnly
            noPlaceholder
            value={this.props.data.tags || []}
          />
        </div>

        {(this.props.data.acces_info || {}).token && (
          <Icon type="link-h" className="m-icon-small" />
        )}
        {this.props.data.url && <Icon type="external-link-alt" className="m-icon-small" />}

        {/*
            <div className="created-by no-grid">
              {this.state.element.created_by || "-"}
            </div>
            */}
        {this.props.details && [
          <div className="last-modified no-grid">{date_string}</div>,
          <div className="size no-grid">
            {this.props.data.size ? Numbers.humanFileSize(this.props.data.size, true) : '-'}
          </div>,
        ]}
        {!this.props.isVersion && (
          <div className="detail_preview_parent no-grid">
            <div
              className={
                'detail_preview file_type_icon ' +
                DriveService.getFileType(this.props.data) +
                ' ' +
                (this.props.data.has_preview ? '' : 'no_preview')
              }
              style={
                this.props.data.has_preview
                  ? {
                      backgroundImage:
                        "url('" + window.addApiUrlIfNeeded(this.props.data.preview_link) + "')",
                    }
                  : {}
              }
            />
          </div>
        )}
        {this.props.menu && this.props.menu.length > 0 && (
          <Menu menu={this.props.menu} className="options">
            <Icon type="ellipsis-h" className="m-icon-small" />
          </Menu>
        )}

        {this.props.removeIcon === true && (
          <Icon type="times" className="m-icon-small" onClick={this.props.removeOnClick} />
        )}
      </div>,
    ];
  }
}
