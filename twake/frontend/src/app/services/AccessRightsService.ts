import Observable from './Observable/Observable';

type Rights = 'guest' | 'member' | 'administrator';

class _AccessRightsService extends Observable {
  workspaceRights: { [workspaceId: string]: Rights } = {};

  constructor() {
    super();
    (window as any).AccessRightsService = this;
  }

  public hasRight(workspaceId: string, right: 'none' | Rights) {
    return (this.workspaceRights[workspaceId] || 'none') === right;
  }

  public getRight(workspaceId: string): 'none' | Rights {
    return this.workspaceRights[workspaceId] || 'none';
  }

  public updateRight(workspaceId: string, right: 'none' | Rights) {
    delete this.workspaceRights[workspaceId];
    if (right !== 'none') this.workspaceRights[workspaceId] = right;
    this.notify();
  }

  public resetRights() {
    this.workspaceRights = {};
    this.notify();
  }
}

const AccessRightsService = new _AccessRightsService();
export default AccessRightsService;
