<?php


namespace Twake\Upload\Services;

use App\App;

class Upload
{

    var $imagesModifiers;
    var $default_context;

    function __construct(App $app)
    {

        $this->default_context = Array(
            "is_img" => 1,
            "max_size" => 1000000, //1mo
            "sizes" => 3 //512 && original
        );

    }

    function setImageModifiers($imagesModifiers)
    {
        $this->imagesModifiers = $imagesModifiers;
    }

    public function upload($file, $path, $context)
    {


        error_log(json_encode($file));

        $upload_status = Array();
        $upload_status["status"] = "";
        $upload_status["errors"] = Array();

        //Forcer la création du dossier
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $upload_status["file"] = $file;

        $upload_status["filesize"] = filesize($file);

        //Create directory if doesnt exists
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        //MOVE THE FILE
        $moved = false;
        if ($upload_status["status"] != "error") {
            set_time_limit(600);
            $moved = rename($file, $path);
        }

        if ($moved) {

            //Verify that is it an image if wanted
            if (isset($context["is_img"]) && $context["is_img"] == 1) {
                $image_info = getimagesize($path);
                if ($image_info === false) {
                    $upload_status["status"] = "error";
                    $upload_status["errors"][] = "not_image";
                }

                $width = $image_info[0];
                $height = $image_info[1];

                if (isset($context["min_width"]) && $context["min_width"] > $width) {
                    $upload_status["status"] = "error";
                    $upload_status["errors"][] = "width_too_small";
                }
                if (isset($context["max_width"]) && $context["max_width"] < $width) {
                    $upload_status["status"] = "error";
                    $upload_status["errors"][] = "width_too_large";
                }
                if (isset($context["min_height"]) && $context["min_height"] > $height) {
                    $upload_status["status"] = "error";
                    $upload_status["errors"][] = "height_too_small";
                }
                if (isset($context["max_height"]) && $context["max_height"] < $height) {
                    $upload_status["status"] = "error";
                    $upload_status["errors"][] = "height_too_large";
                }

            }

        }

        if ($moved && $upload_status["status"] != "error") {

            if (isset($context["is_img"]) && $context["is_img"] == 1) {//Rectifie l'orientation des images prises avec l'appareil photo ios
                $this->imagesModifiers->improve($path);
            }

            $upload_status["status"] = "success";

        } else {

            if ($moved) {
                unlink($path);
                $upload_status["errors"][] = "unknown_error_moved";
            } else {
                $upload_status["errors"][] = "unknown_error_on_move";
            }

            $upload_status["status"] = "error";

        }

        return $upload_status;

    }

    public function verifyContext(&$upload_status, $file, $context)
    {
        if (filesize($file['tmp_name']) > $context['max_size']) {
            $upload_status["status"] = "error";
            $upload_status["errors"][] = "max_size_exeeded";
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (isset($context["allowed_ext"]) && !in_array($ext, $context["allowed_ext"])) {
            $upload_status["status"] = "error";
            $upload_status["errors"][] = "ext_not_allowed_" . $ext;
        }

    }

    public function addThumbnail($original, $size, $path)
    {

        //Forcer la création du dossier
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $this->imagesModifiers->setMax_dimension($size);
        $this->imagesModifiers->draw($original, $path);

    }

    private function getAsArraySizes($sizes)
    {
        $res = Array();

        $reallimit_sizes = Array(64, 128, 256, 512, 1000000000000);
        foreach (str_split(decbin($sizes)) as $i => $s) {
            if ($s == 1) {
                $res[] = $reallimit_sizes[$s];
            }
        }

        return $res;
    }

}
