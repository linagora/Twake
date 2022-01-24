import React from 'react';
import Search from 'services/search/search.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import UserService from 'services/user/UserService';
import './search-popup.scss';
import InputIcon from 'components/inputs/input-icon.js';
import QuickResult from './parts/quick-result.js';
import MessagesFilter from './parts/messages-filter.js';
import Tabs from 'components/tabs/tabs.js';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import moment from 'moment';
import Languages from 'services/languages/languages';
import userAsyncGet from 'services/user/AsyncGet';

export default class SearchPopup extends React.Component {
  constructor(props) {
    super(props);
    Search.addListener(this);
    this.handleChange = this.handleChange.bind(this);
    this.eventKey = this.eventKey.bind(this);
    this.state = {
      selected: 0,
      total: 0,
      withFilters: Search.withFilters || false,
      hasFilters: Search.hasFilters || false,
      filterType: Search.type || false,
    };
  }
  componentDidMount() {
    document.addEventListener('keydown', this.eventKey);
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.eventKey);
    Search.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  eventKey(evt) {
    if (Search.isOpen()) {
      if (evt.keyCode === 27) {
        //ESC
        Search.close();
      }
      if (evt.keyCode === 38) {
        //UP
        this.moved_selector = true;
        this.setState({
          selected: (this.state.selected - 1 + this.state.total) % Math.max(1, this.state.total),
        });
      }
      if (evt.keyCode === 40) {
        //DOWN
        this.moved_selector = true;
        this.setState({
          selected: (this.state.selected + 1 + this.state.total) % Math.max(1, this.state.total),
        });
      }
      if (evt.keyCode === 13) {
        //ENTER
        if (this.current_selection) {
          Search.select(this.current_selection);
        }
      }
    }
  }
  componentDidUpdate() {
    Search.withFilters = this.state.withFilters;
    Search.hasFilters = this.state.hasFilters;
    if (this.moved_selector && this.scroller) {
      var selected = this.scroller.getElementsByClassName('selected')[0];
      if (selected) {
        this.scroller.scrollTop =
          selected.offsetTop - selected.offsetHeight / 2 - this.scroller.offsetHeight / 2;
      }
    }
    this.moved_selector = false;
  }
  handleChange(event) {
    if (event) {
      Search.setValue(event.target.value);
    }
    Search.setType(this.state.filterType);
    Search.search();
  }

  renderTableData() {
    return Search.row.map(data => {
      return (
        <tr key={data.id}>
          <td>{data.id}</td>
        </tr>
      );
    });
  }

  listenUsers() {
    if (!this.listen_user_collection) {
      Collections.get('users').addListener(this);
      this.listen_user_collection = true;
    }
  }

