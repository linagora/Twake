import { ComponentStory } from '@storybook/react';
import { SearchIcon } from '@heroicons/react/outline';
import { Title } from '../text';

export default {
  title: '@atoms/input-groups',
};

const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <>
      <Title>Icons and groups</Title>
      <SearchIcon />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: 'Text',
  disabled: false,
};
