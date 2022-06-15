import React from 'react';
import { ComponentStory } from '@storybook/react';
import { ButtonConfirm } from './confirm';
import { RecoilRoot } from 'recoil';

export default {
  title: '@atoms/button-confirm',
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <RecoilRoot>
      <ButtonConfirm className="m-4" disabled={props.disabled} loading={props.loading}>
        {props.text}
      </ButtonConfirm>
      <br />
      <ButtonConfirm
        className="m-4"
        theme="secondary"
        disabled={props.disabled}
        loading={props.loading}
      >
        {props.text}
      </ButtonConfirm>
      <br />
      <ButtonConfirm
        className="m-4"
        theme="danger"
        disabled={props.disabled}
        loading={props.loading}
      >
        {props.text}
      </ButtonConfirm>
      <br />
      <ButtonConfirm
        className="m-4"
        theme="default"
        disabled={props.disabled}
        loading={props.loading}
      >
        {props.text}
      </ButtonConfirm>
    </RecoilRoot>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  text: 'Text',
  loading: false,
  disabled: false,
};
