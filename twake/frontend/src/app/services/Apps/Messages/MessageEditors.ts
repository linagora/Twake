import Observable from 'services/observable';

class MessageEditorsManager {
  services: { [key: string]: MessageEditors } = {};
  constructor() {
    //@ts-ignore
    window.MessageEditors = this;
  }
  get(collectionKey: string) {
    if (this.services[collectionKey]) {
      return this.services[collectionKey];
    }
    this.services[collectionKey] = new MessageEditors();
    return this.services[collectionKey];
  }
}

export default new MessageEditorsManager();

/*
  This class will manage editor states (opened editor and state)
*/
export class MessageEditors extends Observable {
  constructor() {
    super();
  }

  //State
  currentEditor: string | false = false; //False no editor opened, string = parent message

  setInputNode(node: any, editorId: string) {}

  openEditor(parentMessage: string) {
    this.currentEditor = parentMessage;
    this.notify();
  }

  closeEditor() {
    this.currentEditor = false;
    this.notify();
  }
}
