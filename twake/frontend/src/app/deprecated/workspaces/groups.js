import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Observable from 'app/deprecated/CollectionsV1/observable.js';

import Globals from 'app/features/global/services/globals-twake-app-service';

class Groups extends Observable {
  constructor() {
    super();
    this.setObservableName('groups');
    this.currentGroupId = null;
    Globals.window.gs = this;
  }

  addToUser(group) {
    Collections.get('groups').updateObject(group);
  }
}

const service = new Groups();
export default service;
