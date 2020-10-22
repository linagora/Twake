import React from 'react';
import Collections, { Resource } from 'app/services/Collections/Collections';
import Collection from '../Collection';
import { shallow } from 'enzyme';

/** Messages example component */

class Message extends Resource<any> {
  setContent(content: string) {
    this.data.content = (content || '').trim();
  }
  getContentTrim() {
    return (this.data.content || '-').trim();
  }
}

class Messages extends Collection<Message> {
  public static get(path: string): Collection<Message> {
    return Collections.get(path, Message, () => new Messages(path, Message)) as Collection<Message>;
  }
}

const MessagesComponent = (props: { channelId: string }) => {
  const channelId = props.channelId;
  const MessagesCollection = Messages.get(`/channels/${channelId}/messages/`);

  const messages = MessagesCollection.useWatcher(async () => await MessagesCollection.find()) || [];

  return (
    <div>
      <div id="message_list">
        {messages.map(message => {
          return <div key={message.id}>{message.getContentTrim()}</div>;
        })}
      </div>

      <button
        id="add_button"
        onClick={() =>
          MessagesCollection.insert(new Message({ content: 'Time is: ' + new Date().getTime() }))
        }
      >
        Add
      </button>
    </div>
  );
};

/** End of message example component */

//To be able to wait for collection changes
let setImmediate = () => {};
const flushPromises = () => {
  return new Promise(resolve => {
    setImmediate = () => {
      resolve();
    };
    setTimeout(() => {
      throw 'The component did not flush after 2s!';
    }, 2000);
  });
};

test('Test Observable linked to Collection', async () => {
  const channelId = '1';

  let component;
  component = shallow(<MessagesComponent channelId={channelId} />);
  expect(component.find('button').text()).toBe('Add');

  const Collection = Messages.get(`/channels/${channelId}/messages/`);

  //To be able to wait for collection changes
  Collection.addEventListener(
    () => {
      setTimeout(() => setImmediate(), 10);
    },
    () => new Date(),
  );

  const msg = new Message({ content: 'message_to_remove' });
  Collection.insert(msg);
  await flushPromises();
  expect(component.find('#message_list').children().length).toBe(1);
  expect(component.find('#message_list').children().text()).toBe('message_to_remove');

  msg.setContent('message_to_remove_edited');
  Collection.update(msg);
  await flushPromises();
  expect(component.find('#message_list').children().text()).toBe('message_to_remove_edited');

  Collection.remove(msg);
  await flushPromises();
  expect(component.find('#message_list').children().length).toBe(0);

  component.find('button').simulate('click');
  await flushPromises();
  expect(component.find('#message_list').children().length).toBe(1);

  component.find('button').simulate('click');
  component.find('button').simulate('click');
  component.find('button').simulate('click');
  await flushPromises();
  expect(component.find('#message_list').children().length).toBe(4);

  component.unmount();
});

test('Test Observable linked to Collection precise updates', async () => {});
