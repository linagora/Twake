<?php

namespace WebsiteApi\UploadBundle\Services;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\UploadBundle\Entity\File;

class Uploader extends Controller
{

	var $doctrine;
	var $uploadService;
	var $modifiersService;

	function __construct($doctrine, $uploadService, $modifiersService){
		$this->doctrine = $doctrine;
		$this->uploadService = $uploadService;
		$this->modifiersService = $modifiersService;
	}

	/**
	 * Upload a file
	 * $file = $_FILE["aa"];
	 * $context = "prfl"/"covr"
	 *
	 * returns :
	 * Array of results
	 */
    public function uploadFiles($currentUser, $file, $context)
    {

	    $res = Array();

	    if(!is_array($file["tmp_name"])){
		    $res[] = $this->uploadTheFile($currentUser, $file, $context);
	    }else {

		    foreach ($file["tmp_name"] as $key => $null) {
			    $file = Array();
			    $file["tmp_name"] = $file["tmp_name"][$key];
			    $file["name"] = $file["name"][$key];
			    $file["size"] = $file["size"][$key];
			    $res[] = $this->uploadTheFile($currentUser, $file, $context);
		    }
	    }

        return $res;

    }

	public function getContexts(){
		return Array(
			"prfl"=>Array(
				"is_img"=>1,
				"max_size" => 2000000, //2mo
				"sizes"=>31, //All !
				"allowed_ext"=>Array("png","jpg","jpeg","gif","tiff")
			),
			"covr"=>Array(
				"is_img"=>1,
				"max_size" => 3000000, //3mo
				"min_width"=>900,
				"min_height"=>230,
				"sizes"=>31, //All !
				"allowed_ext"=>Array("png","jpg","jpeg","gif","tiff")
			),
			"logo"=>Array(
				"is_img"=>1,
				"max_size" => 2000000, //2mo
				"min_width"=>256,
				"min_height"=>256,
				"sizes"=>31, //All !
				"allowed_ext"=>Array("png","jpg","jpeg","gif","tiff")
			),
			"msg"=>Array(
				"is_img"=>0,
				"max_size" => 10000000, //10mo
				"sizes"=>31
			),
			"status"=>Array(
				"is_img"=>0,
				"max_size" => 3000000, //3mo
			)
		);
	}


	/**
	 * Upload file into disk and add it to bdd (using context != drive)
	 * @param $file
	 * @return File
	 */
	private function uploadTheFile($currentUser, $realfile, $context){

		if($currentUser == null or $currentUser->getId()<=0){
			return Array("errors"=>Array("error_not_connected"), "file"=>null, "realfile"=>$realfile);
		}

		/**
		 * Allowed context
		 */

		$contexts = $this->getContexts();

		if(!isset($contexts[$context])){
			return Array("errors"=>Array("error_not_such_context"), "file"=>null, "realfile"=>$realfile);
		}


		$orm = $this->doctrine;

		$file = new File();

		$file->setType($context);
		$file->setOwner($currentUser);


		$newfilename = md5(date("U").$realfile["tmp_name"].$realfile["name"]).".".$this->getExtension($realfile["name"]);
		$file->setName($newfilename);
		$file->setRealName($realfile["name"]);
		$file->setSizes($contexts[$context]['sizes']);


		$this->uploadService->setImageModifiers($this->modifiersService);

		$upload_status = $this->uploadService->upload($realfile, $file->getLocalServerURL(0), $contexts[$context]); //Upload original

		$file->setWeight($upload_status['filesize']);

		if($upload_status["status"] == "success") {

			//Ajouter les thumbnails !
			if ($contexts[$context]['is_img']) {
				$sizes = Array(0,512,256,128,64);
				for($size=1;$size<=4;$size++) {
					if(decbin($file->getSizes())[$size]==1) {
						$this->uploadService->addThumbnail($file->getLocalServerURL(0), $sizes[$size], $file->getLocalServerURL($size)); //Upload thumbnails
					}
				}
			}

			$orm->persist($file);
			$orm->flush();

			$upload_status["fileEntity"] = $file;

			return Array("errors"=>$upload_status["errors"], "file"=>$upload_status["fileEntity"], "realfile"=>$realfile);

		}else {

			return Array("errors"=>$upload_status["errors"], "file"=>null, "realfile"=>$realfile);

		}

	}

	private function getExtension($filename){
		return pathinfo($filename, PATHINFO_EXTENSION);
	}

}
