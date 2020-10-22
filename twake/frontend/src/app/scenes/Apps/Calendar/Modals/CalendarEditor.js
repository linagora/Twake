import React, { Component } from 'react';
import InputWithColor from 'components/Inputs/InputWithColor.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import Button from 'components/Buttons/Button.js';
import Menu from 'components/Menus/Menu.js';
import Languages from 'services/languages/languages.js';

export default class CalendarEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      calendar: Collections.get('calendars').editCopy(props.calendar || {}),
    };
  }
  save() {
    this.state.calendar.workspace_id = WorkspaceService.currentWorkspaceId;
    Collections.get('calendars').save(this.state.calendar, this.props.collectionKey);
    Menu.closeAll();
  }
  setKey(obj) {
    Object.keys(obj || {}).forEach(k => {
      this.state.calendar[k] = obj[k];
    });
    this.setState({});
  }
  render() {
    var calendar = this.state.calendar;

    return (
      <div className="">
        <InputWithColor
          className="medium bottom-margin full_width"
          focusOnDidMount
          menu_level={this.props.level}
          placeholder={Languages.t('scenes.apps.calendar.calendar_modal.placeholder', [], 'Name')}
          value={[this.state.calendar.color, this.state.calendar.title]}
          onEnter={() => this.save()}
          onChange={value => {
            this.setKey({ color: value[0], title: value[1] });
          }}
        />

        <div className="menu-buttons">
          <Button
            disabled={(this.state.calendar.title || '').length <= 0}
            type="button"
            value={
              this.state.calendar.id
                ? Languages.t('general.save', [], 'Enregistrer')
                : Languages.t('general.add', [], 'Ajouter')
            }
            onClick={() => this.save()}
          />
        </div>
      </div>
    );
  }
}
