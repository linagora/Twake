import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';

type Props = {
  channel: any;
  threadId: string;
  collectionKey: string;
};

export default class MessagesList extends Component<Props> {
  componentDidMount() {
    Collections.get('messages').addListener(this);
    Collections.get('messages').addSource(
      {
        http_base_url: 'discussion',
        http_options: {
          channel_id: this.props.channel.id,
          parent_message_id: this.props.threadId,
          limit: 20,
        },
        websockets: [{ uri: 'messages/' + this.props.channel.id, options: { type: 'messages' } }],
      },
      this.props.collectionKey,
      (res: any) => {
        console.log(res);
      },
    );
  }

  componentWillUnmount() {
    Collections.get('messages').removeListener(this);
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
