import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Context from 'apps/context.js';

import Globals from 'services/Globals.js';

class eventPicker extends Observable {
  constructor() {
    super();
    this.observableName = 'eventPicker';
    this.events = [];
    this.calendars = {};
  }

  init(workspaceId) {
    var that = this;
    var data = { workspaceId: workspaceId };
    this.isLoading = true;
    this.notify();

    Api.post('calendar/calendars/get', data, function(res) {
      var id_added = [];
      if (res.data && res.data.length > 0) {
        that.calendars = res.data;
        that.firstCalendar = res.data[0];
      }
      that.isLoading = false;
      that.notify();
    });
  }

  getEvents(mine, workspaceId, from, to, calendarsIds, callback) {
    this.isSearchingEvent = true;

    this.notify();

    var data = {
      mine: mine,
      workspaceId: workspaceId,
      to: to,
      from: from,
      calendarsIds: calendarsIds,
    };

    var that = this;
    Api.post('calendar/events/get', data, function(res) {
      if (res.data != undefined) that.events = res.data;
      that.isSearchingEvent = false;
      that.notify();
    });
  }
}

const EventPicker = new eventPicker();
export default EventPicker;
