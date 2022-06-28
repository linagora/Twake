import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import DownloadAppBanner from './download-app-banner';

export default {
  title: 'components/DownloadAppBanner',
  component: DownloadAppBanner,
} as ComponentMeta<typeof DownloadAppBanner>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof DownloadAppBanner> = () => <DownloadAppBanner />;

export const Primary = Template.bind({});

Primary.args = {
  primary: true,
  label: 'MyComponent',
};
