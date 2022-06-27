import { Loader } from '@atoms/loader';
import React from 'react';

export default () => (
  <div className="flex justify-center">
    <div className="p-4">
      <Loader className="h-5 w-5" />
    </div>
  </div>
);
