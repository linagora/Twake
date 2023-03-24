import React, { Component, useState } from 'react';

import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Languages from 'app/features/global/services/languages-service';
import UserService from 'app/features/users/services/current-user-service';
import CalendarService from 'app/deprecated/Apps/Calendar/Calendar.js';
import LocalStorage from 'app/features/global/framework/local-storage-service';

import ModalManager from 'app/components/modal/modal-manager';

import Icon from 'components/icon/icon.js';
import moment from 'moment';
import Groups from 'app/deprecated/workspaces/groups.js';
import FullCalendar from './full-calendar/full-calendar.js';
import EventDetails from './modals/EventDetails.js';
import EventCreation from './modals/EventCreation.js';
import EventModification from './modals/EventModification.js';
import CalendarEditor from './modals/CalendarEditor.js';
import Menu from 'components/menus/menu.js';
import DayPicker from 'components/calendar/day-picker/day-picker.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import WorkspacesService from 'app/deprecated/workspaces/workspaces.js';
import popupManager from 'app/deprecated/popupManager/popupManager.js';
import ConnectorsListManager from 'components/connectors-list-manager/connectors-list-manager.js';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import Checkbox from 'components/inputs/checkbox.js';
import InputWithClipBoard from 'components/input-with-clip-board/input-with-clip-board.js';
import Select from 'components/select/select.js';
import WorkspaceParameter from 'app/views/client/popup/WorkspaceParameter/WorkspaceParameter.js';
import UnconfiguredTab from './unconfigured-tab.js';
import RouterService from 'app/features/router/services/router-service';
import MainPlus from 'components/main-plus/main-plus.js';
import {
  getCompanyApplication as getApplication,
  getCompanyApplications,
} from 'app/features/applications/state/company-applications';

import './calendar.scss';

const ExportView = props => {
  const [export_my_calendar, set_export_my_calendar] = useState(props.values.export_my_calendar);
  const [export_workspace_calendar, set_export_workspace_calendar] = useState(
    props.values.export_workspace_calendar,
  );
  return (
    <div style={{ marginTop: -8 }}>
      <Checkbox
        label={Languages.t('scenes.apps.calendar.my_calendar_label', [], 'Mon calendrier')}
        small
        className=""
        value={export_my_calendar}
        onChange={value => {
          set_export_my_calendar(value);
          props.onChange(export_my_calendar, export_workspace_calendar);
        }}
      />
      <Checkbox
        label={Languages.t('scenes.apps.calendar.workspace_label', [], 'Cet espace de travail')}
        small
        className=""
        value={export_workspace_calendar}
        onChange={value => {
          set_export_workspace_calendar(value);
          props.onChange(export_my_calendar, export_workspace_calendar);
        }}
      />
    </div>
  );
};

