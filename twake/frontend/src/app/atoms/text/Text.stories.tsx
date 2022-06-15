import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Section } from '../text/section';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: '@atoms/text',
  component: Section,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Section>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Section> = args => <Section {...args} />;

export const Small = Template.bind({});
Small.args = {
  title: 'Text',
};
