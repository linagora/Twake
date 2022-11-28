/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from 'react';
import InputWithColor from 'components/inputs/input-with-color.jsx';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.jsx';
import Button from 'components/buttons/button.jsx';
import Menu from 'components/menus/menu.jsx';
import Languages from 'app/features/global/services/languages-service';

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
