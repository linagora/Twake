<?php
/**
 * Created by PhpStorm.
 * User: vaati
 * Date: 07/05/18
 * Time: 11:32
 */

namespace WebsiteApi\DriveBundle\Services;


class DrivePreview
{
    var $doctrine;
    var $img_height;
    var $img_width;

    public function __construct($doctrine){
        $this->doctrine = $doctrine;
        $this->img_height = 130 ;
        $this->img_width = 300 ;
    }

    public function generatePreview($filename,$file, $path,$ext)
    {
        if (!is_dir($path)) {
            mkdir($path, 0777, true);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $filetype = finfo_file($finfo, $file);
        if ($filetype === 'image/png' ||
            $filetype === 'image/gif' ||
            $filetype === 'image/x-icon' ||
            $filetype === 'image/jpeg' ||
            $filetype === 'image/svg+xml' ||
            $filetype === 'image/tiff' ||
            $filetype === 'image/webp' ||
            $ext === 'png' ||
            $ext === 'jpg' ||
            $ext === 'jpeg' ||
            $ext === 'jp2' ||
            $ext === 'gif' ||
            $ext === 'svg' ||
            $ext === 'tiff' ||
            $ext === 'bmp' ||
            $ext === 'ico' ||
            $ext === 'webp'
        ) {
            $this->generateImagePreview($filename,$file, $path);
        }

        if($filetype === 'application/pdf') {
            $this->generateImagePreview($filename,$file, $path, true);
        }
        if($filetype === 'application/msword' ||
            $filetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            $filetype === 'text/css' ||
            $filetype === 'text/csv' ||
            $filetype === 'text/plain' ||
            $filetype === 'application/vnd.oasis.opendocument.presentation' ||
            $filetype === 'application/vnd.oasis.opendocument.spreadsheet' ||
            $filetype === 'application/vnd.oasis.opendocument.text' ||
            $filetype === 'application/vnd.ms-powerpoint' ||
            $filetype === 'application/vnd.ms-excel' ||
            $filetype === 'application/vnd.ms-office' ||
            $filetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            $filetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            $filetype === 'application/vnd.oasis.opendocument.text' ||
            $filetype === 'application/vnd.oasis.opendocument.presentation' ||
            $filetype === 'application/vnd.oasis.opendocument.spreadsheet' ||
            $filetype === 'application/vnd.oasis.opendocument.chart' ||
            $filetype === 'application/xml' ||
            $filetype === 'text/html' ||
            $ext === 'doc' ||
            $ext === 'docx  ' ||
            $ext === 'xls' ||
            $ext === 'xlsx' ||
            $ext === 'pps' ||
            $ext === 'ppt' ||
            $ext === 'pptx' ||
            $ext === 'bmp' ||
            $ext === 'ico' ||
            $ext === 'odt' ||
            $ext === 'odg' ||
            $ext === 'odp' ||
            $ext === 'ods' ||
            $ext === 'odc' ||
            $ext === 'xml' ||
            $ext === 'webp'
        ){
            $this->generateImagePreview($filename,$file, $path, false,true);
        }

        finfo_close($finfo);
        return true;
    }

    public function generateImagePreview($filename,$file, $path, $isText = false,$isOffice = false)
    {
        $filepath = $path . $filename;
        $width = $this->img_width;
        $height = $this->img_height;
        $im = new \Imagick();

        if ($isText) {
            $im->readimage($file . "[0]");
        }elseif ($isOffice){
            $file = $this->convertToPDF($file);
            $im->readimage($file . "[0]");

        }else{
            $im->readimage($file);
        }

        // get the current image dimensions
        $geo = $im->getImageGeometry();

        // crop the image
        if(($geo['width']/$width) < ($geo['height']/$height))
        {
            $im->cropImage($geo['width'], floor($height*$geo['width']/$width), 0, 0);
        }
        else
        {
            $im->cropImage(ceil($width*$geo['height']/$height), $geo['height'], (($geo['width']-($width*$geo['height']/$height))/2), 0);
        }
        // thumbnail the image

        $im->setImageAlphaChannel(11);
        $im->ThumbnailImage($width,$height,true);
        $im->setImageFormat('png');
        $im->writeImage($filepath.'.png');
        $im->clear();
        $im->destroy();

        if ($isOffice){
            unlink($file);
        }

    }

    public function convertToPDF($filepath){
        exec("unoconv -f pdf -e PageRange=1-1 ".$filepath);
        $a = explode(".",$filepath);
        array_pop($a);
        $filepath = join(".",$a).".pdf";
        return $filepath;
    }

}