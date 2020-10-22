import React from 'react';

let observables_count = 0;
export default class Observable {
  constructor() {
    this.observableName = 'observable_' + observables_count++;
    this.observableListenersList = [];
    this.observableListenersShouldNotifyList = [];
    this.observableListenersOnlyList = [];
    this.onFirstListener = null;
    this.onLastListener = null;
    this.previousStore = {};
  }
  setObservableName(name) {
    this.observableName = name;
  }
  useListener(useState, shouldNotifyOnlyFor = [], shouldNotify = undefined) {
    const [_, setState] = useState(0);
    this.addListener(setState, shouldNotifyOnlyFor, shouldNotify);
  }
  addListener(listener, shouldNotifyOnlyFor = [], shouldNotify = undefined) {
    if (this.observableListenersList.length == 0 && this.onFirstListener) {
      this.onFirstListener();
    }
    if (this.observableListenersList.indexOf(listener) < 0) {
      this.observableListenersOnlyList.push(shouldNotifyOnlyFor);
      this.observableListenersShouldNotifyList.push(shouldNotify);
      this.observableListenersList.push(listener);
    }
  }
  removeListener(listener) {
    var index = this.observableListenersList.indexOf(listener);
    if (index > -1) {
      this.observableListenersList.splice(index, 1);
      this.observableListenersShouldNotifyList.splice(index, 1);
    }
    if (this.observableListenersList.length == 0 && this.onLastListener) {
      this.onLastListener();
    }
  }
  listenOnly(listener, object_front_ids) {
    if (!listener._observable) {
      listener._observable = {};
    }
    if (!listener._observable[this.observableName]) {
      listener._observable[this.observableName] = {};
    }
    listener._observable[this.observableName].listen_only = object_front_ids;
  }
  shouldNotify(node, listen_only = false) {
    return true;
  }
  notify(force = false) {
    let count = [];
    for (var i = 0; i < this.observableListenersList.length; i++) {
      var update =
        force ||
        this.shouldNotify(
          this.observableListenersList[i],
          this.observableListenersOnlyList[i] || false,
        );
      if (this.observableListenersShouldNotifyList[i]) {
        update = update || this.observableListenersShouldNotifyList[i](update);
      }
      if (update) {
        var data = {};
        data[this.observableName] = this;
        try {
          count.push(this.observableListenersList[i]);
          if (typeof this.observableListenersList[i] === 'function') {
            this.observableListenersList[i](data);
          } else {
            this.observableListenersList[i].setState(data);
          }
        } catch (error) {
          console.log(error);
          this.removeListener(this.observableListenersList[i]);
        }
      }
    }
  }
}
