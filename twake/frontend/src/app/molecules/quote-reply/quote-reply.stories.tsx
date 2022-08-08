import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import QuoteReply from './index';

export default {
  title: 'molecules/quote-reply',
  component: QuoteReply,
} as ComponentMeta<typeof QuoteReply>;

const Template: ComponentStory<typeof QuoteReply> = args => <QuoteReply {...args} />;

export const Editing = Template.bind({});
export const Displaying = Template.bind({});

Editing.args = {
  author: 'John Doe',
  message: 'This is a message that is being quoted',
  closable: true,
  onClose: () => {
    console.log('Closed');
  },
};

Displaying.args = {
  author: 'Jane Dove',
  message: 'This is a quoted message while displaying it',
  closable: false,
};
