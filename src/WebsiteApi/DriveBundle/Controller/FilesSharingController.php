<?php

namespace WebsiteApi\DriveBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class FilesSharingController extends Controller
{

	public function shareAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);


		return new JsonResponse($data);

	}

}
