import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import CalendarService from 'app/deprecated/Apps/Calendar/Calendar.js';
import Input from 'components/inputs/input.js';
import InputIcon from 'components/inputs/input-icon.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import ReminderSelector from 'components/reminder-selector/reminder-selector.js';
import Participants from './Part/Participants.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import DateSelector from './Part/DateSelector.js';
import AttachmentPicker from 'components/attachment-picker/attachment-picker.js';
import CalendarSelector from 'components/calendar/calendar-selector/calendar-selector.js';
import Button from 'components/buttons/button.js';
import Select from 'components/select/select.js';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.js';
import MediumPopupManager from 'app/components/modal/modal-manager';
import Icon from 'components/icon/icon.js';
import PerfectScrollbar from 'react-perfect-scrollbar';
import './Modals.scss';

export default class EventModification extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    CalendarService.fullSizeModal = true;
  }

  componentDidMount() {
    MediumPopupManager.mountedComponent = this;
  }

  save() {
    CalendarService.saveEdit(this.props.collectionKey);
  }

  remove() {
    AlertManager.confirm(
      () => {
        CalendarService.remove(CalendarService.edited, this.props.collectionKey);
      },
      () => {},
      {
        text: Languages.t(
          'scenes.apps.calendar.modals.remove_event_text',
          [],
          "Supprimer l'événement ?",
        ),
      },
    );
  }

  onMediumPopupClose() {
    CalendarService.closePopups();
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
      <PerfectScrollbar options={{ suppressScrollX: true }} style={{ padding: '16px' }}>
        <div className="eventModal event_modification">
          <Input
            autoFocus
            value={event.title || ''}
            placeholder={Languages.t('scenes.apps.calendar.modals.event_title_placeholder')}
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

          <div style={{ display: 'flex' }} className="full_width">
            <div style={{ flex: 1, display: 'flex' }}>
              <InputIcon
                icon={(event.location || '').slice(0, 4) == 'http' ? 'link' : 'location-point'}
                medium
                value={event.location || ''}
                placeholder={Languages.t('scenes.apps.calendar.modals.event_adresse_placeholder')}
                onChange={evt => {
                  this.change('location', evt.target.value);
                }}
                className="full_width bottom-margin right-margin"
              />
            </div>
            <Button
              className="button medium default bottom-margin"
              onClick={() => {
                this.change(
                  'location',
                  window.location.protocol +
                    '//' +
                    window.location.host +
                    '/bundle/connectors/jitsi/call/twake_event_' +
                    (event.front_id || '').replace(/-/g, '_') +
                    '__' +
                    (event.front_id || '').replace(/-/g, '_'),
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
              'scenes.apps.calendar.modals.event_description_placeholder',
              [],
              'Description',
            )}
            onChange={evt => {
              this.change('description', evt.target.value);
            }}
            className="full_width bottom-margin"
          />

          {/*
      <span className="right-margin">
        <Checkbox small value={event.available} onChange={(value)=>{this.change("available", value)}} label="Afficher comme disponible"/>
      </span>
      <Checkbox small value={event.private} onChange={(value)=>{this.change("private", value)}} label="Événement privé" />
      <br/>
      */}

          <CalendarSelector
            medium
            value={event.workspaces_calendars || []}
            onChange={workspaces_calendars => {
              this.change('workspaces_calendars', workspaces_calendars);
            }}
            calendarList={calendar_list}
            className=""
          />

          <div className="separator" />

          <Participants
            style={{ margin: 0 }}
            participants={event.participants}
            owner={event.owner}
            onChange={user_id_or_mail => this.change('participants', user_id_or_mail)}
          />

          <div className="separator" />

          <div className="bottom-margin">
            <b>{Languages.t('scenes.apps.tasks.modals.attachments')}</b>
          </div>

          <AttachmentPicker
            attachments={event.attachments}
            onChange={attachments => this.change('attachments', attachments)}
          />

          <div className="separator" />

          <div className="bottom-margin">
            <b>{Languages.t('scenes.apps.calendar.modals.reminders')}</b>
          </div>

          <ReminderSelector
            reminders={event.notifications || []}
            onChange={reminders => this.change('notifications', reminders)}
          />

          <div className="separator" />

          <Button
            className="button medium danger medium"
            style={{ width: 'auto' }}
            onClick={() => {
              this.remove();
            }}
          >
            {Languages.t('scenes.apps.calendar.modals.remove_event_button')}
          </Button>

          <Button
            className="button medium btn-primary medium"
            style={{ width: 'auto', float: 'right' }}
            onClick={() => {
              this.save();
            }}
          >
            {Languages.t('general.save')}
          </Button>
        </div>
      </PerfectScrollbar>
    );
  }
}
