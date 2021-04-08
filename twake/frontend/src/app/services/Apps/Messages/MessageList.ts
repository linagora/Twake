import { Message } from "./Message";
import { MessageLoader } from "./MessageLoader";
import logger from "app/services/Logger";

type Scroller = (align: "start" | "center" | "end", message?: Message) => boolean;

export class MessageList {
  hightlight: Message | undefined;
  scroller: Scroller | undefined;

  constructor(readonly key: string, private loader: MessageLoader) {}

  setScroller(scroller: Scroller): void {
    this.scroller = scroller;
  }

  async scrollTo(message: Message): Promise<void> {
    logger.debug("Scroll to message", message);

    const scrolled = this.scroller && this.scroller("start", message);

    if (!scrolled) {
      await this.loader.init({ offset: message.id, direction: "down" });
      this.scrollTo(message);
    } 
  }
}