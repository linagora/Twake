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

    public function __construct($doctrine){
        $this->doctrine = $doctrine;
    }

    public function generatePreview($filename,$file, $path)
    {
        if (!is_dir($path)) {
            mkdir($path, 0777, true);
        }

        $dimensions = getimagesize($file);
        if ($dimensions !== false) {

            $width_orig = $dimensions[0];
            $height_orig = $dimensions[1];

            if ($width_orig > 100 && $height_orig > 100) {
                // Le fichier
                $filepath = $path . $filename;

                // Définition de la largeur et de la hauteur maximale
                $width = 100;
                $height = 100;

                // Cacul des nouvelles dimensions
                $ratio_orig = $width_orig / $height_orig;

                if ($width / $height > $ratio_orig) {
                    $width = $height * $ratio_orig;
                } else {
                    $height = $width / $ratio_orig;
                }

                // Redimensionnement
                $image_preview = imagecreatetruecolor($width, $height);
                $image = imagecreatefrompng($file);
                imagecopyresampled($image_preview, $image, 0, 0, 0, 0, $width, $height, $width_orig, $height_orig);
                imagepng($image_preview, $filepath);
            }
            return true;
        }
        return false;
    }

}