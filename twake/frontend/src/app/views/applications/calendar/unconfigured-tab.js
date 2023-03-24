import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Menu from 'components/menus/menu.js';
import Button from 'components/buttons/button.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import RouterService from 'app/features/router/services/router-service';
import CalendarSelector from 'components/calendar/calendar-selector/calendar-selector.js';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import WorkspaceService from 'app/deprecated/workspaces/workspaces';

import './calendar.scss';

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
    if (this.props.saveTab) this.props.saveTab({ calendars: this.state.selected });
    Menu.closeAll();
  }

  render() {
    var calendar_list = Collections.get('calendars').findBy({
      workspace_id: RouterService.getStateFromRoute().workspaceId,
    });

    return (
      <div>
        <div className="unconfigured_tab">
          <div className="title">{this.props.tab.name}</div>
          <div className="text" style={{ opacity: 0.5 }}>
            {Languages.t(
              'scenes.apps.calendar.unconfigured_tab',
              [],
              "Cet onglet n'est pas encore configuré.",
            )}
          </div>

          {AccessRightsService.getCompanyLevel(WorkspaceService.currentGroupId) !== 'guest' && (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  }
}
