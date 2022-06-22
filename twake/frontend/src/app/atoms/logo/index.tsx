import React from 'react';

type PropsType = {
  size?: 16 | 32 | 64 | 128 | 256;
}

export const Logo = ({ size = 128 }: PropsType) => (
  <div className="flex flex-col items-center justify-center">
    <img className="mx-auto w-auto" src={`/public/img/logo/${size}x${size}.png`} alt="Twake logo" />
  </div>
);
 