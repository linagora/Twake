import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Menu from 'components/Menus/Menu.js';
import ChannelsService from 'services/channels/channels.js';
import Button from 'components/Buttons/Button.js';
import Collections from 'services/Collections/Collections.js';
import './Calendar.scss';

import CalendarSelector from 'components/Calendar/CalendarSelector/CalendarSelector.js';

export default class UnconfiguredTab extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      selected: [],
    };

    Languages.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  initInCalendars() {
    ChannelsService.saveTab(
      this.props.channel.id,
      this.props.tab.app_id,
      undefined,
      { calendars: this.state.selected },
      this.props.tab.id,
    );
    Menu.closeAll();
  }
  render() {
    var calendar_list = Collections.get('calendars').findBy({
      workspace_id: this.props.channel.original_workspace,
    });

    return (
      <div className="unconfigured_tab">
        <div className="title">{this.props.tab.name}</div>
        <div className="text" style={{ opacity: 0.5 }}>
          {Languages.t(
            'scenes.apps.calendar.unconfigured_tab',
            [],
            "Cet onglet n'est pas encore configuré.",
          )}
        </div>

        <br />
        <CalendarSelector
          allowMultiple
          medium
          value={this.state.selected}
          onChange={workspaces_calendars => {
            this.setState({ selected: workspaces_calendars });
          }}
          calendarList={calendar_list || []}
          className=""
        />

        <br />

        {this.state.selected.length > 0 && (
          <Button
            className="button medium"
            onClick={() => this.initInCalendars()}
            style={{ width: 'auto' }}
          >
            {Languages.t('general.continue', [], 'Continuer')}
          </Button>
        )}
      </div>
    );
  }
}
