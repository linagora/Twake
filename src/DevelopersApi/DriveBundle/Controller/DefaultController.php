<?php

namespace DevelopersApi\DriveBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class DefaultController extends Controller
{

	public function downloadAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/read"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {

			$content = $this->get("app.drive.FileSystem")->getRawContent($fileId);
			if ($content === false) {
				$data["errors"][] = 3001;
			} else {

				$response = new Response();
				$disposition = $response->headers->makeDisposition(ResponseHeaderBag::DISPOSITION_INLINE, "file");
				$response->headers->set('Content-Disposition', $disposition);
				$response->setContent($content);

				return $response;

			}
		}

		return new JsonResponse($data);

	}

	public function uploadAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/write"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;
		$url = isset($requestData["fileUrl"]) ? $requestData["fileUrl"] : false;

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		//IMPORTANT ! Disable local files !!!
		if (strpos($url, "http://") !== false) {
			$url = "http://" . str_replace("http://", "", $url);
		} else {
			$url = "https://" . str_replace("https://", "", $url);
		}

		if (!$url || !$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {

			$content = file_get_contents($url);
			$this->get("app.drive.FileSystem")->setRawContent($fileId, $content);

		}

		return new JsonResponse($data);

	}

	public function readAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/read"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {

			$content = $this->get("app.drive.FileSystem")->getRawContent($fileId);
			if ($content === false) {
				$data["errors"][] = 3001;
			} else {
				$data["data"]["content"] = $content;
			}
		}

		return new JsonResponse($data);

	}

	public function saveAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/write"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;
		$content = isset($requestData["content"]) ? $requestData["content"] : "";

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {

			$file = $this->get("app.drive.FileSystem")->setRawContent($fileId, $content);
			if (!$file) {
				$data["errors"][] = 3001;
			}
		}

		return new JsonResponse($data);

	}

	public function createAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/write"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$directoryId = isset($requestData["directoryId"]) ? $requestData["directoryId"] : 0;
		$filename = isset($requestData["filename"]) ? $requestData["filename"] : 0;
		$directory = (isset($requestData["directory"]) && $requestData["directory"] == true) ? true : false;
		$content = isset($requestData["content"]) ? $requestData["content"] : "";

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$file = $this->get("app.drive.FileSystem")->create($request["workspace"], $directoryId, $filename, $content, $directory);
		if (!$file) {
			$data["errors"][] = 3001;
		} else {
			$data["data"]["filename"] = $file->getName();
			$data["data"]["fileId"] = $file->getId();
		}

		return new JsonResponse($data);

	}

	public function moveAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/write"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$directoryId = isset($requestData["directoryId"]) ? $requestData["directoryId"] : false;
		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;
		$newFilename = isset($requestData["filename"]) ? $requestData["filename"] : false;

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {
			if ($directoryId != false) {
				if (!$this->get("app.drive.FileSystem")->move($fileId, $directoryId)) {
					$data["errors"][] = 3001;
				}
			}
			if ($newFilename != false) {
				$this->get("app.drive.FileSystem")->rename($fileId, $newFilename);
			}
		}

		return new JsonResponse($data);

	}

	public function deleteAction(Request $request)
	{

		$request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("drive/write"));
		$requestData = $request["data"];
		if (isset($request["errors"])) {
			return new JsonResponse($request["errors"]);
		}

		$fileId = isset($requestData["fileId"]) ? $requestData["fileId"] : 0;

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$this->get("app.drive.FileSystem")->canAccessTo($fileId, $request["workspace"], null)) {
			$data["errors"][] = 3004;
		} else {
			if (!$this->get("app.drive.FileSystem")->delete($fileId)) {
				$data["errors"][] = 3001;
			}
		}

		return new JsonResponse($data);

	}

}
