import React from 'react';
import {G, Path} from 'react-svg';

const SvgComponent = props => (
  <svg
    width={(props.scale || 1) * 0.75 * 32}
    height={(props.scale || 1) * 0.75 * 32}
    viewBox="0 0 32 32"
    {...props}
  >
    <g fill={props.fill || '#FFF'}>
      <path
        scale={(props.scale || 1) * 0.75}
        d="M16.041 12.217H16h.041zM25.082 8.342h-3.915s2.1 1.373 2.551 3.875H25.082a2.523 2.523 0 0 1 2.543 2.543v2.583c0 1.421-1.122 2.624-2.543 2.624H16.04c-1.421 0-2.624-1.203-2.624-2.624V14.8H9.542v2.543c0 .929.202 1.816.557 2.624 1.017 2.276 3.302 3.875 5.942 3.875h9.042c3.568 0 6.418-2.931 6.418-6.499V14.76a6.39 6.39 0 0 0-6.419-6.418z"
      />
      <path
        scale={(props.scale || 1) * 0.75}
        d="M21.942 12.217a6.39 6.39 0 0 0-5.902-3.875H7c-3.569 0-6.5 2.85-6.5 6.418v2.583c0 3.568 2.931 6.499 6.5 6.499h3.833s-2.082-1.373-2.59-3.875H7c-1.421 0-2.624-1.203-2.624-2.624V14.76c0-1.421 1.203-2.543 2.624-2.543h9.041a2.523 2.523 0 0 1 2.543 2.543v2.623h3.875V14.76c0-.904-.186-1.768-.517-2.543z"
      />
    </g>
  </svg>
);

export default SvgComponent;
