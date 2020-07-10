import React from 'react';
<<<<<<< HEAD
import { Path } from 'react-svg';
=======
import {Path} from 'react-svg';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

const SvgComponent = props => (
  <svg
    width={(props.scale || 1) * 0.75 * 32}
    height={(props.scale || 1) * 0.75 * 32}
    viewBox="0 0 32 32"
    {...props}
  >
    <path
      scale={(props.scale || 1) * 0.75}
      fill={props.fill || '#FFF'}
      d="M6.465 4.002v24l20-12z"
    />
  </svg>
);

export default SvgComponent;
