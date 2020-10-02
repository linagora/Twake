import React from 'react';

let observables_count = 0;
export default class Observable {
  constructor() {
    this.observableName = 'observable_' + observables_count++;
    this.observableListenersList = [];
    this.onFirstListener = null;
    this.onLastListener = null;
  }
  setObservableName(name) {
    this.observableName = name;
  }
  useListener(useState) {
    const [_, setState] = useState(0);
    this.addListener(setState);
  }
  addListener(listener) {
    if (this.observableListenersList.length == 0 && this.onFirstListener) {
      this.onFirstListener();
    }
    if (this.observableListenersList.indexOf(listener) < 0) {
      this.observableListenersList.push(listener);
    }
  }
  removeListener(listener) {
    var index = this.observableListenersList.indexOf(listener);
    if (index > -1) {
      this.observableListenersList.splice(index, 1);
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
  shouldNotify(node) {
    return true;
  }
  notify(force = false) {
    for (var i = 0; i < this.observableListenersList.length; i++) {
      var update = force || this.shouldNotify(this.observableListenersList[i]);
      if (update) {
        var data = {};
        data[this.observableName] = this;
        try {
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
