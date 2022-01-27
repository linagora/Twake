import React, { useState } from 'react';
import MenusManager from 'app/components/menus/menus-manager.js';
import Button from 'components/buttons/button.js';
import Input from 'components/inputs/input.js';
import Menu from 'components/menus/menu.js';
import Languages from 'app/features/global/services/languages-service';

export const NewFolderInput = (props: { value: string; createFolder: (name: string) => void }) => {
  const [value, setValue] = useState(props.value);
  return (
    <div className="">
      <div style={{ padding: '0px' }}>
        <Input
          type="text"
          autoFocus
          className="medium bottom-margin full_width"
          onEchap={() => Menu.closeAll()}
          onEnter={() => {
            props.createFolder(value);
          }}
          placeholder={Languages.t(
            'scenes.apps.messages.left_bar.stream_modal.placeholder_name',
            [],
            'Name',
          )}
          value={value}
          onChange={(evt: any) => setValue(evt.target.value)}
        />
      </div>
      <div className="menu-buttons">
        <Button
          className="small"
          disabled=""
          type="button"
          value={Languages.t('scenes.apps.drive.create_folder_button', [], 'Créer')}
          onClick={() => {
            props.createFolder(value);
          }}
        />
      </div>
    </div>
  );
};

export const NewLinkInput = (props: {
  value: string;
  createLinkFile: (name: string, link: string) => void;
}) => {
  const [value, setValue] = useState(Languages.t('scenes.apps.drive.default_link_name'));
  const [link, setLink] = useState('');
  return (
    <div>
      <div className="menu-buttons">
        <Input
          onEchap={() => {
            MenusManager.closeMenu();
          }}
          autoFocus
          value={value}
          onChange={(evt: any) => setValue(evt.target.value)}
          className="full_width bottom-margin"
        />
        <Input
          onEchap={() => {
            MenusManager.closeMenu();
          }}
          placeholder="http://google.com"
          value={link}
          onChange={(evt: any) => setLink(evt.target.value)}
          className="full_width bottom-margin"
        />
      </div>
      <div className="menu-buttons">
        <Button
          disabled={(value || '').length <= 0}
          type="button"
          value={Languages.t('scenes.apps.drive.add_button')}
          onClick={() => {
            props.createLinkFile(value, link);
          }}
        />
      </div>
    </div>
  );
};

export const NewFileInput = (props: { value: string; createFile: (name: string) => void }) => {
  const [value, setValue] = useState(props.value);
  return (
    <div>
      <div className="menu-buttons">
        <Input
          onEchap={() => {
            MenusManager.closeMenu();
          }}
          autoFocus
          value={value}
          onChange={(evt: any) => setValue(evt.target.value)}
          className="full_width bottom-margin"
        />
      </div>
      <div className="menu-buttons">
        <Button
          disabled={(value || '').length <= 0}
          type="button"
          value={Languages.t('scenes.apps.drive.add_button', [], 'Ajouter')}
          onClick={() => {
            props.createFile(value);
          }}
        />
      </div>
    </div>
  );
};
