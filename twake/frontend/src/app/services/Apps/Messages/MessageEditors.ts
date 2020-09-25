import Observable from 'services/observable';
import LocalStorage from 'services/localStorage.js';
import DriveService from 'services/Apps/Drive/Drive.js';

class MessageEditorsManager {
  services: { [key: string]: MessageEditors } = {};
  constructor() {
    //@ts-ignore
    window.MessageEditors = this;
  }
  get(channelId: string): MessageEditors {
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
  currentEditorMessageId: string | false = false; //False no editor opened, string = parent message
  editorsContents: { [key: string]: string } = {};
  editorsUploadZones: { [key: string]: any } = {};

  setInputNode(threadId: string, messageId: string, context: string, node: any) {}

  setContent(threadId: string, messageId: string, content: string) {
    if (!messageId) {
      const all = LocalStorage.getItem('m_input') || {};
      all[this.channelId + (threadId ? '_thread=' + threadId : '')] = [
        content,
        new Date().getTime(),
      ];
      LocalStorage.setItem('m_input', all);
    }
    this.editorsContents[threadId + '_' + messageId] = content;
  }

  getContent(threadId: string, messageId: string) {
    if (!messageId) {
      const all = this.cleanSavedInputContents(LocalStorage.getItem('m_input') || {});
      const res = all[this.channelId + (threadId ? '_thread=' + threadId : '')][0];
      if (res) {
        this.editorsContents[threadId + '_' + messageId] = res;
      }
    }
    return this.editorsContents[threadId + '_' + messageId] || '';
  }

  cleanSavedInputContents(all: any) {
    Object.keys(all).forEach(key => {
      if (
        all[key] &&
        all[key][1] < new Date().getTime() - 1000 * 60 * 60 * 24 * 31 &&
        (all.indexOf('_thread=') ||
          all[key][1] < new Date().getTime() - 1000 * 60 * 60 * 24 * 31 * 6)
      ) {
        delete all[key];
      }
    });
    return all;
  }

  openEditor(threadId: string, messageId: string, context: string = '') {
    this.currentEditor =
      threadId + (messageId ? '_' + messageId : '') + (context ? '_' + context : '');
    this.currentEditorThreadId = threadId;
    this.currentEditorMessageId = messageId;
    this.notify();
  }

  closeEditor() {
    this.currentEditor = false;
    this.currentEditorThreadId = '';
    this.currentEditorMessageId = '';
    this.notify();
  }

  /* Get upload zone */

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
