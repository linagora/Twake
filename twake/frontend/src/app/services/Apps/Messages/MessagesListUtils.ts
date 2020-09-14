import MessagesListServerUtils from './MessagesListServerUtils';

/*
  This class will manage react virtualized and scroll cases
*/
export default class MessagesListUtils {
  //Internal variables
  scrollerNode: any;
  messagesContainerNode: any;
  messagesContainerNodeResizeObserver: any;
  ignoreNextScroll: number = 0;
  serverService: MessagesListServerUtils;
  lockedScrollTimeout: any;

  //State
  fixBottom: boolean = true;
  loadMoreLocked: boolean = false;
  currentScrollTop: number = 0;
  currentScrollHeight: number = 0;
  messagesContainerNodeScrollTop: number = 0;
  currentWitnessNode: any = 0;
  currentWitnessNodeScrollTop: number = 0;

  constructor(serverService: MessagesListServerUtils) {
    this.setScroller = this.setScroller.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.setMessagesContainer = this.setMessagesContainer.bind(this);
    this.unsetScroller = this.unsetScroller.bind(this);
    this.unsetMessagesContainer = this.unsetMessagesContainer.bind(this);
    this.onScroll = this.onScroll.bind(this);

    this.serverService = serverService;

    //@ts-ignore
    this.messagesContainerNodeResizeObserver = new window.ResizeObserver(this.onContentChange);

    //@ts-ignore
    window.MessagesListUtils = this;
  }

  setScroller(node: any) {
    if (!node) {
      return;
    }
    this.unsetScroller();
    if (!this.scrollerNode) {
      node.addEventListener('scroll', this.onScroll);
    }
    this.scrollerNode = node;
  }

  setMessagesContainer(node: any) {
    if (!node) {
      return;
    }
    this.unsetMessagesContainer();
    this.messagesContainerNode = node;
    this.messagesContainerNodeResizeObserver.observe(node);
  }

  unsetScroller() {
    if (this.scrollerNode) {
      this.scrollerNode.removeEventListener('scroll', this.onScroll);
    }
    this.scrollerNode = null;
  }

  unsetMessagesContainer() {
    if (this.messagesContainerNodeResizeObserver && this.messagesContainerNode) {
      this.messagesContainerNodeResizeObserver.unobserve(this.messagesContainerNode);
    }
  }

  getLoadingMessages(
    messagesListServerUtils: MessagesListServerUtils,
    position: 'top' | 'bottom',
  ): any[] {
    const fakes: { fake: boolean }[] = Array.apply(null, Array(5)).map(i => {
      return {
        fake: true,
      };
    });
    let fakeTop = fakes;
    let fakeBottom = fakes;

    if (messagesListServerUtils.hasFirstMessage()) {
      fakeTop = [];
    }
    if (messagesListServerUtils.hasLastMessage()) {
      fakeBottom = [];
    }
    if (position === 'top') {
      return fakeTop;
    } else {
      return fakeBottom;
    }
  }

  updateScroll() {
    if (!this.messagesContainerNode) {
      return;
    }
    if (this.fixBottom) {
      this.scrollTo(this.scrollerNode.scrollHeight - this.scrollerNode.clientHeight);
    }
  }

  scrollTo(position: number) {
    if (this.scrollerNode) {
      this.ignoreNextScroll++;
      const smallJump = Math.abs(this.scrollerNode.scrollTop - position);
      if (this.fixBottom && smallJump < 200) {
        this.scrollerNode.scroll({
          top: position,
          behavior: 'smooth',
        });
      } else {
        this.scrollerNode.scrollTop = position;
      }
    }
  }

  onContentChange() {
    //In case top fake messages disapear
    const messageListOffset =
      this.messagesContainerNodeScrollTop - this.messagesContainerNode?.offsetTop;

    //If new content but 'witness node' (message on top) didnt moved, then it was added at the end and then nothing to scroll back in place
    if (this.currentWitnessNodeScrollTop !== this.currentWitnessNode?.offsetTop || 0) {
      this.scrollTo(
        this.currentScrollTop +
          (this.messagesContainerNode.clientHeight - this.currentScrollHeight) -
          messageListOffset,
      );
    }
    this.currentWitnessNode = this.messagesContainerNode.childNodes[1];
    this.currentWitnessNodeScrollTop = this.currentWitnessNode?.offsetTop || 0;
    this.messagesContainerNodeScrollTop = this.messagesContainerNode?.offsetTop || 0;

    this.unlockScroll();

    this.updateScroll();
  }

  lockScroll() {
    if (this.scrollerNode) {
      return;
    }

    this.scrollerNode.style.pointerEvents = 'none';
    this.loadMoreLocked = true;
    if (this.lockedScrollTimeout) {
      clearTimeout(this.lockedScrollTimeout);
    }
    this.lockedScrollTimeout = setTimeout(() => {
      this.unlockScroll();
    }, 3000);
  }

  unlockScroll() {
    if (this.scrollerNode) {
      return;
    }

    this.scrollerNode.style.pointerEvents = 'all';
    this.loadMoreLocked = false;
  }

  async onScroll() {
    const evt = {
      clientHeight: this.scrollerNode.clientHeight,
      scrollHeight: this.messagesContainerNode.clientHeight,
      scrollTop: this.scrollerNode.scrollTop,
    };

    //Get current status to detect changes on new messages are added to the list
    this.currentScrollHeight = evt.scrollHeight;
    this.currentScrollTop = evt.scrollTop;

    if (this.ignoreNextScroll > 0) {
      this.ignoreNextScroll--;
      return;
    }

    if (!this.loadMoreLocked) {
      const topFakeHeight = this.messagesContainerNode.childNodes[0].clientHeight || 0;
      const bottomFakeHeight =
        this.messagesContainerNode.childNodes[this.messagesContainerNode.childNodes.length - 1]
          .clientHeight || 0;
      if (evt.scrollTop <= topFakeHeight * 0.75) {
        const didRequest = await this.serverService.loadMore();
        if (didRequest) this.lockScroll();
      }
      if (evt.scrollHeight - (evt.scrollTop + evt.clientHeight) <= bottomFakeHeight * 0.75) {
        const didRequest = await this.serverService.loadMore(false);
        if (didRequest) this.lockScroll();
      }
    }

    if (
      evt.clientHeight + evt.scrollTop >= evt.scrollHeight &&
      this.serverService.hasLastMessage()
    ) {
      this.fixBottom = true;
      this.updateScroll();
    } else {
      this.fixBottom = false;
    }
  }
}
