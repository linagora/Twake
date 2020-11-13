import { MessagesListServerUtils, Message } from './MessagesListServerUtils';
import Observable from 'services/observable';
import Collections from 'services/Collections/Collections';

class MessagesListUtilsManager {
  services: { [key: string]: MessagesListUtils } = {};
  constructor() {}
  get(collectionKey: string, serverService?: MessagesListServerUtils) {
    if (this.services[collectionKey]) {
      return this.services[collectionKey];
    }
    if (serverService) {
      this.services[collectionKey] = new MessagesListUtils(serverService);
    }
    return this.services[collectionKey];
  }
}

export default new MessagesListUtilsManager();

/*
  This class will manage react virtualized and scroll cases
*/
export class MessagesListUtils extends Observable {
  debug = false;

  //Internal variables
  scrollerNode: any;
  messagesContainerNode: any;
  messagesContainerNodeResizeObserver: any;
  ignoreNextScroll: number = 0;
  serverService: MessagesListServerUtils;
  initDate: number = 0;
  visiblesMessages: { [key: string]: boolean } = {};
  registeredRender: any[] = [];
  lockedScrollTimeout: any;
  loadMoreLocked: boolean = false;

  //State
  highlighted: string = '';
  fixBottom: boolean = true;
  showScrollDown: boolean = false;
  showGradient: boolean = false;
  currentScrollTop: number = 0;
  currentScrollHeight: number = 0;
  messagesContainerNodeScrollTop: number = 0;
  currentWitnessNode: any = 0;
  currentWitnessNodeScrollTop: number = 0;
  currentWitnessNodeClientTop: number = 0;
  messagesPositions: { [key: string]: { node: any; message: Message } } = {};
  getVisibleMessagesLastPosition: number = 0;

