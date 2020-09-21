<?php
/**
 * Created by PhpStorm.
 * User: vaati
 * Date: 07/05/18
 * Time: 11:32
 */

namespace Twake\Drive\Services;

use App\App;
use Dompdf\Exception;

class DrivePreview
{
    var $doctrine;
    var $img_height;
    var $img_width;
    var $previewableExt = [];

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->img_height = 300;
        $this->img_width = 300;
        $this->previewableExt = Array("png", "jpeg", "jpg", "gif", "tiff", "ai", "svg", "pdf", "txt", "rtf", "csv", "docx", "doc", "odt", "xls", "xlsx", "ods", "ppt", "pptx", "odp");
    }

    public function generatePreview($filename, $file, $path, $ext, $entity = null)
    {
        try {

            if (!is_dir($path)) {
                mkdir($path, 0777, true);
            }

            if (filesize($file) > 50000000) { //50Mo (protection)
                return false;
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
                $this->isImage($ext)) {
                return $this->generateImagePreview($filename, $file, $path, $entity);
            }

            if ($filetype === 'application/pdf') {
                return $this->generateImagePreview($filename, $file, $path, $entity, true);
            }
            if ($filetype === 'application/msword' ||
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
                $ext === 'webp' ||
                $ext === 'txt' ||
                $ext === 'svg'
            ) {
                return $this->generateImagePreview($filename, $file, $path, $entity, false, true);
            }


            finfo_close($finfo);

        } catch (\Exception $e) {
            error_log("Error during preview generation : " . $e);
        }

        return false;
    }

    /* Do not generate preview for files larger than 50Mo */

    public function isImage($ext)
    {
        return (
            $ext === 'png' ||
            $ext === 'jpg' ||
            $ext === 'jpeg' ||
            $ext === 'gif' ||
            $ext === 'svg' ||
            $ext === 'tiff'
        );
    }

    public function generateImagePreview($filename, $file, $path, $entity = null, $isText = false, $isOffice = false)
    {
        $filepath = $path . "/" . $filename;
        $width = $this->img_width;
        $height = $this->img_height;
        $im = new \Imagick();


        if ($isText) {
            $im->readimage($file . "[0]");
            $this->set_keyword($file, $entity);
        } elseif ($isOffice) {
            $file = $this->convertToPDF($file, $entity);
            if ($file) {
                $im->readimage($file . "[0]");
                $this->set_keyword($file, $entity);
            }
        } else {
            $im->readimage($file);
        }


        $im = $this->autorotate($im);
        $im->setBackgroundColor(new \ImagickPixel('transparent'));
        $geo = $im->getImageGeometry();

        $min_size = min((int)($geo['width']), (int)($geo['height']));

        if ($min_size > $this->img_width) {
            $ox = 0;
            $oy = (int)(($geo['height'] - $min_size) / 2);
            if ($min_size == (int)($geo['height'])) {
                $ox = (int)(($geo['width'] - $min_size) / 2);
                $oy = 0;
            }
            $im->cropImage($min_size, $min_size, $ox, $oy);
        }

        // get the current image dimensions
        $im->ThumbnailImage($width, $height, true);

        /*
                $canvas = new \Imagick();
                $canvas->newImage($width, $height, 'white', 'png');
                $canvas->setBackgroundColor(new \ImagickPixel('transparent'));
                $offsetX = (int)($width / 2) - (int)($geo['width'] / 2);
                $offsetY = (int)($height / 2) - (int)($geo['height'] / 2);
                $canvas->compositeImage($im, \Imagick::COMPOSITE_OVER, $offsetX, $offsetY);

                $im = $canvas;
        */

        // thumbnail the image


        $im->setImageFormat('png');
        $im->writeImage($filepath . '.png');
        $im->clear();
        $im->destroy();

        if ($isOffice) {
            unlink($file);
        }

    }

    public function set_keyword($file, $entity)
    {

        try {
            $content = (new \Spatie\PdfToText\Pdf())
                ->setPdf($file)
                ->text();
            $content = str_replace(array("\\'", "'"), " ", $content);
            $size = substr_count($content, ' ');

            $words = str_word_count(strtolower($content), 1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');
            $totalwords = 1;

            $keywords = Array();

            $regex = <<<'END'
/
(
  (?: [\x00-\x7F]                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 single-byte sequences   0xxxxxxx
  |   [\xC0-\xDF][\x80-\xBF]      #:00d2f4aa-605b-11e9-b23e-0242ac120005 double-byte sequences   110xxxxx 10xxxxxx
  |   [\xE0-\xEF][\x80-\xBF]{2}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 triple-byte sequences   1110xxxx 10xxxxxx * 2
  |   [\xF0-\xF7][\x80-\xBF]{3}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 quadruple-byte sequence 11110xxx 10xxxxxx * 3
  ){1,100}                        #:00d2f4aa-605b-11e9-b23e-0242ac120005 ...one or more times
)
| .                                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 anything else
/x
END;
            foreach ($words as $value) {
                $value = preg_replace($regex, '$1', $value);
                $value = strtolower($value);
                if (strlen($value) > 3 && is_numeric($value) == false) {
                    if ($totalwords < floor($size * 0.20)) //we define the weight of word trough the text
                        $weight = 20;
                    elseif ($totalwords > floor($size * 80))
                        $weight = 20;
                    else
                        $weight = 3;
                    if (!isset($keywords[$value])) {
                        $keywords[$value] = 0;
                    }
                    if (!($keywords[$value]) || substr($value, -1) == "s") { //if the word is not in our table
                        if (substr($value, -1) == "s") { //we check if it's a plural
                            $maybesinglar = substr($value, 0, strlen($value) - 1);
                            if (isset($keywords[$maybesinglar])) { // we check if their is already a singular for this word
                                $keywords[$maybesinglar] += $weight + max(strlen($maybesinglar) - 4, 0) * 2; //if we find a singular we add the singular version of the word instead of the plural
                            } else { // if not we add the new words or it's the first time we saw the word so we need to add it
                                $keywords[$value] = $weight + max(strlen($value) - 4, 0) * 2;
                            }
                        } else {
                            $keywords[$value] = $weight + max(strlen($value) - 4, 0) * 2; // we add the new word which is not a plural or it the first time we saw it
                        }
                    } else { //if the word is in the table
                        $keywords[$value] += $weight + max(strlen($value) - 4, 0) * 2; // we adjust his weight in the table
                    }
                }
                $totalwords++; //we add our total of word to alter the weight of futur word.
            }

            arsort($keywords); // Sort based on frequency


            $keywords_raw = array_slice($keywords, 0, 100);
            $max = array_values(array_slice($keywords, 0, 1))[0];

            foreach ($keywords_raw as $key => $score) {
                $keywords_raw[$key] = ($score / $max);
            }

            $keywords_score = Array();
            foreach ($keywords_raw as $key => $score) {
                $keywords_score[] = Array(
                    "keyword" => $key,
                    "score" => $keywords_raw[$key]
                );
            }

            $entity->setContentKeywords($keywords_score);

        } catch (\Exception $e) {

        }

    }

    public function convertToPDF($filepath, $entity)
    {
        putenv("PATH=/sbin:/bin:/usr/sbin:/usr/bin");
        error_log($filepath);
        shell_exec("timeout 5s unoconv -T 5 -vvvv -f pdf -e PageRange=1-1 " . $filepath);
        $a = explode(".", $filepath);
        array_pop($a);
        $filepath = join(".", $a) . ".pdf";
        if (!file_exists($filepath)) {

            $name = "Unknown name";
            if ($entity) {
                $name = $entity->getName();
            }

            return false;
        }
        return $filepath;
    }

    private function autorotate(\Imagick $image)
    {
        switch ($image->getImageOrientation()) {
            case \Imagick::ORIENTATION_TOPLEFT:
                break;
            case \Imagick::ORIENTATION_TOPRIGHT:
                $image->flopImage();
                break;
            case \Imagick::ORIENTATION_BOTTOMRIGHT:
                $image->rotateImage("#000", 180);
                break;
            case \Imagick::ORIENTATION_BOTTOMLEFT:
                $image->flopImage();
                $image->rotateImage("#000", 180);
                break;
            case \Imagick::ORIENTATION_LEFTTOP:
                $image->flopImage();
                $image->rotateImage("#000", -90);
                break;
            case \Imagick::ORIENTATION_RIGHTTOP:
                $image->rotateImage("#000", 90);
                break;
            case \Imagick::ORIENTATION_RIGHTBOTTOM:
                $image->flopImage();
                $image->rotateImage("#000", 90);
                break;
            case \Imagick::ORIENTATION_LEFTBOTTOM:
                $image->rotateImage("#000", -90);
                break;
            default: // Invalid orientation
                break;
        }
        $image->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
        return $image;
    }

}
