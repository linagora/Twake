import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import MessagesListService from 'services/Apps/Messages/MessagesList';

type Props = {
  channel: any;
  threadId: string;
  collectionKey: string;
};

export default class MessagesList extends Component<Props> {
  messagesListService: MessagesListService;

  constructor(props: Props) {
    super(props);
    this.messagesListService = new MessagesListService(
      this.props.channel.id,
      this.props.threadId,
      this.props.collectionKey,
    );
  }

  componentDidMount() {
    Collections.get('messages').addListener(this);
    this.messagesListService.init();
  }

  componentWillUnmount() {
    Collections.get('messages').removeListener(this);
    this.messagesListService.destroy();
  }

  render() {
    const count = this.messagesListService.getMessages().length;
    return (
      <div>
        {count}
        <button
          onClick={() => {
            this.messagesListService.loadMore();
          }}
        >
          before
        </button>
        <button
          onClick={() => {
            this.messagesListService.loadMore(false);
          }}
        >
          after
        </button>
        <button
          onClick={() => {
            this.messagesListService.init('edfbdbda-57a9-11e9-994d-0242ac120005');
          }}
        >
          Jump to ...
        </button>
        <button
          onClick={() => {
            this.messagesListService.init(true);
          }}
        >
          Go to the end
        </button>
      </div>
    );
  }
}
