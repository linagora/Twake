import Observable from './Observable/Observable';

type Rights = 'guest' | 'member' | 'administrator';
type RightsOrNone = Rights | 'none';

const rightLevels = {
  none: 0,
  guest: 1,
  member: 10,
  administrator: 50,
};

class AccessRightsService extends Observable {
  workspaceLevels: { [workspaceId: string]: Rights } = {};
  companyLevels: { [companyId: string]: Rights } = {};

  constructor() {
    super();
    (window as any).AccessRightsService = this;
  }

  public hasLevel(workspaceId: string, right: RightsOrNone) {
    return rightLevels[this.workspaceLevels[workspaceId] || 'none'] >= rightLevels[right];
  }

  public getLevel(workspaceId: string): RightsOrNone {
    return this.workspaceLevels[workspaceId] || 'none';
  }

  public updateLevel(workspaceId: string, right: RightsOrNone) {
    delete this.workspaceLevels[workspaceId];
    if (right !== 'none') this.workspaceLevels[workspaceId] = right;
    this.notify();
  }

  public resetLevels() {
    this.workspaceLevels = {};
    this.companyLevels = {};
    this.notify();
  }

  public updateCompanyLevel(companyId: string, right: RightsOrNone) {
    delete this.companyLevels[companyId];
    if (right !== 'none') this.companyLevels[companyId] = right;
    this.notify();
  }

  public hasCompanyLevel(companyId: string = '', right: RightsOrNone) {
    return rightLevels[this.companyLevels[companyId] || 'none'] >= rightLevels[right];
  }

  public getCompanyLevel(companyId: string = ''): RightsOrNone {
    return this.companyLevels[companyId] || 'none';
  }
}

export default new AccessRightsService();
