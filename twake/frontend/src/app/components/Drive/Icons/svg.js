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
  >
    <path
      scale={(props.scale || 1) * 0.75}
      fill={props.fill || '#FFF'}
      d="M20.591 29.731l-1.004-1.006a11.056 11.056 0 0 0 3.261-7.875c0-2.976-1.157-5.77-3.261-7.873a11.062 11.062 0 0 0-7.874-3.26 11.061 11.061 0 0 0-7.874 3.26l-1.005-1.005a12.482 12.482 0 0 1 8.879-3.676c3.353 0 6.509 1.309 8.877 3.676a12.479 12.479 0 0 1 3.678 8.878 12.48 12.48 0 0 1-3.677 8.881z"
    />
    <path
      scale={(props.scale || 1) * 0.75}
      fill={props.fill || '#FFF'}
      d="M2 11.376v2.559h2.559v-2.559zM18.819 28.006v2.557h2.557v-2.557zM29.452 21.085l-.603.603L10.752 3.606l.602-.603z"
    />
    <path
      scale={(props.scale || 1) * 0.75}
      fill={props.fill || '#FFF'}
      d="M18.819 11.044v2.559h2.557v-2.559z"
    />
    <path
      scale={(props.scale || 1) * 0.75}
      fill={props.fill || '#FFF'}
      d="M21.615 13.84h-3.03v-3.032h3.03v3.032zm-2.56-.475h2.086v-2.083h-2.086v2.083zM11.238 4.175c.475 0 .854-.38.854-.854s-.378-.854-.854-.854c-.473 0-.852.38-.852.854s.379.854.852.854zM29.146 22.179a.848.848 0 0 0 .854-.854.85.85 0 0 0-.854-.854.85.85 0 0 0-.854.854.851.851 0 0 0 .854.854z"
    />
  </svg>
);

export default SvgComponent;
