import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import EventModification from './EventModification.js';
import CalendarService from 'services/Apps/Calendar/Calendar.js';
import Input from 'components/Inputs/Input.js';
import InputIcon from 'components/Inputs/InputIcon.js';
import Participants from './Part/Participants.js';
import DateSelector from './Part/DateSelector.js';
import CalendarSelector from 'components/Calendar/CalendarSelector/CalendarSelector.js';
import Collections from 'services/Collections/Collections.js';
import Button from 'components/Buttons/Button.js';
import Select from 'components/Select/Select.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import Icon from 'components/Icon/Icon.js';

export default class EventCreation extends Component {
  constructor(props) {
    super(props);
    Collections.get('events').addListener(this);
    Collections.get('events').listenOnly([props.event.front_id], this);
  }

  componentWillMount() {
    CalendarService.fullSizeModal = false;
  }

  componentDidMount() {
    MediumPopupManager.mountedComponent = this;
    this.doNotCancelEdit = false;
  }
  componentWillUnmount() {
    Collections.get('events').removeListener(this);
  }

  onMediumPopupClose() {
    if (!this.doNotCancelEdit) {
      CalendarService.closePopups();
    }
  }

  save() {
    CalendarService.saveEdit(this.props.collectionKey);
  }
  change(key, value, notify) {
    this.props.event[key] = value;

    if (notify || notify === undefined) {
      this.update_timeout && clearTimeout(this.update_timeout);
      this.update_timeout = setTimeout(() => {
        Collections.get('events').notify();
      }, 1000);
      this.setState({});
    }
  }
  render() {
    var event = this.props.event;
    var calendar_list = Collections.get('calendars').findBy({
      workspace_id: WorkspaceService.currentWorkspaceId,
    });

    return (
      <div className="eventModal event_creation">
        <Input
          autoFocus
          value={event.title || ''}
          placeholder={Languages.t('scenes.apps.calendar.modals.title_placeholder', [], 'Titre')}
          onChange={evt => {
            this.change('title', evt.target.value);
          }}
          className="full_width bottom-margin"
          big
        />

        <div className="bottom-margin date_and_type">
          <Select
            medium
            value={event.type || 'event'}
            onChange={value => {
              this.change('type', value);
            }}
            options={CalendarService.event_types}
            className="right-margin"
          />
          <DateSelector
            event={event}
            onChange={(from, to, all_day, repetition_definition) => {
              this.change('from', from, false);
              this.change('to', to, false);
              this.change('all_day', all_day, false);
              this.change('repetition_definition', repetition_definition);
            }}
          />
        </div>

        <div style={{ display: 'flex' }} className="full_width bottom-margin">
          <div style={{ flex: 1, display: 'flex' }} className="right-margin">
            <InputIcon
              icon={(event.location || '').slice(0, 4) == 'http' ? 'link' : 'location-point'}
              medium
              value={event.location || ''}
              placeholder={Languages.t(
                'scenes.apps.calendar.modals.event_adresse_placeholder',
                [],
                'Adresse',
              )}
              onChange={evt => {
                this.change('location', evt.target.value);
              }}
              className="full_width"
            />
          </div>
          <Button
            className="button medium secondary"
            onClick={() => {
              this.change(
                'location',
                'https://connectors.albatros.twakeapp.com/jitsi/call/twake-event-' + event.front_id,
              );
            }}
          >
            <Icon type="video" />
          </Button>
        </div>

        <InputIcon
          autoHeight
          icon="align-left-justify"
          medium
          value={event.description || ''}
          placeholder={Languages.t(
            'scenes.apps.calendar.modals.description_placeholder',
            [],
            'Description',
          )}
          onChange={evt => {
            this.change('description', evt.target.value);
          }}
          className="full_width bottom-margin"
        />

        <CalendarSelector
          medium
          value={event.workspaces_calendars || []}
          onChange={workspaces_calendars => {
            this.change('workspaces_calendars', workspaces_calendars);
          }}
          calendarList={calendar_list || []}
          className=""
        />

        <div className="separator" />

        <Participants
          participants={event.participants}
          owner={event.owner}
          onChange={user_id_or_mail => this.change('participants', user_id_or_mail)}
        />

        <div className="separator" />

        <Button
          className="button medium secondary-light medium"
          style={{ width: 'auto' }}
          onClick={() => {
            this.doNotCancelEdit = true;
            MediumPopupManager.open(
              <EventModification
                event={CalendarService.edited}
                collectionKey={this.props.collectionKey}
              />,
              { size: { width: 600 } },
            );
          }}
        >
          {Languages.t('scenes.apps.calendar.modals.advanced_options', [], 'Options avancées')}
        </Button>
        <Button
          className="button medium btn-primary medium"
          style={{ width: 'auto', marginLeft: 10, float: 'right' }}
          onClick={() => {
            this.save();
          }}
        >
          {Languages.t('general.save', [], 'Enregistrer')}
        </Button>
      </div>
    );
  }
}
