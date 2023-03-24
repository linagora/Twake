import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';

import '@fullcalendar/core';
import '@fullcalendar/core/main.css';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import momentPlugin from '@fullcalendar/moment';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendarPlugin from '@fullcalendar/react';

import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import '@fullcalendar/list/main.css';
import CalendarService from 'app/deprecated/Apps/Calendar/Calendar.js';
import EventUI from 'components/calendar/event/event.js';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.js';
import Languages from 'app/features/global/services/languages-service';

import moment from 'moment';

import './full-calendar.scss';

export default class FullCalendar extends Component {
  constructor() {
    super();
    this.calendarRef = null;
    window.react_calendar = this;
    this.event_dom_elements = {};
    this.eventsById = {};

    this.clickOut = this.clickOut.bind(this);
  }

  getDomElement(event) {
    return this.event_dom_elements[event.front_id];
  }

  componentWillMount() {
    var that = this;
    var scrollTime = moment().format('HH') + ':00:00';
    this.options = {
      defaultDate: this.props.date || new Date(),
      header: false,
      timezone: 'local',
      height: 'parent',
      locale: this.props.i18n,
      nowIndicator: true,
      scrollTime: scrollTime,
      firstHour: new Date().getUTCHours() - 5,
      allDaySlot: true,
      editable: true,
      selectable: true,
      selectHelper: true,
      firstDay: moment().startOf('week').isoWeekday(),
      slotDuration: '00:30:00',
      snapDuration: '00:15:00',
      columnHeaderHtml: mom => {
        return ReactDOMServer.renderToString(
          <div className="">
            <div className="number">{moment(mom).format('D')}</div>
            <div className="day">{moment(mom).format('ddd')}</div>
          </div>,
        );
      },

      eventAllow: function (dropLocation, draggedEvent) {
        //        if(!that.state.calendar.calendars[draggedEvent.calendar]){
        //          return false;
        //        }
        return true;
      },
      select: function (event) {
        that.cancelClickOut = true;

        //Create event
        if (moment(event.end).diff(event.start) === 15 * 60 * 1000) {
          that.api.unselect();
          that.props.onClickOut && that.props.onClickOut();
          return false;
        }
        if (that.props.onCreate) {
          // eslint-disable-next-line no-unused-vars
          var created_event = that.props.onCreate(
            that.fcToCollection(event),
            that.event_dom_elements[event.id],
          );
        }
        if (that.props.onUpdate) {
          that.props.onUpdate(that.fcToCollection(event), that.event_dom_elements[event.id]);
        }
      },
      eventResize: function (event) {
        event = event.event;
        if (that.props.onUpdate) {
          that.props.onUpdate(that.fcToCollection(event), that.event_dom_elements[event.id]);
        }
      },
      eventDrop: function (event) {
        event = event.event;
        if (that.props.onUpdate) {
          that.props.onUpdate(that.fcToCollection(event), that.event_dom_elements[event.id]);
        }
      },
      eventClick: function (_event) {
        if (this.disableUpdate) {
          this.disableUpdate = false;
          this.refreshEvent();
        }

        var event = _event.event;

        if (that.props.onClickEvent) {
          that.props.onClickEvent(that.fcToCollection(event), _event.jsEvent, _event.el);
        }

        //if(!event.private_content){ViewsServiceImpl.open();that.state.calendar.selectEvent(event);}
      },
      eventRender: function (event) {
        if (event.event && event.event.id && event.isStart && !event.isMirror) {
          that.event_dom_elements[event.event.id] = event.el;
        }
        var col_event = that.eventsById[event.event.id];

        if (col_event._user_transparent) {
          event.el.classList.add('transparent');
        } else {
          event.el.classList.remove('transparent');
        }

        var color = '';
        if (col_event.workspaces_calendars && col_event.workspaces_calendars[0]) {
          var calendar = null;
          (col_event.workspaces_calendars || []).some(cal => {
            var calendar_id = cal.calendar_id;
            if (calendar_id && that.props.getCalendar) {
              var tmp = that.props.getCalendar(calendar_id);
              if (tmp && tmp.workspace_id === WorkspaceService.currentWorkspaceId) {
                calendar = tmp;
                return true;
              }
            }
            return false;
          });
          color = calendar ? calendar.color : '#92929C';
        }

        if (color) {
          event.el.style.backgroundColor = color;
        }

        if (col_event.type === 'deadline' || col_event.type === 'remind') {
          event.el.classList.add('not_resizable');
        }

        event.el.firstChild.innerHTML = ReactDOMServer.renderToString(
          <EventUI event={col_event} getColor={cal_id => color || 'var(--primary)'} />,
        );
      },
      eventResizeStart: () => {
        that.cancelClickOut = true;
        this.disableUpdate = true;
      },
      eventDragStart: () => {
        that.cancelClickOut = true;
        this.disableUpdate = true;
      },
      eventResizeStop: () => {
        that.cancelClickOut = false;
        this.disableUpdate = false;
        if (this.missedRefresh) {
          this.refreshEvent();
        }
      },
      eventDragStop: () => {
        that.cancelClickOut = false;
        this.disableUpdate = false;
        if (this.missedRefresh) {
          this.refreshEvent();
        }
      },
    };
  }

  componentWillUnmount() {
    var page = window.document.getElementsByClassName('appPage')[0];
    if (page) {
      page.removeEventListener('click', this.clickOut);
    }
  }

