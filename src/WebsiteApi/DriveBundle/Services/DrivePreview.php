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

    public function isImage($ext)
    {
        return (
            $ext === 'png' ||
            $ext === 'jpg' ||
            $ext === 'jpeg' ||
            $ext === 'jp2' ||
            $ext === 'gif' ||
            $ext === 'svg' ||
            $ext === 'tiff' ||
            $ext === 'bmp' ||
            $ext === 'ico' ||
            $ext === 'webp');
    }

    /* Do not generate preview for files larger than 50Mo */
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
                return $this->generateImagePreview($filename, $file, $path, $entity,true);
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

    public function set_keyword($file,$entity){

        try {
            $content = (new \Spatie\PdfToText\Pdf())
                ->setPdf($file)
                ->text();
            $content = str_replace(array("\\'", "'"), " ", $content);
            $size = substr_count($content, ' ');

            $words = str_word_count(strtolower($content), 1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');
            $totalwords = 1;

            $keywords = Array();

            $replace = array(
                'ъ' => '-', 'Ь' => '-', 'Ъ' => '-', 'ь' => '-',
                'Ă' => 'A', 'Ą' => 'A', 'À' => 'A', 'Ã' => 'A', 'Á' => 'A', 'Æ' => 'A', 'Â' => 'A', 'Å' => 'A', 'Ä' => 'Ae',
                'Þ' => 'B',
                'Ć' => 'C', 'ץ' => 'C', 'Ç' => 'C',
                'È' => 'E', 'Ę' => 'E', 'É' => 'E', 'Ë' => 'E', 'Ê' => 'E',
                'Ğ' => 'G',
                'İ' => 'I', 'Ï' => 'I', 'Î' => 'I', 'Í' => 'I', 'Ì' => 'I',
                'Ł' => 'L',
                'Ñ' => 'N', 'Ń' => 'N',
                'Ø' => 'O', 'Ó' => 'O', 'Ò' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'Oe',
                'Ş' => 'S', 'Ś' => 'S', 'Ș' => 'S', 'Š' => 'S',
                'Ț' => 'T',
                'Ù' => 'U', 'Û' => 'U', 'Ú' => 'U', 'Ü' => 'Ue',
                'Ý' => 'Y',
                'Ź' => 'Z', 'Ž' => 'Z', 'Ż' => 'Z',
                'â' => 'a', 'ǎ' => 'a', 'ą' => 'a', 'á' => 'a', 'ă' => 'a', 'ã' => 'a', 'Ǎ' => 'a', 'а' => 'a', 'А' => 'a', 'å' => 'a', 'à' => 'a', 'א' => 'a', 'Ǻ' => 'a', 'Ā' => 'a', 'ǻ' => 'a', 'ā' => 'a', 'ä' => 'ae', 'æ' => 'ae', 'Ǽ' => 'ae', 'ǽ' => 'ae',
                'б' => 'b', 'ב' => 'b', 'Б' => 'b', 'þ' => 'b',
                'ĉ' => 'c', 'Ĉ' => 'c', 'Ċ' => 'c', 'ć' => 'c', 'ç' => 'c', 'ц' => 'c', 'צ' => 'c', 'ċ' => 'c', 'Ц' => 'c', 'Č' => 'c', 'č' => 'c', 'Ч' => 'ch', 'ч' => 'ch',
                'ד' => 'd', 'ď' => 'd', 'Đ' => 'd', 'Ď' => 'd', 'đ' => 'd', 'д' => 'd', 'Д' => 'D', 'ð' => 'd',
                'є' => 'e', 'ע' => 'e', 'е' => 'e', 'Е' => 'e', 'Ə' => 'e', 'ę' => 'e', 'ĕ' => 'e', 'ē' => 'e', 'Ē' => 'e', 'Ė' => 'e', 'ė' => 'e', 'ě' => 'e', 'Ě' => 'e', 'Є' => 'e', 'Ĕ' => 'e', 'ê' => 'e', 'ə' => 'e', 'è' => 'e', 'ë' => 'e', 'é' => 'e',
                'ф' => 'f', 'ƒ' => 'f', 'Ф' => 'f',
                'ġ' => 'g', 'Ģ' => 'g', 'Ġ' => 'g', 'Ĝ' => 'g', 'Г' => 'g', 'г' => 'g', 'ĝ' => 'g', 'ğ' => 'g', 'ג' => 'g', 'Ґ' => 'g', 'ґ' => 'g', 'ģ' => 'g',
                'ח' => 'h', 'ħ' => 'h', 'Х' => 'h', 'Ħ' => 'h', 'Ĥ' => 'h', 'ĥ' => 'h', 'х' => 'h', 'ה' => 'h',
                'î' => 'i', 'ï' => 'i', 'í' => 'i', 'ì' => 'i', 'į' => 'i', 'ĭ' => 'i', 'ı' => 'i', 'Ĭ' => 'i', 'И' => 'i', 'ĩ' => 'i', 'ǐ' => 'i', 'Ĩ' => 'i', 'Ǐ' => 'i', 'и' => 'i', 'Į' => 'i', 'י' => 'i', 'Ї' => 'i', 'Ī' => 'i', 'І' => 'i', 'ї' => 'i', 'і' => 'i', 'ī' => 'i', 'ĳ' => 'ij', 'Ĳ' => 'ij',
                'й' => 'j', 'Й' => 'j', 'Ĵ' => 'j', 'ĵ' => 'j', 'я' => 'ja', 'Я' => 'ja', 'Э' => 'je', 'э' => 'je', 'ё' => 'jo', 'Ё' => 'jo', 'ю' => 'ju', 'Ю' => 'ju',
                'ĸ' => 'k', 'כ' => 'k', 'Ķ' => 'k', 'К' => 'k', 'к' => 'k', 'ķ' => 'k', 'ך' => 'k',
                'Ŀ' => 'l', 'ŀ' => 'l', 'Л' => 'l', 'ł' => 'l', 'ļ' => 'l', 'ĺ' => 'l', 'Ĺ' => 'l', 'Ļ' => 'l', 'л' => 'l', 'Ľ' => 'l', 'ľ' => 'l', 'ל' => 'l',
                'מ' => 'm', 'М' => 'm', 'ם' => 'm', 'м' => 'm',
                'ñ' => 'n', 'н' => 'n', 'Ņ' => 'n', 'ן' => 'n', 'ŋ' => 'n', 'נ' => 'n', 'Н' => 'n', 'ń' => 'n', 'Ŋ' => 'n', 'ņ' => 'n', 'ŉ' => 'n', 'Ň' => 'n', 'ň' => 'n',
                'о' => 'o', 'О' => 'o', 'ő' => 'o', 'õ' => 'o', 'ô' => 'o', 'Ő' => 'o', 'ŏ' => 'o', 'Ŏ' => 'o', 'Ō' => 'o', 'ō' => 'o', 'ø' => 'o', 'ǿ' => 'o', 'ǒ' => 'o', 'ò' => 'o', 'Ǿ' => 'o', 'Ǒ' => 'o', 'ơ' => 'o', 'ó' => 'o', 'Ơ' => 'o', 'œ' => 'oe', 'Œ' => 'oe', 'ö' => 'oe',
                'פ' => 'p', 'ף' => 'p', 'п' => 'p', 'П' => 'p',
                'ק' => 'q',
                'ŕ' => 'r', 'ř' => 'r', 'Ř' => 'r', 'ŗ' => 'r', 'Ŗ' => 'r', 'ר' => 'r', 'Ŕ' => 'r', 'Р' => 'r', 'р' => 'r',
                'ș' => 's', 'с' => 's', 'Ŝ' => 's', 'š' => 's', 'ś' => 's', 'ס' => 's', 'ş' => 's', 'С' => 's', 'ŝ' => 's', 'Щ' => 'sch', 'щ' => 'sch', 'ш' => 'sh', 'Ш' => 'sh', 'ß' => 'ss',
                'т' => 't', 'ט' => 't', 'ŧ' => 't', 'ת' => 't', 'ť' => 't', 'ţ' => 't', 'Ţ' => 't', 'Т' => 't', 'ț' => 't', 'Ŧ' => 't', 'Ť' => 't', '™' => 'tm',
                'ū' => 'u', 'у' => 'u', 'Ũ' => 'u', 'ũ' => 'u', 'Ư' => 'u', 'ư' => 'u', 'Ū' => 'u', 'Ǔ' => 'u', 'ų' => 'u', 'Ų' => 'u', 'ŭ' => 'u', 'Ŭ' => 'u', 'Ů' => 'u', 'ů' => 'u', 'ű' => 'u', 'Ű' => 'u', 'Ǖ' => 'u', 'ǔ' => 'u', 'Ǜ' => 'u', 'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'У' => 'u', 'ǚ' => 'u', 'ǜ' => 'u', 'Ǚ' => 'u', 'Ǘ' => 'u', 'ǖ' => 'u', 'ǘ' => 'u', 'ü' => 'ue',
                'в' => 'v', 'ו' => 'v', 'В' => 'v',
                'ש' => 'w', 'ŵ' => 'w', 'Ŵ' => 'w',
                'ы' => 'y', 'ŷ' => 'y', 'ý' => 'y', 'ÿ' => 'y', 'Ÿ' => 'y', 'Ŷ' => 'y',
                'Ы' => 'y', 'ž' => 'z', 'З' => 'z', 'з' => 'z', 'ź' => 'z', 'ז' => 'z', 'ż' => 'z', 'ſ' => 'z', 'Ж' => 'zh', 'ж' => 'zh'
            );
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

            foreach ($words as $value){
                $value = preg_replace($regex, '$1', $value);
                $value = strtolower($value);
                if (strlen($value) > 3 && is_numeric($value)==false) {
                    if ($totalwords < floor($size*0.20)) //we define the weight of word trough the text
                        $weight = 20;
                    elseif ($totalwords > floor($size*80))
                        $weight = 20;
                    else
                        $weight = 3;
                    if(!($keywords[$value]) || substr($value, -1) == "s"){ //if the word is not in our table
                        if (substr($value, -1) == "s") { //we check if it's a plural
                            $maybesinglar = substr($value, 0, strlen($value) - 1);
                            if ($keywords[$maybesinglar]) { // we check if their is already a singular for this word
                                $keywords[$maybesinglar] += $weight+max(strlen($maybesinglar)-4,0)*2; //if we find a singular we add the singular version of the word instead of the plural
                            }
                            else { // if not we add the new words or it's the first time we saw the word so we need to add it
                                $keywords[$value] = $weight +max(strlen($value)-4,0)*2;
                            }
                        }
                        else {
                            $keywords[$value] = $weight+max(strlen($value)-4,0)*2; // we add the new word which is not a plural or it the first time we saw it
                        }
                    }
                    else{ //if the word is in the table
                        $keywords[$value] += $weight+max(strlen($value)-4,0)*2; // we adjust his weight in the table
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
                    "word" => $key,
                    "score" => $keywords_raw[$key]
                );
            }

            $entity->setContentKeywords($keywords_score);

        }catch(\Exception $e){

        }
    }

    public function generateImagePreview($filename, $file, $path, $entity=null, $isText = false, $isOffice = false)
    {
        $filepath = $path . "/" . $filename;
        $width = $this->img_width;
        $height = $this->img_height;
        $im = new \Imagick();


        if ($isText) {
            $im->readimage($file . "[0]");
            $this->set_keyword($file,$entity);
        }elseif ($isOffice){
            $file = $this->convertToPDF($file);
            $im->readimage($file . "[0]");
            $this->set_keyword($file,$entity);
        }else{
            $im->readimage($file);
        }

        $im = $this->autorotate($im);

        // get the current image dimensions
        $im->ThumbnailImage($width, $height, true);
        $geo = $im->getImageGeometry();


        $canvas = new \Imagick();
        $canvas->newImage($width, $height, 'white', 'png');
        $offsetX = (int)($width / 2) - (int)($geo['width'] / 2);
        $offsetY = (int)($height / 2) - (int)($geo['height'] / 2);
        $canvas->compositeImage($im, \Imagick::COMPOSITE_OVER, $offsetX, $offsetY);

        $im = $canvas;

        // thumbnail the image

        $im->setImageFormat('png');
        $im->writeImage($filepath.'.png');

        $im->clear();
        $im->destroy();

        if ($isOffice){
            unlink($file);
        }

    }

    public function convertToPDF($filepath){
        putenv("PATH=/sbin:/bin:/usr/sbin:/usr/bin");
        shell_exec("unoconv -vvvv -f pdf -e PageRange=1-1 " . $filepath);
        $a = explode(".",$filepath);
        array_pop($a);
        $filepath = join(".",$a).".pdf";
        return $filepath;
    }

}
