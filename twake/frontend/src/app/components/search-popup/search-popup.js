import React from 'react';
import Search from 'features/global/services/search-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import './search-popup.scss';
import InputIcon from 'components/inputs/input-icon.js';
import MessagesResult from './parts/messages-result';
import ChannelsResult from './parts/channels-result';
import UsersResult from './parts/users-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Languages from 'app/features/global/services/languages-service';

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
    // Search.setType(this.state.filterType);
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

  onCloseButtonClick() {
    Search.close();
  }

  onSearchFieldClearClick() {
    Search.clear();
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
      <div className="search-popup">
        <div className="overlay" onClick={this.onCloseButtonClick}></div>

        <div className="component-container">
          <div className="search screen">
            <div className="header-wrapper">
              <div className="header-title-wrapper">
                <div className="header-title">Search</div>
              </div>
              <div className="header-close-btn" onClick={this.onCloseButtonClick}>
                <img
                  className="dismiss-btn"
                  src="data:image/svg+xml;base64, PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggb3BhY2l0eT0iMC4xMiIgZD0iTTEyIDI0QzE4LjYyNzQgMjQgMjQgMTguNjI3NCAyNCAxMkMyNCA1LjM3MjU4IDE4LjYyNzQgMCAxMiAwQzUuMzcyNTggMCAwIDUuMzcyNTggMCAxMkMwIDE4LjYyNzQgNS4zNzI1OCAyNCAxMiAyNFoiIGZpbGw9IiM4MThDOTkiLz4KPHBhdGggZD0iTTE2LjczNjQgNy4yNjM2QzE3LjA4NzkgNy42MTUwOCAxNy4wODc5IDguMTg0OTIgMTYuNzM2NCA4LjUzNjRMMTMuMjczIDEyTDE2LjczNjQgMTUuNDYzNkMxNy4wNTg2IDE1Ljc4NTggMTcuMDg1NCAxNi4yOTE1IDE2LjgxNyAxNi42NDQyTDE2LjczNjQgMTYuNzM2NEMxNi4zODQ5IDE3LjA4NzkgMTUuODE1MSAxNy4wODc5IDE1LjQ2MzYgMTYuNzM2NEwxMiAxMy4yNzNMOC41MzY0IDE2LjczNjRDOC4xODQ5MiAxNy4wODc5IDcuNjE1MDggMTcuMDg3OSA3LjI2MzYgMTYuNzM2NEM2LjkxMjEzIDE2LjM4NDkgNi45MTIxMyAxNS44MTUxIDcuMjYzNiAxNS40NjM2TDEwLjcyNyAxMkw3LjI2MzYgOC41MzY0QzYuOTQxNDIgOC4yMTQyMSA2LjkxNDU3IDcuNzA4NTMgNy4xODMwNiA3LjM1NTc3TDcuMjYzNiA3LjI2MzZDNy42MTUwOCA2LjkxMjEzIDguMTg0OTIgNi45MTIxMyA4LjUzNjQgNy4yNjM2TDEyIDEwLjcyN0wxNS40NjM2IDcuMjYzNkMxNS44MTUxIDYuOTEyMTMgMTYuMzg0OSA2LjkxMjEzIDE2LjczNjQgNy4yNjM2WiIgZmlsbD0iIzgxOEM5OSIvPgo8L3N2Zz4K"
                />
              </div>
            </div>

            <div className="input-wrapper">
              <InputIcon
                autoFocus
                icon="search"
                className="full_width search-input"
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
                // refInput={node => (this.input = node)}
                onChange={this.handleChange}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    Search.search();
                  }
                }}
              />

              {Search.value && (
                <div className="input-clear-btn" onClick={this.onSearchFieldClearClick}>
                  <img src="data:image/svg+xml;base64, PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEMxMi40MTgzIDAgMTYgMy41ODE3MiAxNiA4QzE2IDEyLjQxODMgMTIuNDE4MyAxNiA4IDE2QzMuNTgxNzIgMTYgMCAxMi40MTgzIDAgOEMwIDMuNTgxNzIgMy41ODE3MiAwIDggMFpNMTAuNDY1NyA0LjI2MDIyTDggNi43MjdMNS41MzU3IDQuMjYwMjJDNS4xODQyMyAzLjkwODc1IDQuNjE0MzggMy45MDg3NSA0LjI2MjkxIDQuMjYwMjJDMy45MTE0NCA0LjYxMTcgMy45MTE0NCA1LjE4MTU0IDQuMjYyOTEgNS41MzMwMkw2LjcyOCA4LjAwMUw0LjI2MjkxIDEwLjQ3QzMuOTExNDQgMTAuODIxNSAzLjkxMTQ0IDExLjM5MTMgNC4yNjI5MSAxMS43NDI4QzQuNjE0MzggMTIuMDk0MyA1LjE4NDIzIDEyLjA5NDMgNS41MzU3IDExLjc0MjhMOCA5LjI3NUwxMC40NjU3IDExLjc0MjhDMTAuODE3MiAxMi4wOTQzIDExLjM4NyAxMi4wOTQzIDExLjczODUgMTEuNzQyOEMxMi4wOSAxMS4zOTEzIDEyLjA5IDEwLjgyMTUgMTEuNzM4NSAxMC40N0w5LjI3MiA4LjAwMUwxMS43Mzg1IDUuNTMzMDJDMTIuMDkgNS4xODE1NCAxMi4wOSA0LjYxMTcgMTEuNzM4NSA0LjI2MDIyQzExLjM4NyAzLjkwODc1IDEwLjgxNzIgMy45MDg3NSAxMC40NjU3IDQuMjYwMjJaIiBmaWxsPSIjOTlBMkFEIi8+Cjwvc3ZnPgo=" />
                </div>
              )}
            </div>

            <div className="tabs-wrapper">
              <div className="tab-items-wrapper">
                <div className="tab-item-wrapper">
                  <div className="tab-item-active">
                    <div className="tab-item-title">Discussions</div>
                    <div className="tab-item-indicator"></div>
                  </div>
                </div>
              </div>
              <div className="tab-horizontal-separator"></div>
            </div>

            <PerfectScrollbar
              options={{ suppressScrollX: true }}
              component="div"
              className="search-results"
              containerRef={node => {
                this.scroller = node;
              }}
            >
              {(Boolean(Search.results.channels.length) ||
                Boolean(Search.results.users.length)) && (
                <div>
                  <div className="results-group-title ">Channels and contacts</div>

                  {Boolean(Search.results.channels.length) && (
                    <div className="result-items">
                      {Search.results.channels.map(channel => (
                        <ChannelsResult
                          channel={channel}
                          highlight={Search.value}
                          onClick={() => Search.close()}
                        />
                      ))}
                    </div>
                  )}

                  {Boolean(Search.results.users.length) && (
                    <div className="result-items">
                      {Search.results.users.map(user => (
                        <UsersResult
                          user={user}
                          highlight={Search.value}
                          onClick={() => Search.close()}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {Boolean(Search.results.messages.length) && (
                <div>
                  <div className="results-group-title ">Discussions</div>
                  <div className="result-items">
                    {Search.results.messages.map(message => (
                      <MessagesResult
                        message={message}
                        highlight={Search.value}
                        onClick={() => Search.close()}
                      />
                    ))}
                  </div>
                </div>
              )}
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    );
  }
}