  componentDidMount() {
    var page = window.document.getElementsByClassName('appPage')[0];
    if (page) {
      page.addEventListener('click', this.clickOut);
    }

    if (this.calendarRef) {
      this.api = this.calendarRef.getApi();
    }
    this.refreshEvent();

    window.dispatchEvent(new Event('resize'));
  }

  componentDidUpdate() {
    this.refreshEvent();
  }

  clickOut() {
    if (this.cancelClickOut) {
      return;
    }

    this.props.onClickOut && this.props.onClickOut();
  }

  refreshEvent() {
    if (this.disableUpdate) {
      this.missedRefresh = true;
      return;
    }

    this.missedRefresh = false;

    var events = this.props.events.map(event => this.collectionToFc(event));
    //Monkey fix for events not appearing randomly
    this.api.removeAllEvents();
    this.api.addEventSource(events);
    this.api.rerenderEvents();
  }

  previous() {
    this.willChangeView(false);
    this.api.prev();
    this.props.onDateChange && this.props.onDateChange(this.api.getDate());
  }

  next() {
    this.willChangeView(true);
    this.api.next();
    this.props.onDateChange && this.props.onDateChange(this.api.getDate());
  }

  today() {
    this.willChangeView();
    this.api.today();
    this.props.onDateChange && this.props.onDateChange(this.api.getDate());
  }

  setDate(date, disableAnimation) {
    if (!disableAnimation) {
      this.willChangeView();
    }
    this.api.gotoDate(moment(date).toDate());
    this.props.onDateChange && this.props.onDateChange(moment(date).toDate());
  }

  view(view) {
    if (view !== this.api.type) {
      this.willChangeView();
      this.api.changeView(view);
      this.props.onViewChange && this.props.onViewChange(view);
      this.props.onDateChange && this.props.onDateChange(this.api.getDate());
    }
  }

  willChangeView(forward) {
    var old_effect =
      this.calendarRef.elRef.current.parentElement.getElementsByClassName('false_calendar')[0];
    if (old_effect) {
      this.calendarRef.elRef.current.parentElement.removeChild(old_effect);
    }
    var calendar = this.calendarRef.elRef.current;
    calendar.classList = 'fc fc-ltr fc-unthemed';
    var scroll_state = calendar.getElementsByClassName('fc-scroller')[0];
    if (scroll_state) {
      scroll_state = scroll_state.scrollTop;
    } else {
      scroll_state = 0;
    }

    var clone = calendar.cloneNode(true);

    calendar.classList.add('calendar_invisible');
    setTimeout(() => {
      this.calendarRef.elRef.current.classList.remove('calendar_invisible');
      if (forward === undefined) {
        this.calendarRef.elRef.current.classList.add('calendar_appear');
      } else if (forward) {
        this.calendarRef.elRef.current.classList.add('calendar_appear_right');
      } else {
        this.calendarRef.elRef.current.classList.add('calendar_appear_left');
      }
    }, 20);

    clone.classList.add('calendar_disappear');
    clone.classList.add('false_calendar');
    calendar.parentElement.append(clone);
    var scroller = clone.getElementsByClassName('fc-scroller')[0];
    if (scroll_state !== scroller.scrollTop) {
      scroller.scrollTop = scroll_state;
    }
  }

  fcToCollection(event) {
    return {
      id: event.extendedProps ? event.extendedProps.real_id : '',
      front_id: event.id,
      from:
        (event.allDay
          ? moment(moment(event.start).format('YYYY-MM-DDT00:00:00+00:00')).valueOf()
          : moment(event.start).utc().valueOf()) / 1000,
      to:
        (event.allDay
          ? moment(moment(event.end).format('YYYY-MM-DDT00:00:00+00:00')).valueOf()
          : moment(event.end).utc().valueOf()) /
          1000 -
        (event.allDay ? 24 * 60 * 60 : 0),
      all_day: event.allDay,
      //repetition_definition: { string: event.rrule, duration: event.duration },
    };
  }

  collectionToFc(event) {
    var force_allday = false;
    if (Math.abs(event.from - event.to) > 60 * 60 * 24 * 2) {
      force_allday = true;
    }

    this.eventsById[event.front_id] = event;

    var from = event.from;
    var to = event.to;

    if (event.type === 'remind' || event.type === 'deadline') {
      to = parseInt(from) + 15 * 60;
    }

    // eslint-disable-next-line no-redeclare
    var event = {
      id: event.front_id,
      real_id: event.id,
      start: moment(from * 1000).toDate(),
      end: moment(to * 1000 + (event.all_day ? 24 * 60 * 60 * 1000 : 0)).toDate(),
      allDay: event.all_day || force_allday,
      title: event.title || Languages.t('scenes.apps.drive.navigators.new_file.untitled'),
      //rrule: (event.repetition_definition || {}).string, //'DTSTART:20190201T103000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20190601;BYDAY=MO,FR',
      duration: (event.repetition_definition || {}).duration,
      editable: !CalendarService.getIsReadonly(event),
    };
    return event;
  }

  render() {
    return (
      <div className="twake_fullcalendar show_day_line">
        <FullCalendarPlugin
          defaultView="timeGridWeek"
          ref={node => (this.calendarRef = node)}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            momentPlugin,
            momentTimezonePlugin,
            interactionPlugin,
            listPlugin,
          ]}
          {...this.options}
        />
      </div>
    );
  }
}
