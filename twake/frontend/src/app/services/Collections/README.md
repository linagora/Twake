Collections documentation is here: https://doc.twake.app/internal-documentation/collections

If it's not here, then we are WIP and it's here: https://www.notion.so/twake/Draft-V2-9d593fc0b778467ebe07efdfb8acc6d7

And at least there is some explanation:

## Collections2 for Twake

We use minimongo and typescript now! 🔥🔥🔥

### How we'll use it ?

```typescript
import Collections, { Resource, Collection } from 'services/Collections2/Collections';

type MessageType = {
  id: string;
  content: string;
};

class Message extends Resource<MessageType> {
  getContentTrim() {
    return (this.data.content || '').trim();
  }
}

class MessageCollection extends Collection<Message> {
  public static get(path: string): Collection<Message> {
    return Collections.get(path, Message, () => new Messages(path, Message)) as Collection<Message>;
  }
}

() => {
  const channelId = 'some-id';
  const MessagesCollection = MessageCollection.get(channelId);

  const messages = MessagesCollection.useWatcher(() => MessagesCollection.find());

  return (
    <div>
      {messages.map(message => {
        return <div>{message.getContentTrim()}</div>;
      })}

      <button
        onClick={() =>
          Messages.insert(new Message({ content: 'Time is: ' + new Date().getTime() }))
        }
      >
        Add
      </button>
    </div>
  );
};
```
