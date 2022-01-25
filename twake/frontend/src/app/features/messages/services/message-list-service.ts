import { Message } from '../types/message';
import { MessageLoader } from './message-loader-service';
import UserNotifications from 'app/features/users/services/user-notifications-service';
import Collections from 'app/deprecated/CollectionsReact/Collections';
import logger from 'app/services/Logger';
import { ChannelResource } from 'app/features/channels/types/channel';
import MessageLoaderFactory from './message-loader-factory';

type Scroller = (align: 'start' | 'center' | 'end', message?: Message) => boolean;

export class MessageListService {
  /**
   * The message loader for this message list
   */
  private loader: MessageLoader;

  /**
   * The id of the message to highlight
   */

  hightlight: string | undefined;

  /**
   * The scroller to message function
   */
  scroller: Scroller | undefined;

  /**
   * Id returned by setTimeout when delaying the "read channel action"
   */
  readChannelTimeout: any;

  /**
   * Last read message id
   */
  lastReadMessage = '';

  constructor(readonly key: string, private channel: ChannelResource) {
    this.loader = MessageLoaderFactory.get(this.key, channel);
  }

  destroy(): void {
    // TODO: Destroy all the loaders from threads
    this.loader.destroy(true);
    MessageLoaderFactory.remove(this.loader);
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
    // TODO: When the message is not available in the list, we should be able to open the stream at a given position with offset
    logger.debug('Scroll to message', message);
    if (message.id) {
      this.hightlight = message.id;
    }

    this.scroller && this.scroller('start', message);
  }

  isLastMessageRead(): boolean {
    const lastMessage = this.loader.getLastItem();

    if (lastMessage && this.lastReadMessage && this.lastReadMessage === lastMessage) {
      return true;
    }

    return false;
  }

  markChannelAsRead(requireFocus = false): void {
    if (requireFocus && !document.hasFocus()) {
      return;
    }

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

      this.lastReadMessage = this.loader.getLastItem();
      UserNotifications.read(channel);
    }, 500);
  }
}
