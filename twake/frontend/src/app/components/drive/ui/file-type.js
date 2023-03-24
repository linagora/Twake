import React, { Component } from 'react';

import Archive from '../icons/archive.js';
import Code from '../icons/code.js';
import Document from '../icons/document.js';
import Files from '../icons/file.js';
import Images from '../icons/image.js';
import Link from '../icons/link.js';
import Pdf from '../icons/pdf.js';
import Slide from '../icons/slides.js';
import Sound from '../icons/sound.js';
import Spreadsheet from '../icons/spreadsheet.js';
import Svg from '../icons/svg.js';
import Video from '../icons/video.js';

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
      case 'audio':
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
