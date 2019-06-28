<?php

namespace WebsiteApi\DriveUploadBundle\Services;

use WebsiteApi\DriveUploadBundle\Services\DrivePreview;

class PreviewManager

{
   public function generatePreviewFromFolder(){

       $path = "previews";
       $scanned_directory = array_diff(scandir($path), array('..', '.'));
       foreach ($scanned_directory as $file){
           $filename = $file;
           $filepath = $path . DIRECTORY_SEPARATOR . $filename;

//           $stream = fopen($filepath,"r");
//           $meta_data = stream_get_meta_data($stream);
//           $filename = $meta_data["uri"];
           $ext = pathinfo ($filepath,PATHINFO_EXTENSION );

           //var_dump($ext);
           //DrivePreview::generatePreview($filename,$filename,$path,$ext);
//           fclose($filepath);
       }
   }
}
