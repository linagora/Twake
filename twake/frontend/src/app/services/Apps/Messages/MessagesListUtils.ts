import { MessagesListServerUtils, Message } from './MessagesListServerUtils';

class MessagesListUtilsManager {
  services: { [key: string]: MessagesListUtils } = {};
  constructor() {
    //@ts-ignore
    window.MessagesListServerUtils = this;
  }
  get(collectionKey: string, serverService: MessagesListServerUtils) {
    if (this.services[collectionKey]) {
      return this.services[collectionKey];
    }
    this.services[collectionKey] = new MessagesListUtils(serverService);
    return this.services[collectionKey];
  }
}

export default new MessagesListUtilsManager();

/*
  This class will manage react virtualized and scroll cases
*/
export class MessagesListUtils {
  //Internal variables
  scrollerNode: any;
  messagesContainerNode: any;
  messagesContainerNodeResizeObserver: any;
  ignoreNextScroll: number = 0;
  serverService: MessagesListServerUtils;
  lockedScrollTimeout: any;
  initDate: number = 0;

  //State
  fixBottom: boolean = true;
  loadMoreLocked: boolean = false;
  currentScrollTop: number = 0;
  currentScrollHeight: number = 0;
  messagesContainerNodeScrollTop: number = 0;
  currentWitnessNode: any = 0;
  currentWitnessNodeScrollTop: number = 0;
  currentWitnessNodeClientTop: number = 0;
  messagesPositions: { [key: string]: { node: any; message: Message } } = {};
  getVisibleMessagesLastPosition: number = 0;

  constructor(serverService: MessagesListServerUtils) {
    this.setScroller = this.setScroller.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.setMessagesContainer = this.setMessagesContainer.bind(this);
    this.unsetScroller = this.unsetScroller.bind(this);
    this.unsetMessagesContainer = this.unsetMessagesContainer.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.initDate = new Date().getTime();

    this.serverService = serverService;

    //@ts-ignore
    this.messagesContainerNodeResizeObserver = new window.ResizeObserver(this.onContentChange);

    //@ts-ignore
    window.MessagesListUtils = this;
  }

  /* Getter / Setter for dom nodes */

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

  setMessageNode(message: Message, node: any) {
    this.messagesPositions[message.front_id || 'undefined'] = {
      message: message,
      node: node,
    };
  }

