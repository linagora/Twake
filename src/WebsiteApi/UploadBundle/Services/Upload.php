<?php


namespace WebsiteApi\UploadBundle\Services;

class Upload
{

	var $imagesModifiers;
	var $default_context;

	function __construct(){

		$this->default_context = Array(
			"is_img"=>1,
			"max_size"=>1000000, //1mo
			"sizes"=>3 //512 and original
		);

	}

	function setImageModifiers($imagesModifiers){
		$this->imagesModifiers = $imagesModifiers;
	}

	private function getAsArraySizes($sizes){
		$res = Array();

		$reallimit_sizes = Array(64,128,256,512,1000000000000);
		foreach(str_split(decbin($sizes)) as $i=>$s){
			if($s==1){
				$res[] = $reallimit_sizes[$s];
			}
		}

		return $res;
	}

	public function upload($file, $path, $context){

		error_log(json_encode($file));

		$upload_status = Array();
		$upload_status["status"] = "";
		$upload_status["errors"] = Array();

		//Forcer la création du dossier
		if(!file_exists(dirname($path))) {
			mkdir(dirname($path), 0755, true);
		}

		$upload_status["file"] = $file;


		$upload_status["filesize"] = filesize($file['tmp_name']);

		if (filesize($file['tmp_name']) > $context['max_size'])
		{
			$upload_status["status"] = "error";
			$upload_status["errors"][] = "max_size_exeeded";
		}

		$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
		if (isset($context["allowed_ext"]) and !in_array($ext,$context["allowed_ext"])){
			$upload_status["status"] = "error";
			$upload_status["errors"][] = "ext_not_allowed_".$ext;
		}

		//Create directory if doesnt exists
		if(!file_exists(dirname($path))){
			mkdir(dirname($path), 0777, true);
		}

		//MOVE THE FILE
		$moved = false;
		if($upload_status["status"]!="error") {
			set_time_limit(600);
			$moved = move_uploaded_file($file["tmp_name"], $path);
		}

		if($moved) {

			//Verify that is it an image if wanted
			if (isset($context["is_img"]) and $context["is_img"] == 1) {
				$image_info = getimagesize($path);
				if ($image_info === false) {
					$upload_status["status"] = "error";
					$upload_status["errors"][] = "not_image";
				}

				$width = $image_info[0];
				$height = $image_info[1];

				if (isset($context["min_width"]) and $context["min_width"] > $width) {
					$upload_status["status"] = "error";
					$upload_status["errors"][] = "width_too_small";
				}
				if (isset($context["max_width"]) and $context["max_width"] < $width) {
					$upload_status["status"] = "error";
					$upload_status["errors"][] = "width_too_large";
				}
				if (isset($context["min_height"]) and $context["min_height"] > $height) {
					$upload_status["status"] = "error";
					$upload_status["errors"][] = "height_too_small";
				}
				if (isset($context["max_height"]) and $context["max_height"] < $height) {
					$upload_status["status"] = "error";
					$upload_status["errors"][] = "height_too_large";
				}

			}

		}

		if($moved and $upload_status["status"]!="error") {

			if(isset($context["is_img"]) and $context["is_img"] == 1) {//Rectifie l'orientation des images prises avec l'appareil photo ios
				$this->imagesModifiers->improve($path);
			}

			$upload_status["status"] = "success";

		}else{

			if($moved){
				unlink($path);
				$upload_status["errors"][] = "unknown_error_moved";
			}else{
				$upload_status["errors"][] = "unknown_error_on_move";
			}

			$upload_status["status"] = "error";

		}

		return $upload_status;

	}


	public function addThumbnail($original, $size, $path){

		//Forcer la création du dossier
		if(!file_exists(dirname($path))) {
			mkdir(dirname($path), 0755, true);
		}

		$this->imagesModifiers->setMax_dimension($size);
		$this->imagesModifiers->draw($original, $path);

	}

}