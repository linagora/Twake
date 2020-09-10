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
    const count = Collections.get('messages').findBy({ channel_id: this.props.channel.id }).length;
    return (
      <div>
        {count}
        <button
          onClick={() => {
            Collections.get('messages').sourceLoad(
              this.props.collectionKey,
              { offset: '', limit: 50 },
              (res: any) => {
                console.log(res);
              },
            );
          }}
        >
          test
        </button>
      </div>
    );
  }
}
