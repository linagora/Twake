import React from 'react';
import Search from 'features/global/services/search-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import './search-popup.scss';
import InputIcon from 'components/inputs/input-icon.js';

import Languages from 'app/features/global/services/languages-service';
import TabAll from './tabs/all';
import TabFiles from './tabs/files';
import TabMedia from './tabs/media';
import TabChats from './tabs/chats';
import Tab from './tabs/tab';
import PerfectScrollbar from 'react-perfect-scrollbar';

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
      activeTab: 'all',
    };

    const tabs = [
      { key: 'all', title: 'All' },
      { key: 'media', title: 'Media' },
      { key: 'files', title: 'Files' },
    ];

    const experimentalTabs = ['Chats'];

    for (let tabName of experimentalTabs) {
      const tabNameLC = tabName.toLowerCase();
      if (localStorage.getItem(`search-tabs-${tabNameLC}`)) {
        tabs.push({ key: tabNameLC, title: tabName });
      }
    }

    this.tabs = tabs;
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
    Search.search(true);
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

  onTabClick(key) {
    Search.setCurrentTab(key);
    this.setState({ activeTab: key });
  }

  getTabContent() {
    switch (this.state.activeTab) {
      case 'all':
        return <TabAll scroller={this.scroller} />;
      case 'chats':
        return <TabChats scroller={this.scroller} />;
      case 'media':
        return <TabMedia scroller={this.scroller} />;
      case 'files':
        return <TabFiles scroller={this.scroller} />;
      default:
        return <div>?</div>;
    }
  }

  render() {
    if (!Search.isOpen()) {
      this.state.selected = 0;
      this.state.total = 0;
      Collections.get('users').removeListener(this);
      return '';
    }

    this.state.total = 0;

    return (
      <div className="search-popup">
        <div className="overlay" onClick={this.onCloseButtonClick}></div>

        <div className="component-container">
          <div className="search screen">
            <div className="header-wrapper">
              <div className="header-title">Search</div>
              <div className="header-close-btn" onClick={this.onCloseButtonClick}>
                <img src="/public/icons/dismiss.svg" />
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
                    Search.search(true);
                  }
                }}
              />

              {Search.value && (
                <div className="input-clear-btn" onClick={this.onSearchFieldClearClick}>
                  <img src="/public/icons/input-clear.svg" />
                </div>
              )}
            </div>

            <div className="tabs-wrapper">
              <div className="tab-items-wrapper">
                {this.tabs.map((tab, idx) => (
                  <Tab
                    key={tab.title}
                    active={this.state.activeTab === tab.key}
                    title={tab.title}
                    onClick={() => {
                      this.onTabClick(tab.key);
                    }}
                  />
                ))}
              </div>

              <div className="tab-horizontal-separator"></div>
            </div>

            <PerfectScrollbar
              options={{ suppressScrollX: true }}
              component="div"
              className="results-wrapper"
              containerRef={node => {
                this.scroller = node;
              }}
            >
              {this.getTabContent()}
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    );
  }
}
