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
    viewBox="0 0 1792 1792"
    {...props}
  >
    <path
      scale={((props.scale || 1) * 0.75) / 56}
      fill={props.fill || '#FFF'}
      d="M768 384V256H640v128h128zm128 128V384H768v128h128zM768 640V512H640v128h128zm128 128V640H768v128h128zm700-388c18.667 18.667 34.667 44 48 76s20 61.333 20 88v1152c0 26.667-9.333 49.333-28 68s-41.333 28-68 28H224c-26.667 0-49.333-9.333-68-28s-28-41.333-28-68V96c0-26.667 9.333-49.333 28-68s41.333-28 68-28h896c26.667 0 56 6.667 88 20s57.333 29.333 76 48l312 312zm-444-244v376h376c-6.667-19.333-14-33-22-41l-313-313c-8-8-21.667-15.333-41-22zm384 1528V640h-416c-26.667 0-49.333-9.333-68-28s-28-41.333-28-68V128H896v128H768V128H256v1536h1280zM909 943l107 349c5.333 18 8 35.333 8 52 0 55.333-24.167 101.167-72.5 137.5S842 1536 768 1536s-135.167-18.167-183.5-54.5S512 1399.333 512 1344c0-16.667 2.667-34 8-52 14-42 54-174 120-396V768h128v128h79c14.667 0 27.667 4.333 39 13s19 20 23 34zm-141 465c35.333 0 65.5-6.333 90.5-19s37.5-27.667 37.5-45-12.5-32.333-37.5-45-55.167-19-90.5-19-65.5 6.333-90.5 19-37.5 27.667-37.5 45 12.5 32.333 37.5 45 55.167 19 90.5 19z"
    />
  </svg>
);

export default SvgComponent;
