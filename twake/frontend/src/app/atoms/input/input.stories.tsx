import { ComponentStory } from '@storybook/react';
import Input from './input';
import { SearchIcon } from '@heroicons/react/outline';
import { Title } from '../text';

export default {
  title: '@atoms/input',
};

const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <>
      <Title>Sizes</Title>
      <Input size="sm" disabled={props.disabled} label="size=sm" placeholder="Awesome text" />
      <br />
      <Input size="md" disabled={props.disabled} label="size=md" placeholder="Awesome text" />
      <br />
      <Input size="lg" disabled={props.disabled} label="size=lg" placeholder="Awesome text" />
      <br />
      <Title>Labels and errors</Title>
      <Input disabled={props.disabled} placeholder="Awesome text" value={props.text} />
      <br />
      <Input
        disabled={props.disabled}
        hasError
        label="Label and feedback"
        feedback="The feedback"
        placeholder="Awesome text"
        value={props.text}
      />
      <br />
      <Input
        disabled={props.disabled}
        label="Multi-line"
        feedback="Some non-error feedback"
        placeholder="Awesome text area"
        value={props.text}
        multiline
      />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: 'Text',
  disabled: false,
};
