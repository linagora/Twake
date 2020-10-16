import React, { Component } from 'react';

import Menu from 'components/Menus/Menu.js';
import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import CloseIcon from '@material-ui/icons/CloseOutlined';
import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNewOutlined';
import DriveService from 'services/Apps/Drive/Drive.js';
import Button from 'components/Buttons/Button.js';
import ElectronService from 'services/electron/electron.js';
import './Viewer.scss';

export default class Viewer extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      loading_preview: false,
      did_load_preview: false,
    };

    Languages.addListener(this);
    Collections.get('drive').addListener(this);
    DriveService.addListener(this);

    window.addEventListener('keydown', function (evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ('key' in evt) {
        isEscape = evt.key === 'Escape' || evt.key === 'Esc';
      } else {
        isEscape = evt.keyCode === 27;
      }
      if (isEscape) {
        DriveService.viewDocument(null);
      }
    });
  }
  componentWillUpdate(nextProps, nextState) {
    this.viewed_document = this.props.document || DriveService.viewed_document;
    if (this.viewed_document && this.viewed_document.id != this.last_viewed_id) {
      this.last_viewed_id = this.viewed_document.id;
      nextState.loading_preview = false;
      nextState.did_load_preview = false;
      nextState.url_formated = undefined;
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('drive').removeListener(this);
    DriveService.removeListener(this);
  }
  openFile(app) {
    if (app.url && app.is_url_file) {
      window.open(app.url);
    }
    DriveService.getFileUrlForEdition(
      (((app.display || {}).drive_module || {}).can_open_files || {}).url,
      app,
      this.viewed_document.id,
      url => {
        window.open(url);
      },
    );
  }
  previewFile(url, app) {
    this.setState({ loading_preview: true });

    DriveService.getFileUrlForEdition(url, app, this.viewed_document.id, url => {
      this.setState({ loading_preview: false, did_load_preview: true, url_formated: url });
    });
  }
  render() {
    if (!this.viewed_document) {
      setTimeout(() => {
        this.setState({});
      }, 1000);
      return '';
    }

    var current = this.viewed_document;
    var candidates = DriveService.getEditorsCandidates(current);

    var preview_candidate = candidates.preview_candidate || [];
    var editor_candidate = candidates.editor_candidate || [];

    if (
      !this.state.loading_preview &&
      !this.state.did_load_preview &&
      preview_candidate.length > 0
    ) {
      this.previewFile(preview_candidate[0].url, preview_candidate[0].app);
    }

    var canPreviewWithElectron =
      preview_candidate.length == 0 && current.url && ElectronService.isElectron();

    return (
      <div className={'drive_viewer fade_in ' + (this.props.inline ? 'inline ' : '')}>
        {!this.props.disableHeader && (
          <div className="view_header">
            <div className="title">{current.name}</div>

            {editor_candidate.length == 1 && (
              <Button
                className="small open-with"
                onClick={() => this.openFile(editor_candidate[0])}
              >
                {Languages.t(
                  'scenes.apps.drive.viewer.edit_with_button',
                  [editor_candidate[0].name],
                  'Editer avec $1',
                )}
              </Button>
            )}
            {editor_candidate.length > 1 && (
              <Menu
                menu={editor_candidate.map(editor => {
                  return {
                    type: 'menu',
                    text: editor.name,
                    onClick: () => {
                      this.openFile(editor);
                    },
                  };
                })}
                position="bottom"
              >
                <Button className="button medium secondary">
                  {Languages.t('scenes.apps.drive.viewer.open_with_button', [], 'Ouvrir avec...')}
                </Button>
              </Menu>
            )}

            <div className="close" onClick={() => DriveService.viewDocument(null)}>
              <CloseIcon class="m-icon-small" />
            </div>

            <div
              className="download"
              onClick={() => {
                var link = DriveService.getLink(current, null, true);
                if (current.url) {
                  window.open(link, '_blank');
                } else {
                  window.open(link);
                }
              }}
            >
              {current.url && <OpenInNewIcon class="m-icon-small" />}
              {!current.url && <DownloadIcon class="m-icon-small" />}
            </div>
          </div>
        )}

        <div className="view_body">
          {this.state.did_load_preview && preview_candidate.length > 0 && (
            <iframe src={this.state.url_formated || preview_candidate[0].url} />
          )}
          {canPreviewWithElectron && <webview src={current.url} />}

          {preview_candidate.length == 0 && !canPreviewWithElectron && (
            <div className="no_preview_text">
              {!current.url && (
                <span style={{ opacity: 0.5 }}>
                  {Languages.t(
                    'scenes.apps.drive.viewer.no_preview_message',
                    [],
                    'Impossible de visualiser ce type de fichier.',
                  )}
                </span>
              )}

              {current.url && (
                <div>
                  <a href={current.url} target="_blank" style={{ fontSize: 14 }}>
                    {Languages.t('scenes.apps.drive.open_link', [], 'Open link in new window')}
                  </a>
                  <br />
                  <br />
                  <a href="https://twake.app/download" target="_blank" style={{ fontSize: 12 }}>
                    {Languages.t(
                      'scenes.apps.drive.viewer.download_desktop',
                      [],
                      'Download Twake Desktop to preview in app',
                    )}
                  </a>
                </div>
              )}
            </div>
          )}
          {this.state.loading_preview && (
            <div className="loading_preview_text">
              <span style={{ opacity: 0.5 }}>
                {Languages.t(
                  'scenes.apps.drive.viewer.loading_preview_message',
                  [],
                  'Chargement...',
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