  unsetScroller() {
    if (this.lockedScrollTimeout) clearTimeout(this.lockedScrollTimeout);
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

  /* END Getter / Setter for dom nodes */

  //Generate fake messages if needed
  getLoadingMessages(
    messagesListServerUtils: MessagesListServerUtils,
    position: 'top' | 'bottom',
  ): any[] {
    const fakes: { fake: boolean }[] = Array.apply(null, Array(1)).map(i => {
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

  //Called by frontend on each rerender to update scroll
  updateScroll() {
    if (!this.messagesContainerNode || !this.scrollerNode) {
      return;
    }
    if (this.fixBottom) {
      this.scrollTo(this.scrollerNode.scrollHeight - this.scrollerNode.clientHeight);
    }
  }

  setWitnessMessage(node: any) {
    if (this.currentWitnessNode) {
      this.currentWitnessNode.style.background = 'none';
    }
    this.currentWitnessNode = node;
    this.currentWitnessNodeScrollTop = this.currentWitnessNode?.offsetTop || 0;
  }

  // Update visible / invisible message and set the 'witness message' (message that's should not move)
  getVisibleMessages(setWitness: boolean = false) {
    this.getVisibleMessagesLastPosition = this.currentScrollTop;
    let closestToCenter = 10000;
    let bestCenterNode: any;
    Object.values(this.messagesPositions).forEach(nodeMessage => {
      if (nodeMessage.node) {
        const offsetTop =
          nodeMessage.node?.getDomElement()?.offsetTop + this.messagesContainerNodeScrollTop;
        const offsetBottom = offsetTop + nodeMessage.node?.getDomElement()?.clientHeight;
        const upLimit = this.currentScrollTop;
        const bottomLimit = this.currentScrollTop + this.scrollerNode.clientHeight;

        if (setWitness) {
          const distanceFromCenter = Math.abs(offsetTop + offsetBottom - (upLimit + bottomLimit));
          if (distanceFromCenter < closestToCenter) {
            closestToCenter = distanceFromCenter;
            bestCenterNode = nodeMessage.node.getDomElement();
          }
        }

        if (
          offsetBottom > upLimit - this.scrollerNode.clientHeight / 2 &&
          offsetTop < bottomLimit + this.scrollerNode.clientHeight / 2
        ) {
          //This message is visible
          nodeMessage.node.getDomElement().style.visibility = 'visible';
        } else {
          //This message is not visible
          nodeMessage.node.getDomElement().style.visibility = 'hidden';
        }
      }
    });
    if (bestCenterNode) this.setWitnessMessage(bestCenterNode);
  }

  //Search for a message and scroll to it
  scrollToMessage(message: Message): boolean {
    return Object.values(this.messagesPositions).some(nodeMessage => {
      if (
        nodeMessage.message?.id === message.id ||
        nodeMessage.message?.front_id === message.front_id
      ) {
        const offsetTop =
          nodeMessage.node?.getDomElement()?.offsetTop + this.messagesContainerNodeScrollTop;
        this.scrollTo(offsetTop - 64);
        return true;
      }
    });
  }

  scrollTo(position: number | true) {
    if (position === true) {
      position = this.scrollerNode.scrollHeight - this.scrollerNode.clientHeight;
    }
    if (this.scrollerNode) {
      this.ignoreNextScroll++;
      const smallJump = position - this.scrollerNode.scrollTop;
      if (
        this.fixBottom &&
        smallJump > 0 &&
        smallJump < 200 &&
        new Date().getTime() - this.initDate > 1000
      ) {
        this.scrollerNode.scroll({
          top: position,
          behavior: 'smooth',
        });
      } else {
        this.scrollerNode.scrollTop = position;
      }
      this.onScroll();
      this.getVisibleMessages(true);
    }
  }

  onContentChange() {
    //In case top fake messages disapear
    const messageListOffset =
      this.messagesContainerNodeScrollTop - this.messagesContainerNode?.offsetTop;

    //Force witness node to keep at the same position
    this.scrollTo(
      (this.currentWitnessNode?.offsetTop || 0) +
        this.messagesContainerNode?.offsetTop -
        this.currentWitnessNodeClientTop,
    );

    //Get current status to detect changes on new messages are added to the list
    this.messagesContainerNodeScrollTop = this.messagesContainerNode?.offsetTop || 0;
    this.currentScrollHeight = this.messagesContainerNode.scrollHeight;
    this.currentScrollTop = this.scrollerNode.scrollTop;

    this.updateScroll();

    this.unlockScroll();

    this.getVisibleMessages();
  }

  lockScroll() {
    if (!this.scrollerNode) {
      return;
    }

    this.scrollerNode.style.pointerEvents = 'none';
    this.scrollerNode.style.overflow = 'hidden';
    this.loadMoreLocked = true;
    if (this.lockedScrollTimeout) {
      clearTimeout(this.lockedScrollTimeout);
    }
    this.lockedScrollTimeout = setTimeout(() => {
      this.unlockScroll();
    }, 3000);
  }

  unlockScroll() {
    if (!this.scrollerNode) {
      return;
    }

    this.scrollerNode.style.pointerEvents = 'all';
    this.scrollerNode.style.overflow = 'auto';
    this.loadMoreLocked = false;
  }

  async onScroll(evt?: any) {
    if (this.loadMoreLocked && evt) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    evt = {
      clientHeight: this.scrollerNode.clientHeight,
      scrollHeight: this.scrollerNode.scrollHeight,
      scrollTop: this.scrollerNode.scrollTop,
    };

    if (Math.abs(this.getVisibleMessagesLastPosition - this.currentScrollTop) > 200) {
      this.getVisibleMessages(this.ignoreNextScroll <= 0);
    }

    //Get current status to detect changes on new messages are added to the list
    this.currentScrollHeight = this.messagesContainerNode.scrollHeight;
    this.currentScrollTop = this.scrollerNode.scrollTop;

    this.currentWitnessNodeClientTop =
      (this.currentWitnessNode?.offsetTop || 0) +
      this.messagesContainerNode?.offsetTop -
      this.scrollerNode.scrollTop;

    //After this point, we only want to act if this is user scroll (and not ourselve scrolling)
    if (this.ignoreNextScroll > 0) {
      this.ignoreNextScroll--;
      return;
    }

    if (!this.loadMoreLocked) {
      const topFakeHeight = this.messagesContainerNode.childNodes[0].clientHeight || 0;
      const bottomFakeHeight =
        this.messagesContainerNode.childNodes[this.messagesContainerNode.childNodes.length - 1]
          .clientHeight || 0;
      if (evt.scrollTop <= topFakeHeight * 0.25) {
        const didRequest = await this.serverService.loadMore();
        if (didRequest) this.lockScroll();
      }
      if (evt.scrollHeight - (evt.scrollTop + evt.clientHeight) <= bottomFakeHeight * 0.25) {
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