  constructor(serverService: MessagesListServerUtils) {
    super();

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
    this.messagesContainerNodeResizeObserver.observe(node, { subtree: true });
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
      this.scrollTo(this.scrollerNode.scrollHeight - this.scrollerNode.clientHeight, true);
    }
  }

  //Keep messages in position
  fixScroll() {
    if (!this.currentWitnessNode) {
      return;
    }

    //If there is more stuff up then the view probably shifted
    if (this.currentWitnessNode.offsetTop != this.currentWitnessNodeScrollTop) {
      this.currentWitnessNodeScrollTop = this.currentWitnessNode.offsetTop;

      if (this.debug) {
        console.log('more stuff up', this.currentWitnessNodeClientTop);
      }

      //Force witness to keep the same clientTop
      this.scrollTo(
        (this.currentWitnessNode?.offsetTop || 0) +
          this.messagesContainerNode?.offsetTop -
          this.currentWitnessNodeClientTop,
      );

      if (this.debug) {
        console.log('after more stuff up', this.getWitnessClientTop());
      }
    }
  }

  setWitnessMessage(node: any) {
    this.fixScroll();
    if (this.debug) {
      console.log('previous witness scroll top ', this.getWitnessClientTop());
      console.log('new witness id', node);
      if (this.currentWitnessNode) {
        this.currentWitnessNode.style.backgroundColor = '';
      }
    }
    this.getVisibleMessagesLastPosition = this.currentScrollTop;
    this.currentWitnessNode = node;
    this.currentWitnessNodeClientTop = this.getWitnessClientTop();
    if (this.debug) {
      console.log('new witness is at ', this.currentWitnessNodeClientTop);
      this.currentWitnessNode.style.backgroundColor = 'red';
    }
  }

  // Update visible / invisible message and set the 'witness message' (message that's should not move)
  getVisibleMessages(setWitness: boolean = false) {
    let closestToCenter = 10000;
    let bestCenterNode: any;

    this.currentScrollTop = this.scrollerNode.scrollTop;

    const upLimit = this.currentScrollTop;
    const bottomLimit = this.currentScrollTop + this.scrollerNode.clientHeight;
    let center = (upLimit + bottomLimit) / 2;
    if (this.fixBottom) {
      center = bottomLimit;
    }
    if (this.highlighted) {
      const scrollTop = this.getMessageScrollTop({ id: this.highlighted });
      if (scrollTop !== null) {
        center = scrollTop;
      }
    }

    Object.values(this.messagesPositions).forEach(nodeMessage => {
      if (nodeMessage.node) {
        const offsetTop =
          nodeMessage.node?.getDomElement()?.offsetTop + this.messagesContainerNodeScrollTop;
        const offsetBottom = offsetTop + nodeMessage.node?.getDomElement()?.clientHeight;

        if (setWitness) {
          const distanceFromCenter = Math.abs((offsetTop + offsetBottom) / 2 - center);
          if (distanceFromCenter < closestToCenter) {
            closestToCenter = distanceFromCenter;
            bestCenterNode = nodeMessage.node.getDomElement();
          }
        }

        if (
          offsetBottom > upLimit - this.scrollerNode.clientHeight &&
          offsetTop < bottomLimit + this.scrollerNode.clientHeight
        ) {
          this.registerDelayedRender(nodeMessage.node);
        } else {
          if (nodeMessage.message.id === this.highlighted) {
            this.removeHighlightMessage();
          }
          if (
            offsetBottom < upLimit - this.scrollerNode.clientHeight * 10 &&
            offsetTop > bottomLimit + this.scrollerNode.clientHeight * 10
          ) {
            nodeMessage.node.stopRenderContent();
          }
          //Do nothing
        }
      }
    });

    if (this.highlighted) {
      const message = Collections.get('messages').find(this.highlighted);
      bestCenterNode = this.messagesPositions[message?.id]?.node?.getDomElement() || bestCenterNode;
    }
    if (bestCenterNode) this.setWitnessMessage(bestCenterNode);

    window.requestAnimationFrame(() => this.triggerDelayedRender());
  }

  registerDelayedRender(messageNode: any) {
    this.registeredRender.push(messageNode);
  }

  triggerDelayedRender() {
    this.registeredRender.forEach((node: any) => {
      node.startRenderContent();
    });
    this.registeredRender = [];
  }

  //Search for a message and scroll to it
  scrollToMessage(message: Message): boolean {
    return Object.values(this.messagesPositions).some(nodeMessage => {
      if (
        nodeMessage.message?.id === message.id ||
        nodeMessage.message?.front_id === message.front_id
      ) {
        this.fixBottom = false;
        this.showScrollDown = true;
        const offsetTop = nodeMessage.node?.getDomElement()?.offsetTop;
        this.scrollTo(offsetTop - 128, true);
        this.highlightMessage(message.id || '');
        return true;
      }
    });
  }

  highlightMessage(mid: string) {
    if (this.highlighted != mid) {
      this.highlighted = mid;
      this.serverService.notify();
    }
  }

  removeHighlightMessage() {
    if (this.highlighted) {
      this.highlighted = '';
      this.serverService.notify();
    }
  }

  //Search for a message and scroll to it
  getMessageScrollTop(message: Message): number | null {
    let offsetTop = null;
    Object.values(this.messagesPositions).some(nodeMessage => {
      if (
        nodeMessage.message?.id === message.id ||
        nodeMessage.message?.front_id === message.front_id
      ) {
        offsetTop =
          nodeMessage.node?.getDomElement()?.offsetTop + this.messagesContainerNodeScrollTop;
        return true;
      }
    });
    return offsetTop;
  }

  scrollTo(position: number | true, changeWitness: boolean = false) {
    if (this.debug) {
      console.log('scrollTo called', this.scrollerNode.scrollTop, position);
    }

    if (!this.scrollerNode) {
      return;
    }
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
        this.initDate > 0 &&
        new Date().getTime() - this.initDate > 2000
      ) {
        this.scrollerNode.scroll({
          top: position,
          behavior: 'smooth', //still need to did around this one
        });
      } else {
        this.scrollerNode.scrollTop = position;
      }
      this.onScroll();
      this.getVisibleMessages(changeWitness);
      this.triggerDelayedRender();
    }
  }

  onContentChange() {
    if (this.debug) {
      console.log(
        'onContentChange called',
        this.currentScrollHeight,
        this.messagesContainerNode.scrollHeight,
      );
    }

    this.ignoreNextScroll++;

    this.updateScroll();

    this.fixScroll();

    this.unlockScroll();
  }

  getWitnessClientTop() {
    return (
      (this.currentWitnessNode?.offsetTop || 0) +
      this.messagesContainerNode?.offsetTop -
      this.scrollerNode.scrollTop
    );
  }

  lockScroll() {
    this.loadMoreLocked = true;
    if (this.lockedScrollTimeout) {
      clearTimeout(this.lockedScrollTimeout);
    }
    this.lockedScrollTimeout = setTimeout(() => {
      this.unlockScroll();
    }, 3000);
  }

  unlockScroll() {
    this.loadMoreLocked = false;
  }

  async onScroll(evt?: any) {
    if (this.debug) {
      console.log('onScroll called', this.scrollerNode.scrollTop);
    }

    if (!this.scrollerNode) {
      return;
    }

    this.fixScroll();

    evt = {
      clientHeight: this.scrollerNode.clientHeight,
      scrollHeight: this.scrollerNode.scrollHeight,
      scrollTop: this.scrollerNode.scrollTop,
    };

    if (Math.abs(this.getVisibleMessagesLastPosition - this.currentScrollTop) > 50) {
      this.getVisibleMessages(this.ignoreNextScroll <= 0);
    }

    const goingUp = this.currentScrollTop - this.scrollerNode.scrollTop > 0;

    //Get current status to detect changes on new messages are added to the list
    this.currentScrollHeight = this.messagesContainerNode.scrollHeight;
    this.currentScrollTop = this.scrollerNode.scrollTop;
    this.currentWitnessNodeClientTop = this.getWitnessClientTop();

    if (this.debug) {
      console.log('clientTop', this.currentWitnessNodeClientTop);
    }

    //After this point, we only want to act if this is user scroll (and not ourselve scrolling)
    if (this.ignoreNextScroll > 0) {
      this.ignoreNextScroll--;

      if (
        evt.clientHeight + evt.scrollTop >= evt.scrollHeight &&
        this.serverService.hasLastMessage()
      ) {
        if (!this.fixBottom) {
          this.fixBottom = true;
          this.showScrollDown = false;
          this.notify();
        }
      }

      return;
    }

    if (evt.scrollTop <= this.scrollerNode.clientHeight && goingUp) {
      await this.serverService.loadMore();
      this.lockScroll();
    }
    if (
      evt.scrollHeight - (evt.scrollTop + evt.clientHeight) <= this.scrollerNode.clientHeight &&
      !goingUp
    ) {
      await this.serverService.loadMore(false);
      this.lockScroll();
    }
    if (
      evt.clientHeight + evt.scrollTop >= evt.scrollHeight &&
      this.serverService.hasLastMessage()
    ) {
      if (!this.fixBottom) {
        this.fixBottom = true;
      }
      this.removeHighlightMessage();
      this.updateScroll();
    } else {
      if (this.fixBottom) {
        this.fixBottom = false;
      }
    }

    const gradient = !(
      evt.clientHeight + evt.scrollTop >= evt.scrollHeight - 40 &&
      this.serverService.hasLastMessage()
    );
    if (this.showGradient !== gradient) {
      this.showGradient = gradient;
      this.notify();
    }

    const scrollDown = !(
      evt.clientHeight + evt.scrollTop >= evt.scrollHeight - 200 &&
      this.serverService.hasLastMessage()
    );
    if (this.showScrollDown !== scrollDown) {
      this.showScrollDown = gradient;
      this.notify();
    }
  }
}