export default class Calendar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      i18n: Languages,
      view: 'timeGridWeek',
      filter: 'workspace',
      preview: null,
      export_my_calendar: true,
      export_workspace_calendar: true,
      new_calendar: {},
    };
    CalendarService.filter_mode = this.state.filter;

    this.props = props;
    const { workspaceId, channelId } = RouterService.getStateFromRoute();

    this.loaded_date_range = {};
    this.calendar_collection_key = 'calendar_' + workspaceId;

    this.setLoadedRange(
      'both',
      moment(CalendarService.date).startOf('month').toDate().getTime() / 1000 - 60 * 60 * 24 * 31,
      moment(CalendarService.date).startOf('month').toDate().getTime() / 1000 +
        2 * 60 * 60 * 24 * 31,
    );

    Collections.get('calendars').addListener(this);
    Collections.get('calendars').addSource(
      {
        http_base_url: 'calendar/calendar',
        http_options: {
          channel_id: channelId,
          workspace_id: workspaceId,
        },
        websockets: [
          {
            uri: 'calendars/' + workspaceId,
            options: { type: 'calendar' },
          },
        ],
      },
      this.calendar_collection_key,
      () => {
        this.onFirstLoad();
      },
    );

    if (Collections.get('calendars').did_load_first_time[this.calendar_collection_key]) {
      this.onFirstLoad();
    }

    Collections.get('events').addListener(this);
    Languages.addListener(this);
    CalendarService.addListener(this);
  }
  onFirstLoad() {
    const { workspaceId, channelId } = RouterService.getStateFromRoute();
    var calendar_list = Collections.get('calendars')
      .findBy({ workspace_id: workspaceId })
      .map(cal => {
        return {
          calendar_id: cal.id,
          workspace_id: cal.workspace_id,
        };
      });
    if (this.props.tab != null && this.props.tab.configuration.calendars) {
      this.allowed_ids = this.props.tab.configuration.calendars.map(c => c.calendar_id);
      calendar_list = calendar_list.filter(c => this.allowed_ids.indexOf(c.calendar_id) >= 0);
    }
    Collections.get('events').addSource(
      {
        http_base_url: 'calendar/event',
        http_options: {
          channel_id: channelId,
          after_ts:
            this.loaded_date_range['both'].min || new Date().getTime() / 1000 - 24 * 60 * 60 * 60,
          before_ts:
            this.loaded_date_range['both'].max || new Date().getTime() / 1000 + 24 * 60 * 60 * 60,
          calendar_list: calendar_list,
          mode: 'both',
        },
        websockets: [
          {
            uri: 'calendar_events/' + workspaceId,
            options: { type: 'event' },
          },
          {
            uri: 'calendar_events/user/' + UserService.getCurrentUserId(),
            options: { type: 'event' },
          },
        ],
      },
      this.calendar_collection_key,
    );
  }
  setLoadedRange(key, min, max) {
    if (!this.loaded_date_range[key]) {
      this.loaded_date_range[key] = {};
    }
    this.loaded_date_range[key].min = min;
    this.loaded_date_range[key].max = max;
    this.loaded_date_range[key].last_updated = new Date();
  }

  componentDidMount() {
    const view = LocalStorage.getItem('calendar_view');

    if (view && this.calendar) {
      this.setState({ view });
      this.calendar.view(view);
    }
  }

  componentWillUnmount() {
    Collections.get('events').removeListener(this);
    Collections.get('events').removeSource(this.calendar_collection_key);

    Collections.get('calendars').removeListener(this);
    Collections.get('calendars').removeSource(this.calendar_collection_key);

    if (CalendarService.preview) {
      CalendarService.closePopups();
    }

    Languages.removeListener(this);
    CalendarService.removeListener(this);
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.tab != null && nextProps.tab.configuration.calendars) {
      this.allowed_ids = nextProps.tab.configuration.calendars.map(c => c.calendar_id);
    }

    // eslint-disable-next-line no-unused-vars
    var filter = nextState.filter;
    if (!this.loaded_date_range['both']) {
      this.loaded_date_range['both'] = {};
    }
    var range = this.loaded_date_range['both'];
    var requested_min =
      moment(CalendarService.date).startOf('month').toDate().getTime() / 1000 - 60 * 60 * 24 * 31;
    var requested_max =
      moment(CalendarService.date).startOf('month').toDate().getTime() / 1000 +
      2 * 60 * 60 * 24 * 31;
    if (
      !range.min ||
      range.min > requested_min ||
      range.max < requested_max ||
      new Date().getTime() - range.last_updated.getTime() > 60000
    ) {
      this.setLoadedRange('both', requested_min, requested_max);

      var calendar_list = Collections.get('calendars')
        .findBy({ workspace_id: RouterService.getStateFromRoute().workspaceId })
        .map(cal => {
          return {
            calendar_id: cal.id,
            workspace_id: cal.workspace_id,
          };
        });

      if (this.props.tab != null) {
        calendar_list = calendar_list.filter(c => this.allowed_ids.indexOf(c.calendar_id) >= 0);
      }

      Collections.get('events').sourceLoad(
        this.calendar_collection_key,
        {
          after_ts: requested_min,
          before_ts: requested_max,
          calendar_list: calendar_list,
          mode: 'both',
        },
        () => {},
      );
    }
  }
  componentDidUpdate() {
    if (this.date !== CalendarService.date && this.calendar) {
      this.calendar.setDate(CalendarService.date, true);
      this.date = CalendarService.date;
    }
  }
  configureCalendarConnector(app, cal) {
    var data = {
      calendar: cal,
    };
    WorkspacesApps.notifyApp(app.id, 'configuration', 'calendar', data);
  }
  renderCalendarList() {
    const { workspaceId } = RouterService.getStateFromRoute();
    var calendars = Collections.get('calendars').findBy({
      workspace_id: workspaceId,
    });
    if (this.props.tab != null) {
      calendars = calendars.filter(c => this.allowed_ids.indexOf(c.id) >= 0);
    }

    if (calendars && calendars.length > 0) {
      var list = [];
      calendars.forEach(cal => {
        var el = (
          <div className="">
            <div className="calendar_color " style={{ backgroundColor: cal.color }} /> {cal.title}
          </div>
        );
        if (WorkspaceUserRights.hasWorkspacePrivilege()) {
          list.push({
            type: 'menu',
            text: el,
            submenu: [
              {
                type: 'menu',
                text: Languages.t(
                  'scenes.apps.calendar.modify_calendar_menu',
                  [],
                  'Modifier le calendrier',
                ),
                submenu_replace: true,
                submenu: [
                  {
                    type: 'title',
                    text: Languages.t(
                      'scenes.apps.calendar.edit_calendar_title',
                      [],
                      'Éditer le calendrier',
                    ),
                  },
                  {
                    type: 'react-element',
                    reactElement: level => (
                      <CalendarEditor
                        calendar={Collections.get('calendars').edit(cal)}
                        level={level}
                        collectionKey={this.calendar_collection_key}
                      />
                    ),
                  },
                ],
              },
              {
                type: 'menu',
                className: 'error',
                text: Languages.t('general.delete', [], 'Supprimer'),
                onClick: () => {
                  AlertManager.confirm(
                    () => {
                      Collections.get('calendars').remove(cal, this.calendar_collection_key);
                    },
                    () => {},
                    {
                      text: Languages.t(
                        'scenes.apps.calendar.remove_calendar_confirmation',
                        [],
                        'Supprimer le calendrier et ses événements définitivement ?',
                      ),
                    },
                  );
                },
              },
              { type: 'separator' },
              {
                type: 'menu',
                text: Languages.t('scenes.apps.calendar.connectors_menu', [], 'Connecteurs...'),
                submenu: [
                  {
                    type: 'react-element',
                    reactElement: level => {
                      var apps = getCompanyApplications(Groups.currentGroupId).filter(app => false);
                      if (apps.length > 0) {
                        return (
                          <ConnectorsListManager
                            list={apps}
                            current={(cal.connectors || [])
                              .map(id => getApplication(id))
                              .filter(item => item)}
                            configurable={item =>
                              ((item.display || {}).configuration || {}).can_configure_in_calendar
                            }
                            onChange={ids => {
                              cal.connectors = ids;
                              Collections.get('calendars').save(cal, this.calendar_collection_key);
                            }}
                            onConfig={app => {
                              this.configureCalendarConnector(app, cal);
                            }}
                          />
                        );
                      }
                      return (
                        <div className="menu-text" style={{ margin: 0, padding: 0 }}>
                          {Languages.t(
                            'scenes.apps.calendar.no_connectors_menu_text',
                            [],
                            "Vous n'avez aucun connecteur capable de se connecter à un calendrier.",
                          )}
                        </div>
                      );
                    },
                  },
                  { type: 'separator' },
                  {
                    type: 'menu',
                    text: Languages.t(
                      'scenes.apps.calendar.connectors_search_menu',
                      [],
                      'Chercher des connecteurs...',
                    ),
                    onClick: () => {
                      popupManager.open(
                        <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
                        true,
                        'workspace_parameters',
                      );
                    },
                  },
                ],
              },
            ],
          });
        } else {
          list.push({ type: 'menu', text: el });
        }
      });
      return list;
    } else {
      return [
        {
          type: 'text',
          text: Languages.t(
            'scenes.apps.calendar.no_calendar_text',
            [],
            "Vous n'avez défini aucun calendrier pour cet espace de travail.",
          ),
        },
      ];
    }
  }
  export(download) {
    if (!this.state.export_my_calendar && !this.state.export_workspace_calendar) {
      return;
    }
    var mode = 'mine';
    var calendar_list = [];
    if (this.state.export_my_calendar && this.state.export_workspace_calendar) {
      mode = 'both';
    } else if (this.state.export_workspace_calendar) {
      mode = 'workspace';
    }

    if (mode === 'both' || mode === 'workspace') {
      calendar_list = Collections.get('calendars')
        .findBy({ workspace_id: RouterService.getStateFromRoute().workspaceId })
        .map(cal => {
          return {
            calendar_id: cal.id,
            workspace_id: cal.workspace_id,
          };
        });
      if (this.props.tab != null) {
        calendar_list = calendar_list.filter(c => this.allowed_ids.indexOf(c.calendar_id) >= 0);
      }
    }

    CalendarService.export(
      WorkspacesService.currentWorkspaceId,
      { mode: mode, calendar_list: calendar_list },
      download,
      token => {
        if (!download) {
          AlertManager.alert(() => {}, { text: <InputWithClipBoard value={token} /> });
        }
      },
    );
  }

  completeRect(rect) {
    rect.x = rect.x || rect.left;
    rect.y = rect.y || rect.top;
    return rect;
  }
  render() {
    const { workspaceId } = RouterService.getStateFromRoute();
    if (
      this.props.tab != null &&
      (!this.props.tab.configuration || this.props.tab.configuration.calendars === undefined)
    ) {
      return (
        <UnconfiguredTab
          saveTab={this.props.saveTab}
          channel={this.props.channel}
          tab={this.props.tab}
        />
      );
    }

    var calendars = Collections.get('calendars')
      .findBy({ workspace_id: workspaceId })
      .map(cal => cal.id);

    if (this.props.tab != null) {
      calendars = calendars.filter(c => this.allowed_ids.indexOf(c) >= 0);
    }

    var events = Collections.get('events')
      .findBy({})
      .filter(event => {
        if (!event.id) {
          return true;
        }
        event._user_transparent = false;

        var not_mine =
          (event.participants || []).filter(
            part => part.user_id_or_mail === UserService.getCurrentUserId(),
          ).length === 0;
        if (this.state.filter === 'mine') {
          if (not_mine) {
            event._user_transparent = true;
          }
          return true;
        }
        if (this.state.filter === 'workspace' || this.state.filter === 'custom') {
          //Not in this workspace
          if (
            event.workspaces_calendars.filter(part => calendars.indexOf(part.calendar_id) >= 0)
              .length === 0
          ) {
            if (!not_mine) {
              //Set transparent event
              event._user_transparent = true;
              return true;
            } else {
              return false;
            }
          }
        }
        return true;
      });

    if (
      CalendarService.edited &&
      CalendarService.edited.from &&
      CalendarService.edited.from !== this.lastEditedFrom
    ) {
      this.lastEditedFrom = CalendarService.edited.from;
      this.calendar.setDate(new Date(CalendarService.edited.from * 1000), true);

      if (!CalendarService.edited.id) {
        setTimeout(() => {
          var htmlEl = this.calendar.getDomElement(CalendarService.edited);
          if (htmlEl) {
            ModalManager.updateHighlight(this.completeRect(window.getBoundingClientRect(htmlEl)));
          }
        }, 200);
      }
    }

    var calendar_menu = [
      {
        type: 'menu',
        text: Languages.t('scenes.apps.calendar.my_calendar_menu', [], 'Mon calendrier'),
        onClick: () => {
          this.setState({ filter: 'mine' });
          CalendarService.filter_mode = 'mine';
          Menu.closeAll();
        },
      },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.calendar.workspace_menu', [], 'Espace de travail'),
        onClick: () => {
          this.setState({ filter: 'workspace' });
          CalendarService.filter_mode = 'workspace';
          Menu.closeAll();
        },
      },
      /*{type:"menu", text:"Personnaliser...", onClick: ()=>{

      }},*/
      { type: 'separator' },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.calendar.export_view_menu', [], 'Exporter la vue'),
        submenu: [
          { type: 'title', text: Languages.t('scenes.apps.calendar.export_title', [], 'Exporter') },
          {
            type: 'react-element',
            reactElement: () => {
              return (
                <ExportView
                  values={this.state}
                  onChange={(my, ws) => {
                    this.setState({
                      export_my_calendar: my,
                      export_workspace_calendar: ws,
                    });
                  }}
                />
              );
            },
          },
          {
            type: 'menu',
            text: Languages.t(
              'scenes.apps.calendar.ics_subscription_menu',
              [],
              "Obtenir un lien d'abonnement ICS",
            ),
            onClick: () => {
              this.export(false);
            },
          },
          {
            type: 'menu',
            text: Languages.t(
              'scenes.apps.calendar.ics_download_menu',
              [],
              'Télécharger un fichier ICS',
            ),
            onClick: () => {
              this.export(true);
            },
          },
        ],
      },
      { type: 'separator' },
    ];

    calendar_menu = calendar_menu.concat(this.renderCalendarList());

    if (this.props.tab === null && WorkspaceUserRights.hasWorkspacePrivilege()) {
      calendar_menu = calendar_menu.concat([
        {
          type: 'menu',
          text: Languages.t(
            'scenes.apps.calendar.add_calendar_menu',
            [],
            'Ajouter un calendrier...',
          ),
          submenu_replace: true,
          submenu: [
            {
              type: 'title',
              text: Languages.t(
                'scenes.apps.calendar.create_calendar_title',
                [],
                'Créer un calendrier',
              ),
            },
            {
              type: 'react-element',
              reactElement: level => {
                return (
                  <CalendarEditor level={level} collectionKey={this.calendar_collection_key} />
                );
              },
            },
          ],
        },
      ]);
    }

    var list = [];

    list.push(
      <div className="calendar_app">
        <div className="calendar_header">
          <div className="left">
            <Menu
              className="select medium"
              style={{ width: 'auto' }}
              position="bottom"
              menu={calendar_menu}
            >
              {
                {
                  mine: Languages.t('scenes.apps.calendar.my_calendar', [], 'Mon calendrier'),
                  workspace: Languages.t('scenes.apps.calendar.workspace', [], 'Espace de travail'),
                }[this.state.filter]
              }
            </Menu>
          </div>

          <div className="right">
            {this.state.view !== 'dayGridMonth' && (
              <div className="week_number">
                {Languages.t('scenes.apps.calendar.calendar.week_btn', [], 'Semaine')}{' '}
                {moment(CalendarService.date).week()}
              </div>
            )}

            <Menu
              className={'current_date ' + moment(CalendarService.date).format('DD-MM-YYYY')}
              position="bottom"
              menu={[
                {
                  type: 'menu',
                  text: Languages.t('scenes.apps.calendar.today_menu', [], "Aujourd'hui"),
                  onClick: () => this.calendar.today(),
                },
                { type: 'separator' },
                {
                  type: 'react-element',
                  reactElement: () => (
                    <div style={{ padding: '4px 8px' }}>
                      <DayPicker
                        value={moment(CalendarService.date)}
                        onChange={value => {
                          this.calendar.setDate(value);
                          Menu.closeAll();
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            >
              {CalendarService.date &&
                (this.state.view === 'dayGridMonth' ||
                  this.state.view === 'timeGridWeek' ||
                  this.state.view === 'listYear') &&
                moment(CalendarService.date).format('MMMM YYYY')}
              {CalendarService.date &&
                this.state.view === 'timeGridDay' &&
                moment(CalendarService.date).format('LL')}
            </Menu>

            <div className="move">
              <Icon
                className="m-icon-small left"
                type="arrow-left"
                onClick={() => this.calendar.previous()}
              />
              <Icon
                className="m-icon-small right"
                type="arrow-right"
                onClick={() => this.calendar.next()}
              />
            </div>

            <div className="view_selector">
              <Select
                medium
                style={{ width: 'auto' }}
                value={this.state.view}
                onChange={value => {
                  this.calendar.view(value);
                  LocalStorage.setItem('calendar_view', value);
                  Menu.closeAll();
                }}
                options={[
                  {
                    value: 'dayGridMonth',
                    text: Languages.t('scenes.apps.calendar.month_option', [], 'Mois'),
                  },
                  {
                    value: 'timeGridWeek',
                    text: Languages.t('scenes.apps.calendar.week_option', [], 'Semaine'),
                  },
                  {
                    value: 'timeGridDay',
                    text: Languages.t('scenes.apps.calendar.day_option', [], 'Jour'),
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <FullCalendar
          i18n={Languages.language}
          ref={node => (this.calendar = node)}
          onViewChange={view => this.setState({ view: view })}
          onDateChange={date => {
            CalendarService.date = date;
            CalendarService.notify();
          }}
          date={CalendarService.date}
          onCreate={_event => {
            CalendarService.edit(_event);
            CalendarService.fullSizeModal = false;

            setTimeout(() => {
              var htmlEl = this.calendar.getDomElement(CalendarService.edited);
              ModalManager.open(
                <EventCreation
                  event={CalendarService.edited}
                  collectionKey={this.calendar_collection_key}
                />,
                {
                  highlight: htmlEl
                    ? this.completeRect(window.getBoundingClientRect(htmlEl))
                    : null,
                  position: 'left',
                  margin: 5,
                  no_background: true,
                  size: { width: 440 },
                },
              );
            }, 100);
          }}
          onUpdate={(event, htmlEl) => {
            //Collections.get("events").updateObject(event);
            if (event.id) {
              CalendarService.save(event, this.calendar_collection_key);
            }
            if (
              !CalendarService.fullSizeModal &&
              CalendarService.preview &&
              CalendarService.preview.front_id === event.front_id
            ) {
              var updated = CalendarService.preview;
              setTimeout(() => {
                var e = this.calendar.getDomElement(updated);
                e &&
                  ModalManager.updateHighlight(this.completeRect(window.getBoundingClientRect(e)));
              }, 100);
            }
          }}
          onClickOut={() => {
            CalendarService.closePopups();
          }}
          onClickEvent={(event, jsEvent) => {
            jsEvent.stopPropagation();
            jsEvent.preventDefault();
            if (
              !ModalManager.isOpen() ||
              !CalendarService.preview ||
              CalendarService.preview.front_id !== event.front_id
            ) {
              CalendarService.fullSizeModal = false;
              CalendarService.startPreview(event);
              setTimeout(() => {
                var htmlEl = this.calendar.getDomElement(CalendarService.preview);
                ModalManager.open(
                  <EventDetails event={event} collectionKey={this.calendar_collection_key} />,
                  {
                    highlight: htmlEl
                      ? this.completeRect(window.getBoundingClientRect(htmlEl))
                      : null,
                    position: 'left',
                    margin: 5,
                    no_background: true,
                    size: { width: 440 },
                  },
                );
              }, 100);
            }
          }}
          events={events}
          getCalendar={id => Collections.get('calendars').find(id)}
        />

        <MainPlus
          onClick={() => {
            CalendarService.fullSizeModal = true;
            CalendarService.edit({
              from: new Date().getTime() / 1000,
              to: new Date().getTime() / 1000 + 60 * 60,
            });
            setTimeout(() => {
              ModalManager.open(
                <EventModification
                  event={CalendarService.edited}
                  collectionKey={this.calendar_collection_key}
                />,
                { size: { width: 600 } },
              );
            }, 100);
          }}
        />
      </div>,
    );

    return list;
  }
}
