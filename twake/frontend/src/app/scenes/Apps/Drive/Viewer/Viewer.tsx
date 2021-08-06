import React, { Component } from 'react';

import Menu from 'components/Menus/Menu.js';
import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import CloseIcon from '@material-ui/icons/CloseOutlined';
import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNewOutlined';
import DriveService from 'services/Apps/Drive/Drive.js';
import Button from 'components/Buttons/Button.js';
import ElectronService from 'services/electron/electron.js';
import './Viewer.scss';
import { Typography } from 'antd';

type PropsType = { [key: string]: any };
type StateType = { [key: string]: any };
type AppType = { [key: string]: any };

export default class Viewer extends Component<PropsType, StateType> {
  viewed_document: any;
  last_viewed_id: any;

  constructor(props: PropsType) {
    super(props);

    this.state = {
      i18n: Languages,
      loading_preview: false,
      did_load_preview: false,
    };

    Languages.addListener(this);
    Collections.get('drive').addListener(this);
    DriveService.addListener(this);

    window.addEventListener('keydown', (evt: any) => {
      evt = evt || window.event;
      let isEscape = false;
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
  componentWillUpdate(nextProps: any, nextState: any) {
    this.viewed_document = this.props.document || DriveService.viewed_document;
    if (this.viewed_document && this.viewed_document.id !== this.last_viewed_id) {
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
  openFile(app: AppType) {
    if (app.url && app.is_url_file) {
      window.open(app.url);
    }
    DriveService.getFileUrlForEdition(
      (((app.display || {}).drive_module || {}).can_open_files || {}).url,
      app,
      this.viewed_document.id,
      (url: string) => window.open(url),
    );
  }
  previewFile(url: string, app: AppType) {
    this.setState({ loading_preview: true });

    DriveService.getFileUrlForEdition(url, app, this.viewed_document.id, (url: string) => {
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

    const current = this.viewed_document;
    const candidates = DriveService.getEditorsCandidates(current);

    const preview_candidate: any = candidates.preview_candidate || [];
    const editor_candidate: any = candidates.editor_candidate || [];

    if (
      !this.state.loading_preview &&
      !this.state.did_load_preview &&
      preview_candidate.length > 0
    ) {
      this.previewFile(preview_candidate[0].url, preview_candidate[0].app);
    }

    const canPreviewWithElectron =
      preview_candidate.length === 0 && current.url && ElectronService.isElectron();

    return (
      <div className={'drive_viewer fade_in ' + (this.props.inline ? 'inline ' : '')}>
        {!this.props.disableHeader && (
          <div className="view_header">
            <div className="title">{current.name}</div>
            {!DriveService.previewonly && editor_candidate.length === 1 && (
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
            {!DriveService.previewonly && editor_candidate.length > 1 && (
              <Menu
                menu={editor_candidate.map((editor: { [key: string]: any }) => {
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
              <CloseIcon className="m-icon-small" />
            </div>

            {!DriveService.previewonly && (
              <div
                className="download"
                onClick={() => {
                  const link = DriveService.getLink(current, null, true, null);
                  window.open(link, current.url ? 'blank' : undefined);
                }}
              >
                {current.url && <OpenInNewIcon className="m-icon-small" />}
                {!current.url && <DownloadIcon className="m-icon-small" />}
              </div>
            )}
          </div>
        )}

        <div className="view_body">
          {this.state.did_load_preview && preview_candidate.length > 0 && (
            <iframe
              title={this.state.url_formated}
              src={this.state.url_formated || preview_candidate[0].url}
            />
          )}
          {canPreviewWithElectron && <webview src={current.url} />}

          {preview_candidate.length === 0 && !canPreviewWithElectron && (
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
                  <Typography.Link
                    onClick={() => window.open(current.url, 'blank')}
                    style={{ fontSize: 14 }}
                  >
                    {Languages.t('scenes.apps.drive.open_link', [], 'Open link in new window')}
                  </Typography.Link>
                  <br />
                  <br />
                  <Typography.Link
                    onClick={() => window.open('https://twake.app/download', 'blank')}
                    style={{ fontSize: 12 }}
                  >
                    {Languages.t(
                      'scenes.apps.drive.viewer.download_desktop',
                      [],
                      'Download Twake Desktop to preview in app',
                    )}
                  </Typography.Link>
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
