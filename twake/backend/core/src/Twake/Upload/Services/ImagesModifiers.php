<?php

namespace Twake\Upload\Services;

use App\App;

class ImagesModifiers
{

    /**
     * THUMBNAILS
     */

    /**
     * Supported image types
     *
     * @staticvar array
     */
    public static $__image_types = array(
        0x1 => 'gif',
        0x2 => 'jpeg',
        0x3 => 'png',
        0x6 => 'bmp'
    );

    /**
     * Allowed image types/file extensions (separate multiple values with pipe '|')
     *
     * @var string
     */
    public $allowed_image_types = 'bmp|gif|jpg|jpeg|png';

    /**
     * JPEG compression level (0-100, 0 is the most compression)
     *
     * @var int
     */
    public $compression_jpeg = 50;

    /**
     * PNG compresssion level (0-8, 8 is the most compression, 0 is none)
     *
     * @var int
     */
    public $compression_png = 8;

    /**
     * Max dimesion (this can control both width and height)
     *
     * @var int
     */
    public $max_dimension = 200;

    /**
     * Max height dimension (this will override max_dimension property)
     *
     * @var int
     */
    public $max_height = 0;

    /**
     * Max width dimension (this will override max_dimension property)
     *
     * @var int
     */
    public $max_width = 0;

    /**
     * Use true color flag
     *
     * @var bool
     */
    public $use_true_color = true;

    /**
     * Init
     */
    public function __construct(App $app)
    {
        if (!function_exists('getimagesize')) { // check for GD library
            trigger_error(__CLASS__ . ' requires the GD library', E_USER_ERROR);
        }
    }

    public function setMax_dimension($md)
    {
        $this->max_dimension = $md;
    }

    /**
     * Draw/create thumbnail image
     *
     * @param string $image_path (source image path)
     * @param string $target_path (optional, will save image instead of output if set)
     * @return void
     */
    public function draw($image_path, $target_path = null)
    {

        if (!file_exists($image_path)) // check if image exists
        {
            trigger_error('Image "' . $image_path . '" does not exist', E_USER_ERROR);
        }

        if (!preg_match('/\.(' . $this->allowed_image_types . ')$/i', $image_path)) // check valid image type
        {
            trigger_error('Invalid image type for image "' . $image_path . '"', E_USER_ERROR);
        }

        $img_info = getimagesize($image_path); // set image info
        list($img_w, $img_h, $img_type) = $img_info;
        $img_mine = null;

        if ($img_type > 0 && !isset(self::$__image_types[$img_type])) // check valid image type code
        {
            trigger_error('Invalid image type for image "' . $image_path . '" (image type code: ' . $img_type . ')');
        }

        if (isset($img_info['mime'])) {
            $img_mine = $img_info['mime'];
        } else {
            trigger_error('Invalid iamge MIME type for image "' . $image_path . '"', E_USER_ERROR);
        }

        // override max dimesion
        $this->max_dimension = $this->max_height > 0 ? $this->max_height : $this->max_dimension;
        $this->max_dimension = $this->max_width > 0 ? $this->max_width : $this->max_dimension;

        // set new dimensions
        $img_new_w = $img_new_h = 0;
        if ($this->max_width > 0 && $img_w > $this->max_width) // resize on width
        {
            $img_new_w = $this->max_width;
            $img_new_h = round($img_h * ($img_new_w / $img_w));
        } else if ($this->max_height > 0 && $img_h > $this->max_height) // resize on height
        {
            $img_new_h = $this->max_height;
            $img_new_w = round($img_w * ($img_new_h / $img_h));
        } else if ($img_w > $this->max_dimension || $img_h > $this->max_dimension) // resize on max dim
        {
            $img_new_w = $this->max_dimension;
            $img_new_h = $this->max_dimension;
            if ($img_w > $img_h) {
                $img_new_h = round($img_h * ($img_new_w / $img_w));
            } else {
                $img_new_w = round($img_w * ($img_new_h / $img_h));
            }
        }

        $fc = $this->use_true_color ? 'imagecreatetruecolor' : 'imagecreate'; // use truecolor for jpeg
        if ($img_new_w > 0 && $img_new_h > 0) // check if resize needed
        {
            $img_new = $fc($img_new_w, $img_new_h);
            $f = 'imagecreatefrom' . self::$__image_types[$img_type];

            $img = new \Imagick($image_path);
            $img = $this->autorotate($img);
            $img->writeImage();

            $img = $f($image_path);
            imagealphablending($img_new, true);
            imagesavealpha($img_new, true);
            $whiteBackground = imagecolorallocatealpha($img_new, 255, 255, 255, 0);
            imagefill($img_new,0,0,$whiteBackground); // fill the background with white
            imagecopyresampled($img_new, $img, 0, 0, 0, 0, $img_new_w, $img_new_h, $img_w, $img_h);
            imagedestroy($img);
        } else {
            $img_new = $fc($img_w, $img_h);
            $f = 'imagecreatefrom' . self::$__image_types[$img_type];
            $img_new = $f($image_path);
        }

        $f = 'image' . self::$__image_types[$img_type];
        if (strlen($target_path) < 1) // output image
        {
            header('Content-type: ' . $img_mine);
        }
        switch ($img_type) {
            case 0x2:
                $f($img_new, $target_path, $this->compression_jpeg);
                break;

            case 0x3:
                $f($img_new, $target_path, $this->compression_png);
                break;

            default:
                $f($img_new, $target_path);
                break;
        }

        imagedestroy($img_new);
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
                $image->rotateImage("#FFF", 180);
                break;
            case \Imagick::ORIENTATION_BOTTOMLEFT:
                $image->flopImage();
                $image->rotateImage("#FFF", 180);
                break;
            case \Imagick::ORIENTATION_LEFTTOP:
                $image->flopImage();
                $image->rotateImage("#FFF", -90);
                break;
            case \Imagick::ORIENTATION_RIGHTTOP:
                $image->rotateImage("#FFF", 90);
                break;
            case \Imagick::ORIENTATION_RIGHTBOTTOM:
                $image->flopImage();
                $image->rotateImage("#FFF", 90);
                break;
            case \Imagick::ORIENTATION_LEFTBOTTOM:
                $image->rotateImage("#FFF", -90);
                break;
            default: // Invalid orientation
                break;
        }
        $image->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
        return $image;
    }

    function improve($path)
    {

        if (mime_content_type($path) != "image/jpeg"
            or mime_content_type($path) != "image/tiff") {
            return;
        }

        $exif = exif_read_data($path);

        if (isset($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3:
                    $this->rotate($path, 180);
                    break;

                case 6:
                    $this->rotate($path, -90);
                    break;

                case 8:
                    $this->rotate($path, 90);
                    break;
            }
        }


    }

    /***
     * ROTATIONS (IOS)
     * @param $path
     * @param $deg
     */


    function rotate($path, $deg)
    {
        if (exif_imagetype($path) == IMAGETYPE_JPEG) {
            $source = imagecreatefromjpeg($path);
            $rotate = imagerotate($source, $deg, 0);
            imagejpeg($rotate, $path);
        }
    }

}