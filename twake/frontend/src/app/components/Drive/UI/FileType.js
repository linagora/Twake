import React, { Component } from 'react';

import Archive from '../Icons/archive.js';
import Code from '../Icons/code.js';
import Document from '../Icons/document.js';
import Files from '../Icons/file.js';
import Images from '../Icons/image.js';
import Link from '../Icons/link.js';
import Pdf from '../Icons/pdf.js';
import Slide from '../Icons/slides.js';
import Sound from '../Icons/sound.js';
import Spreadsheet from '../Icons/spreadsheet.js';
import Svg from '../Icons/svg.js';
import Video from '../Icons/video.js';

export default class FileType extends React.Component {
  /* props : type (string) */
  constructor(props) {
    super();
  }
  render() {
    var type = this.props.type;
    var TypeIcon = Files;
    switch (type) {
      case 'link':
        TypeIcon = Link;
        break;
      case 'code':
        TypeIcon = Code;
        break;
      case 'document':
        TypeIcon = Document;
        break;
      case 'image':
        TypeIcon = Images;
        break;
      case 'pdf':
        TypeIcon = Pdf;
        break;
      case 'slides':
        TypeIcon = Slide;
        break;
      case 'sound':
        TypeIcon = Sound;
        break;
      case 'spreadsheet':
        TypeIcon = Spreadsheet;
        break;
      case 'svg':
        TypeIcon = Svg;
        break;
      case 'video':
        TypeIcon = Video;
        break;
      case 'archive':
        TypeIcon = Archive;
        break;
      default:
    }
    return <TypeIcon {...this.props} />;
  }
}
