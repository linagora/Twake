import Observable from 'services/observable';
import LocalStorage from 'services/localStorage.js';
import DriveService from 'services/Apps/Drive/Drive.js';

class MessageEditorsManager {
  services: { [key: string]: MessageEditors } = {};
  constructor() {
    //@ts-ignore
    window.MessageEditors = this;
  }
  get(channelId: string) {
    if (this.services[channelId]) {
      return this.services[channelId];
    }
    this.services[channelId] = new MessageEditors(channelId);
    return this.services[channelId];
  }
}

export default new MessageEditorsManager();

/*
  This class will manage editor states (opened editor and state)
*/
export class MessageEditors extends Observable {
  constructor(channelId: string) {
    super();
    this.channelId = channelId;
  }

  //State
  channelId: string;
  currentEditor: string | false = false; //False no editor opened, string = parent message
  currentEditorThreadId: string | false = false; //False no editor opened, string = parent message
  editorsContents: { [key: string]: string } = {};
  editorsUploadZones: { [key: string]: any } = {};

  setInputNode(node: any, editorId: string) {}

  setContent(threadId: string, content: string) {
    LocalStorage.setItem('m_input_' + this.channelId + '_' + threadId, content);
    this.editorsContents[threadId] = content;
  }

  getContent(threadId: string) {
    LocalStorage.getItem('m_input_' + this.channelId + '_' + threadId, (res: string | null) => {
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

  setUploadZone(threadId: string, node: any) {
    if (node) {
      this.editorsUploadZones[threadId || 'main'] = node;
    }
  }

  openFileSelector(threadId: string) {
    console.log(this.editorsUploadZones);
    if (this.editorsUploadZones[threadId || 'main']) {
      this.editorsUploadZones[threadId || 'main'].open();
    }
  }

  onAddAttachment(threadId: string, file: any) {
    DriveService.sendAsMessage(this.channelId, threadId, file);
  }
}
