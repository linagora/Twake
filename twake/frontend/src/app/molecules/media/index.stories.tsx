import React from 'react';
import { ComponentStory } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import Media, { MediaSize } from '.';

export default {
  title: '@molecules/media',
};

const Template: ComponentStory<any> = () => {
  const media = [
    {
      img: 'https://images.freeimages.com/images/small-previews/2c8/nature-1363160.jpg',
    },
    {
      img: 'https://images.freeimages.com/images/small-previews/cec/nature-1384554.jpg',
      duration: '02:17',
    },
    {
      img: 'https://images.freeimages.com/images/small-previews/d67/experimenting-with-nature-1547377.jpg',
      duration: '01:02:18',
    },
    {
      img: 'https://images.freeimages.com/images/small-previews/fac/nature-line-1-1386630.jpg',
      duration: 'Long string probably',
    },
  ];

  return (
    <div className="flex  gap-2">
      {media.map(m => (
        <div key={m.img} className="flex">
          <div className="flex gap-2 items-center">
            <div className="cursor-pointer">
              <Media url={m.img} size={MediaSize.LG} duration={m.duration} />
            </div>
            <div className="flex flex-col h-full ">
              <div className="cursor-pointer flex items-center justify-center grow">
                <Media url={m.img} size={MediaSize.MD} duration={m.duration} />
              </div>
              <div className="cursor-pointer flex items-center justify-center grow">
                <Media url={m.img} size={MediaSize.SM} duration={m.duration} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};
