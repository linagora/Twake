import { Message } from "./Message";
import { MessageLoader } from "./MessageLoader";
import Notifications from 'services/user/notifications';
import Collections from 'app/services/CollectionsReact/Collections';
import logger from "app/services/Logger";
import { ChannelResource } from "app/models/Channel";
import MessageLoaderFactory from "./MessageLoaderFactory";

type Scroller = (align: "start" | "center" | "end", message?: Message) => boolean;

export class MessageListService {
  private loader: MessageLoader;
  hightlight: Message | undefined;
  scroller: Scroller | undefined;
  readChannelTimeout: any;
  // TODO: Both exposed in loader
  lastMessageOffset = "";
  lastReadMessage = "";

  constructor(readonly key: string, private channel: ChannelResource) {
    this.loader = MessageLoaderFactory.get(this.key, channel);
  }

  /**
   * @param threadId
   * @returns 
   */
  getLoader(threadId?: string): MessageLoader {
    if (threadId) {
      return MessageLoaderFactory.get(this.key, this.channel, threadId);
    }

    return this.loader;
  }

  setScroller(scroller: Scroller): void {
    this.scroller = scroller;
  }

  async scrollTo(message: Message): Promise<void> {
    logger.debug("Scroll to message", message);
    this.hightlight = message;

    const scrolled = this.scroller && this.scroller("start", message);

    if (!scrolled) {
      // TODO: Must be tested!
      await this.loader.init({ offset: message.id, direction: "down" });
      this.scrollTo(message);
    }
  }

  isLastMessageRead(): boolean {
    if (this.lastReadMessage === this.lastMessageOffset) {
      return true;
    }

    return false;
  }

  markChannelAsRead(): void {
    if (this.isLastMessageRead()) {
      return;
    }

    if (this.readChannelTimeout) {
      clearTimeout(this.readChannelTimeout);
    }
  
    this.readChannelTimeout = setTimeout(() => {
      const path = `/channels/v1/companies/${this.channel.data.company_id}/workspaces/${this.channel.data.workspace_id}/channels/::mine`;
      const collection = Collections.get(path, ChannelResource);
      const channel = collection.findOne({ id: this.channel.id }, { withoutBackend: true });

      this.lastReadMessage = this.lastMessageOffset;
      Notifications.read(channel);
    }, 500);
  }
}