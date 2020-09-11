import { OnScrollParams } from 'react-virtualized';
/*
  This class will manage react virtualized and scroll cases
*/
export default class MessagesListUtils {
  //Internal variables
  listNode: any;
  messagesCount: number = 0;
  ignoreNextScroll: number = 0;

  //State
  fixBottom: boolean = true;

  constructor() {
    this.refList = this.refList.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.getScrollToIndex = this.getScrollToIndex.bind(this);

    //@ts-ignore
    window.MessagesListUtils = this;
  }

  refList(node: any) {
    this.listNode = node;
  }

  setMessagesCount(messagesCount: number) {
    this.messagesCount = messagesCount;
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

  getScrollToIndex(): number | undefined {
    if (this.fixBottom && this.messagesCount > 0) {
      if (this.listNode) {
        this.listNode.scrollToPosition(this.messagesCount * 100000000);
        this.ignoreNextScroll++;
      }
      this.ignoreNextScroll++;
      return this.messagesCount;
    } else {
      return;
    }
  }
}
