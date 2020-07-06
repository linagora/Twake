import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import moment from 'moment';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import EventModification from './EventModification.js';
import CalendarService from 'services/Apps/Calendar/Calendar.js';
import Participants from './Part/Participants.js';
import CalendarSelector from 'components/Calendar/CalendarSelector/CalendarSelector.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import DateTimeUtils from 'services/utils/datetime.js';
import Button from 'components/Buttons/Button.js';
import Icon from 'components/Icon/Icon.js';
import Tabs from 'components/Tabs/Tabs.js';
import SearchService from 'services/search/search.js';
import WorkspacesService from 'services/workspaces/workspaces.js';
import UserService from 'services/user/user.js';

export default class EventDetails extends Component {
  constructor(props) {
    super(props);

    Collections.get('events').addListener(this);
    if (props.event.front_id) {
      Collections.get('events').listenOnly([props.event.front_id], this);
    }
  }
  componentWillMount() {
    CalendarService.fullSizeModal = false;
  }
  componentDidMount() {
    MediumPopupManager.mountedComponent = this;
  }
  componentWillUnmount() {
    Collections.get('events').removeListener(this);
  }
  remove() {
    var event = Collections.get('events').findByFrontId(this.props.event.front_id);
    AlertManager.confirm(
      () => {
        CalendarService.remove(event, this.props.collectionKey);
      },
      () => {},
      {
        text: Languages.t(
          'scenes.apps.calendar.modals.remove_event_text',
          [],
          Languages.t(
            'scenes.apps.calendar.modals.remove_event_alert_confirmation',
            [],
            "Supprimer l'événement ?",
          ),
        ),
      },
    );
  }
  render() {
    var event = Collections.get('events').findByFrontId(this.props.event.front_id);

    if (!event) {
      return '';
    }

    var from = new Date(event.from * 1000);
    var to = new Date(event.to * 1000);

    var next = Math.min(from || to, to || from);

    var from_formatted = moment(from).format(
      'ddd Do MMMM YYYY' + (event.all_day ? '' : ', ' + DateTimeUtils.getDefaultTimeFormat()),
    );
    var to_formatted =
      (!event.type || event.type == 'event' || event.type == 'move') &&
      !isNaN(event.to) &&
      moment(to).format(
        (moment(to).format('D_M_YYYY') != moment(from).format('D_M_YYYY')
          ? 'ddd Do ' +
            (moment(to).format('M_YYYY') != moment(from).format('M_YYYY')
              ? 'MMMM ' + (moment(to).format('YYYY') != moment(from).format('YYYY') ? 'YYYY' : '')
              : '') +
            (event.all_day ? '' : ', ')
          : '') + (event.all_day ? '' : DateTimeUtils.getDefaultTimeFormat()) || '[]',
      );

    from_formatted = (from_formatted || '').replace(' ' + new Date().getFullYear(), '');
    to_formatted = (to_formatted || '').replace(' ' + new Date().getFullYear(), '');

    var event_type =
      CalendarService.event_types_by_value[event.type] ||
      CalendarService.event_types_by_value['event'];
    var readonly = CalendarService.getIsReadonly(this.props.event);

    return (
      <div className="eventModal event_details">
        <div className="title">
          {event.title || Languages.t('scenes.apps.calendar.modals.untitled', [], 'Sans titre')}
        </div>
        <div className="subtitle date">
          <Icon type="clock" />
          {from_formatted}
          {to_formatted && ' - ' + to_formatted}
          {' (' + moment(next).fromNow() + ')'}
        </div>

        <div style={{ margin: '0 -16px' }}>
          <Tabs
            tabs={[
              {
                title: Languages.t('scenes.apps.calendar.modals.details_title', [], 'Détails'),
                render: (
                  <div>
                    <div className="bottom-margin">
                      <div className="event_type">
                        <Icon type={event_type.icon} />
                        {event_type.text}
                      </div>

                      <CalendarSelector
                        readonly
                        value={event.workspaces_calendars}
                        openEventInWorkspace={workspace => {
                          SearchService.select({
                            type: 'event',
                            event: this.props.event,
                            workspace: workspace,
                          });
                        }}
                      />
                    </div>

                    {event.description && (
                      <div className="subtitle description bottom-margin">
                        <Icon type="align-left-justify" style={{ marginRight: 4 }} />
                        {event.description}
                      </div>
                    )}

                    {event.location && (event.location || '').slice(0, 4) != 'http' && (
                      <div className="subtitle location bottom-margin">
                        <Icon type="location-point" style={{ marginRight: 4 }} />
                        {event.location}
                      </div>
                    )}

                    {event.location && (event.location || '').slice(0, 4) == 'http' && (
                      <div
                        onClick={() => {
                          var separator = '?';
                          if (event.location.indexOf('?') > 0) {
                            separator = '&';
                          }
                          window.open(
                            event.location +
                              separator +
                              'twake_user=' +
                              UserService.getCurrentUser().id +
                              '&twake_group=' +
                              WorkspacesService.currentGroupId,
                          );
                        }}
                        className="subtitle location bottom-margin"
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <Icon type="link" style={{ marginRight: 4 }} />
                        <a>
                          {Languages.t('scenes.apps.calendar.video_link', [], 'Click to open link')}{' '}
                          - {event.location}
                        </a>
                      </div>
                    )}

                    {(event.notifications || []).length > 0 && (
                      <div className="subtitle reminders bottom-margin">
                        <Icon type="bell" style={{ marginRight: 4 }} />
                        {(event.notifications || []).length}{' '}
                        {Languages.t('scenes.apps.calendar.reminders', [], 'rappel(s)')}
                      </div>
                    )}

                    {/*
              <div className="text">
                {(event.notifications || []).length} rappel(s), événement {event.private?"privé":"public"} et marqué comme {event.available?"disponible":"occupé"}.
              </div>*/}

                    <div style={{ marginTop: '-16px' }} />
                  </div>
                ),
              },
              {
                title: Languages.t(
                  'scenes.apps.calendar.modals.participants_event',
                  [],
                  'Participants',
                ),
                render: (
                  <div>
                    <Participants readOnly participants={event.participants} owner={event.owner} />
                  </div>
                ),
              },
            ]}
          />
        </div>

        {!readonly && (
          <div style={{ marginTop: '-16px' }}>
            <div className="separator" />

            <Button
              className="button medium danger medium"
              style={{ width: 'auto' }}
              onClick={() => {
                this.remove();
              }}
            >
              {Languages.t('scenes.apps.calendar.modals.remove_button', [], 'Supprimer')}
            </Button>

            <Button
              className="button medium secondary-light medium"
              style={{ width: 'auto', float: 'right' }}
              onClick={() => {
                CalendarService.edit(this.props.event);
                MediumPopupManager.open(
                  <EventModification
                    event={CalendarService.edited}
                    collectionKey={this.props.collectionKey}
                  />,
                  { size: { width: 600 } },
                );
              }}
            >
              {Languages.t(
                'scenes.apps.calendar.modals.modify_event_button',
                [],
                "Modifier l'évènement",
              )}
            </Button>
          </div>
        )}
        {readonly && <div style={{ marginTop: '-16px' }} />}
      </div>
    );
  }
}
