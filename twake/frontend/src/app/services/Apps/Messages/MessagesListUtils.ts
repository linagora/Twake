import { OnScrollParams } from 'react-virtualized';
import MessagesListServerUtils, { Message } from './MessagesListServerUtils';

/*
  This class will manage react virtualized and scroll cases
*/
export default class MessagesListUtils {
  //Internal variables
  listNode: any;
  messagesCount: number = 0;
  ignoreNextScroll: number = 0;
  registeredScrollTo: number | null = null;

  //State
  fixBottom: boolean = true;

  constructor() {
    this.refList = this.refList.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.setScrollToIndex = this.setScrollToIndex.bind(this);
    this.onRenderRows = this.onRenderRows.bind(this);

    //@ts-ignore
    window.MessagesListUtils = this;
  }

  refList(node: any) {
    this.listNode = node;
  }

  setMessagesCount(messagesCount: number) {
    this.messagesCount = messagesCount;
  }

  addLoadingMessages(
    messagesListServerUtils: MessagesListServerUtils,
    messages: (Message | { fake: boolean })[],
  ): any[] {
    const fakes: (Message | { fake: boolean })[] = Array.apply(null, Array(5)).map(i => {
      return {
        fake: true,
      };
    });
    return fakes.concat(messages, fakes);
  }

  onScroll(evt: OnScrollParams) {
    if (this.messagesCount === 0 || this.ignoreNextScroll) {
      this.ignoreNextScroll--;
      return;
    }
    if (evt.clientHeight + evt.scrollTop >= evt.scrollHeight) {
      this.fixBottom = true;
    } else {
      this.fixBottom = false;
    }
  }

  onRenderRows() {
    console.log('render');
    if (this.listNode && this.registeredScrollTo !== null) {
      if (this.listNode) {
        this.listNode.scrollToPosition(this.registeredScrollTo * 100000000);
        this.ignoreNextScroll++;
      }
      this.ignoreNextScroll++;
      this.listNode.scrollToRow(this.registeredScrollTo);
      this.registeredScrollTo = null;
    }
  }

  setScrollToIndex(): number | undefined {
    if (this.fixBottom && this.messagesCount > 0) {
      this.registeredScrollTo = this.messagesCount;
    } else {
      return;
    }
  }
}
