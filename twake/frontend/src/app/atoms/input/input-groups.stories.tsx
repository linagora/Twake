import { ComponentStory } from '@storybook/react';
import { SearchIcon } from '@heroicons/react/solid';
import { Title } from '../text';
import { Input } from './input';
import { FilterIcon } from '@heroicons/react/outline';
import Select from './select';

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
      <Title>Icons</Title>
      <br />

      <div className="relative">
        <SearchIcon className="h-4 w-4 absolute m-auto top-0 bottom-0 left-3 text-zinc-500" />
        <Input className="pl-9 pr-9" placeholder="Awesome text" />
        <FilterIcon className="h-4 w-4 absolute m-auto top-0 bottom-0 right-3 text-zinc-500" />
      </div>

      <br />
      <br />
      <Title>Groups</Title>
      <br />

      <div className="relative flex">
        <Input className="grow rounded-tr-none rounded-br-none mr-px" placeholder="Awesome text" />
        <Select className="w-auto rounded-tl-none rounded-bl-none">
          <option>Option 1</option>
        </Select>
      </div>

      <br />
      <br />
      <Title>Mixed</Title>
      <br />

      <div className="relative flex">
        <div className="grow relative mr-px">
          <SearchIcon className="h-4 w-4 absolute m-auto top-0 bottom-0 left-3 text-zinc-500" />
          <Input className="pl-9 pr-9 rounded-tr-none rounded-br-none" placeholder="Awesome text" />
        </div>
        <div className="relative">
          <FilterIcon className="h-4 w-4 absolute m-auto top-0 bottom-0 left-3 text-zinc-500" />
          <Select className="pl-9 w-auto rounded-tl-none rounded-bl-none text-opacity-50">
            <option>company</option>
            <option>channel</option>
          </Select>
        </div>
      </div>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: 'Text',
  disabled: false,
};
