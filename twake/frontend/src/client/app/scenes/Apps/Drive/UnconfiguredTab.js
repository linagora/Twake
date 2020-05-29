import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import FilePicker from 'components/Drive/FilePicker/FilePicker.js';
import Menu from 'components/Menus/Menu.js';
import ChannelsService from 'services/channels/channels.js';
import Button from 'components/Buttons/Button.js';
import './Drive.scss';

export default class UnconfiguredTab extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  initInDirectory(dir) {
    if (!dir.id) {
      Menu.closeAll();
      return;
    }
    ChannelsService.saveTab(
      this.props.channel.id,
      this.props.tab.app_id,
      undefined,
      { directory_id: dir.id },
      this.props.tab.id,
    );
    this.props.onFinish();
    Menu.closeAll();
  }
  initAsFile(file) {
    if (!file.id) {
      Menu.closeAll();
      return;
    }

    var icon = 'file';
    if (file.url) {
      icon = 'link';
    }

    ChannelsService.saveTab(
      this.props.channel.id,
      this.props.tab.app_id,
      undefined,
      { file_id: file.id, directory_id: file.id, icon: icon },
      this.props.tab.id,
    );
    this.props.onFinish();
    Menu.closeAll();
  }
  render() {
    return (
      <div className="unconfigured_tab">
        <div className="title">{this.props.tab.name}</div>
        <div className="text" style={{ opacity: 0.5 }}>
          {Languages.t(
            'scenes.apps.drive.unconfigured_tab',
            [],
            "Cet onglet n'est pas encore configuré.",
          )}
        </div>

        <br />
        <Menu
          menu={[
            {
              type: 'react-element',
              reactElement: () => (
                <FilePicker
                  mode={'select_location'}
                  onChoose={directory => this.initInDirectory(directory)}
                />
              ),
            },
          ]}
          style={{ display: 'inline-block' }}
        >
          <Button className="button medium medium bottom-margin" style={{ width: 'auto' }}>
            {Languages.t('scenes.apps.drive.choose_folder_button', [], 'Choisir un dossier')}
          </Button>
        </Menu>

        <br />
        <Menu
          menu={[
            {
              type: 'react-element',
              reactElement: () => (
                <FilePicker mode={'select_file'} onChoose={file => this.initAsFile(file)} />
              ),
            },
          ]}
          style={{ display: 'inline-block' }}
        >
          <Button className="button small secondary-light" style={{ width: 'auto' }}>
            {Languages.t('scenes.apps.drive.choose_file_button', [], 'Choisir un fichier')}
          </Button>
        </Menu>
      </div>
    );
  }
}
