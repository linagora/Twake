import Observable from 'services/observable';
import LocalStorage from 'services/localStorage.js';

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
    this.services[collectionKey] = new MessageEditors(collectionKey);
    return this.services[collectionKey];
  }
}

export default new MessageEditorsManager();

/*
  This class will manage editor states (opened editor and state)
*/
export class MessageEditors extends Observable {
  constructor(collectionKey: string) {
    super();
    this.collectionKey = collectionKey;
  }

  //State
  collectionKey: string;
  currentEditor: string | false = false; //False no editor opened, string = parent message
  currentEditorThreadId: string | false = false; //False no editor opened, string = parent message
  editorsContents: { [key: string]: string } = {};

  setInputNode(node: any, editorId: string) {}

  setContent(threadId: string, content: string) {
    LocalStorage.setItem('m_input_' + this.collectionKey + '_' + threadId, content);
    this.editorsContents[threadId] = content;
  }

  getContent(threadId: string) {
    LocalStorage.getItem('m_input_' + this.collectionKey + '_' + threadId, (res: string | null) => {
      if (res) {
        this.editorsContents[threadId] = res;
        this.notify();
      }
    });
    return this.editorsContents[threadId] || '';
  }

  openEditor(threadId: string, context: string = '') {
    this.currentEditor = threadId + (context ? '_' + context : '');
    this.currentEditorThreadId = threadId;
    this.notify();
  }

  closeEditor() {
    this.currentEditor = false;
    this.notify();
  }
}
