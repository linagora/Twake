import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import Workspace from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import ChannelsService from 'services/channels/channels.js';
import UserService from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import Api from 'services/api.js';
import Strings from 'services/utils/strings.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import CalendarService from 'services/Apps/Calendar/Calendar.js';
import TasksService from 'services/Apps/Tasks/Tasks.js';
import MessagesService from 'services/Apps/Messages/Messages.js';

import Globals from 'services/Globals.js';

class search extends Observable {
  constructor() {
    super();
    this.setObservableName('SearchService');
    Globals.window.searchPopupService = this;
    this.row = [];
    this.value = '';
    this.type = '';
    this.options = {};
    this.scroll_id = false;
    this.results = [];
  }

  open() {
    this.isopen = true;
    this.notify();
  }

  close() {
    this.isopen = false;
    this.notify();
  }

  setValue(text) {
    this.value = text;
    this.notify();
  }

  setType(type) {
    this.type = type;
    this.notify();
  }

  setOptions(options) {
    this.options = options;
  }

  selectMessage(item, i) {
    if (i > 20) {
      return;
    }

    ChannelsService.select(item.channel);

    if (ChannelsService.currentChannelFrontId == item.channel.front_id) {
      console.log(item);

      if (!item.message.parent_message_id) {
        console.log(
          'search Ea',
          item.channel.id || '',
          item.message.parent_message_id || '',
          item.message.id || '',
        );
        MessagesService.scrollToMessage(
          item.channel.id,
          item.message.parent_message_id,
          item.message.id,
        );
      } else {
        MessagesService.scrollToMessage(
          item.channel.id || '',
          '',
          item.message.parent_message_id || '',
        );
        /*MessagesService.scrollToMessage(
          item.channel.id || '',
          item.message.parent_message_id || '',
          item.message.id || '',
        );
        setTimeout(() => {
          MessagesService.showMessage(item.message.parent_message_id);
        }, 500);
        */
      }
    } else {
      setTimeout(() => {
        this.selectMessage(item, i + 1);
      }, 200);
    }
  }

  select(item, i) {
    if (i > 10) {
      return;
    }
    if (this.selectTimeout) clearTimeout(this.selectTimeout);

    if (item.type == 'channel') {
      if (item.workspace) {
        Workspace.select(item.workspace);
      }
      ChannelsService.select(item.channel);
    }
    if (item.type == 'file') {
      if (item.workspace) {
        Workspace.select(item.workspace);
        if (
          !WorkspacesApps.did_first_load[item.workspace.id] ||
          !Collections.get('channels').did_load_first_time['channels_' + item.workspace.id]
        ) {
          this.selectTimeout = setTimeout(() => {
            this.select(item, (i || 0) + 1);
          }, 500);
          return;
        }
        setTimeout(() => {
          var app_id = Collections.get('applications').findBy({
            name: Languages.t('app.name.twake_drive', [], 'Documents'),
          })[0];
          if (app_id) {
            app_id = app_id.id;
            var channel = ChannelsService.getChannelForApp(app_id, item.workspace.id);
            if (channel) {
              if (item.file.is_directory) {
                DriveService.changeCurrentDirectory(
                  channel.id + '_undefined_' + item.file.workspace_id,
                  { id: item.file.id },
                );
              } else {
                DriveService.changeCurrentDirectory(
                  channel.id + '_undefined_' + item.file.workspace_id,
                  { id: item.file.parent_id },
                );
              }
              ChannelsService.select(channel);
            }
          }
        }, 100);
      }
    }
    if (item.type == 'event') {
      if (item.workspace) {
        Workspace.select(item.workspace);
        if (
          !WorkspacesApps.did_first_load[item.workspace.id] ||
          !Collections.get('channels').did_load_first_time['channels_' + item.workspace.id]
        ) {
          this.selectTimeout = setTimeout(() => {
            this.select(item, (i || 0) + 1);
          }, 500);
          return;
        }
        setTimeout(() => {
          var app_id = Collections.get('applications').findBy({
            simple_name: 'twake_calendar',
          })[0];
          if (app_id) {
            app_id = app_id.id;
            var channel = ChannelsService.getChannelForApp(app_id, item.workspace.id);
            if (channel) {
              ChannelsService.select(channel);
              CalendarService.setDate(new Date(item.event.from * 1000));
            }
          }
        }, 100);
      }
    }
    if (item.type == 'task') {
      if (item.workspace) {
        Workspace.select(item.workspace);
        if (
          !WorkspacesApps.did_first_load[item.workspace.id] ||
          !Collections.get('channels').did_load_first_time['channels_' + item.workspace.id]
        ) {
          this.selectTimeout = setTimeout(() => {
            this.select(item, (i || 0) + 1);
          }, 500);
          return;
        }
        setTimeout(() => {
          var app_id = Collections.get('applications').findBy({
            simple_name: 'twake_tasks',
          })[0];
          if (app_id) {
            app_id = app_id.id;
            var channel = ChannelsService.getChannelForApp(app_id, item.workspace.id);
            if (channel) {
              ChannelsService.select(channel);
              if ((item.board || {}).id) {
                TasksService.openBoard(item.board.id);
              }
            }
          }
        }, 100);
      }
    }
    if (item.type == 'message') {
      if (!item.workspace && (item.channel || {}).original_workspace) {
        item.workspace = Collections.get('workspaces').find(
          (item.channel || {}).original_workspace,
        );
      }
      if (item.workspace && item.channel) {
        Workspace.select(item.workspace);
        if (
          !WorkspacesApps.did_first_load[item.workspace.id] ||
          !Collections.get('channels').did_load_first_time['channels_' + item.workspace.id]
        ) {
          this.selectTimeout = setTimeout(() => {
            this.select(item, (i || 0) + 1);
          }, 500);
          return;
        }
        setTimeout(() => {
          this.selectMessage(item);
        }, 100);
      } else if (item.channel) {
        this.selectMessage(item);
      }
    }
    this.close();
  }