  render() {
    if (!Search.isOpen()) {
      this.state.selected = 0;
      this.state.total = 0;
      Collections.get('users').removeListener(this);
      return '';
    }

    var pos_i = 0;
    this.state.total = 0;

    var tabs = [
      {
        filterType: 'message',
        hasFilters: true,
        title: Languages.t('components.application.messages', [], 'Messages'),
        render: '',
      },
      {
        filterType: 'file',
        hasFilters: true,
        title: Languages.t('scenes.apps.drive.navigators.navigator_content.files', [], 'Files'),
        render: '',
      },
      {
        filterType: 'task',
        hasFilters: true,
        title: Languages.t('components.searchpopup.tasks', [], 'Tasks'),
        render: '',
      },
      {
        filterType: 'event',
        hasFilters: true,
        title: Languages.t('scenes.app.popup.appsparameters.pages.event_subtitle', [], 'Events'),
        render: '',
      },
    ];

    return (
      <div className={'searchPopup ' + (this.state.withFilters ? 'large ' : '')}>
        <div className={'background fade_in'} onClick={() => Search.close()} />
        <div className={'componentContainer fade_in'}>
          <div className="component" style={{ padding: 0 }}>
            <InputIcon
              autoFocus
              icon="search"
              className="full_width search_input"
              big
              placeholder={
                this.state.withFilters
                  ? Languages.t(
                      'scenes.app.mainview.advanced_search_placeholder',
                      [],
                      'Recherche avancée',
                    )
                  : Languages.t(
                      'scenes.app.mainview.quick_search_placeholder',
                      [],
                      'Recherche rapide',
                    )
              }
              value={Search.value}
              refInput={node => (this.input = node)}
              onChange={this.handleChange}
              onKeyPress={event => {
                if (event.key === 'Enter') {
                  Search.search();
                }
              }}
            />

            <div className="search_tabs">
              <Tabs
                tabs={tabs}
                selected={tabs.map(i => i.filterType === this.state.filterType).indexOf(true)}
                onChange={e => {
                  if (tabs[e].searchPopupStyle === 'small') {
                    this.setState({ withFilters: false });
                  }
                  this.state.hasFilters = tabs[e].hasFilters;
                  this.state.filterType = tabs[e].filterType;
                  this.setState({});
                  this.input.focus();
                  this.handleChange();
                }}
              />
              {this.state.hasFilters && (
                <div className="more_filters">
                  <a
                    onClick={() => {
                      this.setState({ withFilters: !this.state.withFilters });
                    }}
                  >
                    {this.state.withFilters
                      ? Languages.t('components.searchpopup.hide_filters', [], 'hide filters')
                      : Languages.t('components.searchpopup.show_filters', [], 'show filters')}
                  </a>
                </div>
              )}
            </div>

            <div className="search_body">
              <PerfectScrollbar
                options={{ suppressScrollX: true }}
                component="div"
                className="results"
                containerRef={node => {
                  this.scroller = node;
                }}
              >
                {Search.results.map(item => {
                  var text = '';
                  var emoji = '';
                  var icon = '';
                  var workspace = undefined;
                  var group = undefined;
                  var secret = false;
                  var ext_members = false;
                  var users = null;

                  try {
                    var workspace_suffix = '';
                    if (item.workspace && item.workspace.name) {
                      workspace = item.workspace;
                      group = { id: workspace?.group?.id || workspace.company_id || '' };
                    }

                    if (item.type === 'channel') {
                      if (item.channel.application) {
                        return '';
                      }

                      if (!item.channel.direct && !item.channel.application) {
                        emoji = item.channel.icon;
                        text = item.channel.name;
                      }

                      if (item.channel.direct && !item.channel.application) {
                        this.listenUsers();

                        users = [];
                        item.channel.members.forEach(id => {
                          if (id !== UserService.getCurrentUserId()) {
                            const user = Collections.get('users').find(id, () => userAsyncGet(id));
                            if (user) {
                              users.push(user);
                            }
                          }
                        });

                        let i_user = 0;
                        text = (
                          users.forEach(user => {
                            i_user++;
                            if (user) {
                              return (
                                (i_user > 1 ? ', ' : ' ') +
                                (item.channel.members > 2
                                  ? user.first_name || user.username
                                  : UserService.getFullName(user))
                              );
                            }
                          }) || []
                        ).join('');
                      }

                      secret = item.channel.private;
                      ext_members = (item.channel.ext_members || []).length > 0;
                    }

                    if (item.type === 'file') {
                      if (item.file.detached) {
                        return '';
                      }
                      icon = item.file.is_directory ? 'folder' : 'file';
                      text = item.file.name;
                    }

                    if (item.type === 'task') {
                      icon = 'check-square';
                      text = item.task.title;

                      if (item.board) {
                        workspace_suffix += ' • ' + item.board.title;
                      }

                      if (item.list) {
                        workspace_suffix += ' • ' + item.list.title;
                      }
                    }

                    if (item.type === 'event') {
                      icon = 'calendar-alt';
                      text = item.event.title;

                      if (item.event.from) {
                        var dateFrom = moment(item.event.from * 1000).format('L');
                        var dateTo = moment(item.event.to * 1000).format('L');
                        workspace_suffix +=
                          ' (' + dateFrom + ' ' + moment(item.event.to * 1000).format('LT');
                        workspace_suffix +=
                          ' - ' +
                          moment(item.event.to * 1000).format(
                            (dateTo !== dateFrom ? 'L' : '') + 'LT',
                          );
                        workspace_suffix += ')';
                      }
                    }

                    if (item.type === 'message') {
                      icon = 'comment';
                      text = PseudoMarkdownCompiler.compileToText(item.message.content);

                      if (item.channel) {
                        workspace_suffix += ' • ' + item.channel.name;
                      }

                      workspace_suffix +=
                        ' - ' + moment(item.message.creation_date * 1000).format('L LT');
                    }
                  } catch (e) {
                    console.log(e);
                    return '';
                  }

                  pos_i++;
                  this.state.total++;

                  if (pos_i === this.state.selected + 1) {
                    this.current_selection = item;
                  }

                  if (this.state.filterType && this.state.filterType !== item.type) {
                    return '';
                  }

                  return (
                    <QuickResult
                      emoji={emoji}
                      icon={icon}
                      text={text}
                      workspace={workspace}
                      group={group}
                      workspaceSuffix={workspace_suffix}
                      users={users}
                      private={secret}
                      public={ext_members}
                      selected={pos_i === this.state.selected + 1}
                      onClick={() => Search.select(item)}
                    />
                  );
                })}
                {!Search.value && (
                  <div className="smalltext" style={{ textAlign: 'center', padding: 32 }}>
                    {Languages.t(
                      'components.searchpopup.enter_text',
                      [],
                      'Enter some text to search Twake.',
                    )}
                  </div>
                )}
                {Search.search_http_loading && Search.value && (
                  <div className="smalltext" style={{ textAlign: 'center', padding: 16 }}>
                    {Languages.t('components.searchpopup.loading', [], 'Loading more results...')}
                  </div>
                )}
                {Search.value && this.state.total == 0 && !Search.search_http_loading && (
                  <div className="smalltext" style={{ textAlign: 'center', padding: 32 }}>
                    {Languages.t('components.user_picker.modal_no_result', [], 'No results found.')}
                  </div>
                )}
                {this.state.total > 0 && Search.scroll_id && !Search.search_http_loading && (
                  <div className="smalltext" style={{ textAlign: 'center', padding: 32 }}>
                    <a
                      onClick={() => {
                        Search.loadMore();
                      }}
                    >
                      {Languages.t('components.searchpopup.load_more', [], 'Load more results...')}
                    </a>
                  </div>
                )}
              </PerfectScrollbar>

              {this.state.withFilters && (
                <PerfectScrollbar
                  options={{ suppressScrollX: true }}
                  component="div"
                  className="filters"
                >
                  {this.state.filterType === 'message' && (
                    <MessagesFilter
                      options={Search.options}
                      onSearch={options => {
                        Search.setOptions(options);
                        Search.search();
                      }}
                    />
                  )}
                </PerfectScrollbar>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