  loadMore() {
    this.search(true, { more: true });
  }

  search(http, options) {
    if (!options) {
      options = {};
    }

    if (http === undefined) {
      http = true;
    }

    this.scroll_id = false;

    if (this.search_loading) {
      if (this.searchRetryTimeout) clearTimeout(this.searchRetryTimeout);
      this.searchRetryTimeout = setTimeout(() => {
        this.search();
      }, 500);
    }

    var text = this.value.replace(/  +/, ' ');
    var words = text.split(' ');
    if (http && (text || '').trim() == '' && JSON.stringify(this.options).length < 3) {
      return this.search(false);
    }
    if (
      this.previousSearchText == (text || '').trim() &&
      JSON.stringify(this.options) + this.type == this.previousSearchTextOptions
    ) {
      this.search_loading = false;
      this.search_http_loading = false;
      this.notify();
      return;
    }
    this.previousSearchTextOptions = JSON.stringify(this.options) + this.type;
    this.previousSearchText = (text || '').trim();

    this.search_loading = true;
    this.search_http_loading = true;
    this.notify();

    if (
      http &&
      ((text.length > 1 && words.length > 0) || JSON.stringify(this.options).length > 2)
    ) {
      var searchRoute = 'quicksearch';

      var options = {};
      if (this.type == 'file') {
        options = this.options;
        searchRoute = 'advancedfile';
      } else if (this.type == 'message') {
        options = this.options;
        searchRoute = 'advancedbloc';
      } else if (this.type == 'event') {
        options = this.options;
        searchRoute = 'advancedevent';
      } else if (this.type == 'task') {
        options = this.options;
        searchRoute = 'advancedtask';
      }

      var workspaces_ids = undefined;
      if (options) {
        workspaces_ids = options.workspaces;
      }

      if (this.searchHTTPTimeout) clearTimeout(this.searchHTTPTimeout);
      this.searchHTTPTimeout = setTimeout(() => {
        //Load from HTTP
        Api.post(
          'globalsearch/' + searchRoute,
          {
            scroll_id: options.more ? this.scroll_id : undefined,
            group_id: Workspace.currentGroupId,
            words: words,
            workspace_id: (workspaces_ids || []).length ? workspaces_ids : undefined,
            options: options || {},
          },
          res => {
            this.search(false);

            var results = ((res || {}).data || {}).results || (res || {}).data || [];
            if (results.scroll_id !== undefined) {
              results = [];
            }
            this.scroll_id = ((res || {}).data || {}).scroll_id;

            results.forEach(item => {
              if (item.type == 'channel') {
                this.completeItemSearchText(item.channel, words);
                Collections.get('channels').completeObject(item.channel);
              }
              if (item.type == 'file') {
                this.completeItemSearchText(item.file, words);
                Collections.get('drive').completeObject(item.file);
              }
            });

            if (!options.more) {
              this.results = [];
            }

            this.results = this.results.concat(results);

            this.search_http_loading = false;
            this.notify();
          },
        );
      }, 500);
    }

    //Search in collections

    //Channels
    var res = [];
    Collections.get('channels')
      .findBy({})
      .forEach(item => {
        if (
          Object.values(item.members || [])
            .concat(Object.values(item.ext_members || []))
            .indexOf(UserService.getCurrentUserId()) >= 0
        ) {
          if (this.matchQuery(item, words, ['name'])) {
            res.push({
              type: 'channel',
              channel: item,
              workspace: Collections.get('workspaces').find(item.original_workspace),
            });
          }
        }
      });
    Collections.get('drive')
      .findBy({})
      .forEach(item => {
        if (this.matchQuery(item, words, ['name'])) {
          res.push({
            type: 'file',
            file: item,
            workspace: Collections.get('workspaces').find(item.workspace_id),
          });
        }
      });
    this.results = res;
    this.notify();

    this.search_loading = false;
  }

  isOpen() {
    return this.isopen;
  }

  completeItemSearchText(object, words) {
    object._search_text = object._search_text || '';
    words.forEach(new_word => {
      var replaced = false;
      object._search_text.split(' ').forEach(present_word => {
        if (present_word.trim() && new_word.trim().indexOf(present_word.trim()) >= 0) {
          object._search_text = object._search_text.replace(
            ' ' + present_word + ' ',
            ' ' + new_word + ' ',
          );
          replaced = true;
        }
      });
      if (!replaced) {
        object._search_text += ' ' + new_word;
      }
    });
    object._search_text += ' ';
    object._search_text = object._search_text.replace(/  +/, ' ');
  }

  matchQuery(object, words, keys) {
    return (words || []).some(word => {
      return (keys || []).concat(['_search_text']).some(key => {
        if (
          word &&
          Strings.removeAccents((object[key] || '').toLocaleLowerCase()).indexOf(
            Strings.removeAccents(word.trim().toLocaleLowerCase()),
          ) >= 0
        ) {
          return true;
        }
      });
    });
  }
}

search = new search();
export default search;
