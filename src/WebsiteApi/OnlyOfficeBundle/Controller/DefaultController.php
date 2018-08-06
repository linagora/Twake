<?php

namespace WebsiteApi\OnlyOfficeBundle\Controller;

use WebsiteApi\OnlyOfficeBundle\Entity\OnlyofficeFile;
use WebsiteApi\OnlyOfficeBundle\Entity\OnlyofficeFileKeys;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;


class DefaultController extends Controller
{

    private function getParametersForMode($mode)
    {
        switch ($mode) {
            case "presentation":
            case "slide":
                $mode = "presentation";
                $name = "Presentation";
                $color = "E56442";
                $defaultExtension = ".pptx";
                $apikey = $this->APIPUBLICKEY_SLIDE;
                break;
            case "spreadsheet":
                $mode = "spreadsheet";
                $name = "Spreadsheet";
                $color = "88A761";
                $defaultExtension = ".xlsx";
                $apikey = $this->APIPUBLICKEY_SPREADSHEET;
                break;
            default:
                $mode = "text";
                $name = "Document";
                $color = "5680BE";
                $defaultExtension = ".docx";
                $apikey = $this->APIPUBLICKEY_TEXT;
                break;
        }

        $this->APIPUBLICKEY = $apikey;

        return Array(
            "mode" => $mode,
            "color" => $color,
            "key" => $apikey,
            "name" => $name,
            "defaultExtension" => $defaultExtension
        );
    }

    public function editorAction(Request $request, $mode)
    {

        $parameters = $this->getParametersForMode($mode);

        $user = $this->getUser();

        if ($user != null) {

            $data = Array();
            $data["userid"] = $user->getId();
            $data["username"] = $user->getUsername();
            $data["language"] = $user->getLanguage();
            $data["userimage"] = $user->getThumbnail();
            $data["mode"] = $parameters["mode"];
            $data["onlyoffice_server"] = $this->getParameter('ONLYOFFICE_SERVER');
            $data["defaultExtension"] = $parameters["defaultExtension"];
            $data["color"] = $parameters["color"];
            $data["modeName"] = $parameters["name"];

            return $this->render('TwakeOnlyOfficeBundle:Default:index.html.twig', $data);

        }

        return $this->render('TwakeOnlyOfficeBundle:Default:error.html.twig', Array());

    }

    /**
     * Save / open files
     */

    public function saveAction(Request $request, $mode)
    {

        $this->getParametersForMode($mode);

        $fToken = $request->query->get("token");
        $request = json_decode($request->getContent(), true);

        if ($request["status"] == "2") {

            $key = $request["key"];
            $document = $request["url"];

            $em = $this->getDoctrine()->getManager();

            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFileKeys");
            $fileKey = $repo->findOneBy(Array("key" => $key));

            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFile");

            if ($fileKey != null) {

                $file = $repo->findOneBy(Array("fileId" => $fileKey->getFileId(), "token" => $fToken));

                if ($file != null) {

                    $oldFilename = $fileKey->getName();
                    $oldFileParts = explode(".", $oldFilename);
                    array_pop($oldFileParts);
                    $newExtension = array_pop(explode(".", $document));
                    $newName = join(".", $oldFileParts) . "." . $newExtension;

                    $fileKey->setName($newName);
                    $fileKey->newKey();

                    $em->persist($fileKey);
                    $em->flush();

                    $apiData = Array(
                        "fileId" => $fileKey->getFileId(),
                        "fileUrl" => $document,
                    );
                    $this->api('drive/upload', $apiData, false, $file->getGroupId());


                    if ($newName != $oldFilename) {

                        $apiData = Array(
                            "fileId" => $fileKey->getFileId(),
                            "filename" => $newName
                        );
                        $this->api('drive/move', $apiData, false, $file->getGroupId());

                    }

                }

            }

        }

        return new JsonResponse(Array("error" => 0));

    }

    public function newAction(Request $request, $mode)
    {

        $parameters = $this->getParametersForMode($mode);

        $emptyFile = $this->getParameter("servername") . "/apps/OnlyOffice/empty" . $parameters["defaultExtension"];

        $user = $this->getCurrentUser("onlyoffice." . $parameters["mode"], $parameters["key"], $this->APIPRIVATEKEY, $request);
        if ($user != null) {

            $apiData = Array(
                "directoryId" => $request->request->get("directoryId", null),
                "filename" => $request->request->get("filename", null),
                "directory" => false,
                "content" => ""
            );
            $response = $this->api('drive/create', $apiData);

            if (isset($response["data"]["fileId"])) {

                $fileId = $response["data"]["fileId"];

                $apiData = Array(
                    "fileId" => $fileId,
                    "fileUrl" => $emptyFile
                );

                $this->api('drive/upload', $apiData);

                return new JsonResponse($response);

            }
        }

        return new JsonResponse(Array("errors" => Array(1)));
    }

    public function openAction(Request $request, $mode)
    {
        $parameters = $this->getParametersForMode($mode);

        $user = $this->getCurrentUser("onlyoffice." . $parameters["mode"], $parameters["key"], $this->APIPRIVATEKEY, $request);
        if ($user != null) {

            $fId = $request->request->getInt("fileId", 0);
            $filename = $request->request->get("filename", 0);
            $em = $this->getDoctrine()->getManager();

            $file = new OnlyofficeFile($user->getApiGroupId(), $fId);
            $em->persist($file);

            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFileKeys");
            $fileKey = $repo->findOneBy(Array("fileId" => $fId));

            if (!$fileKey) {
                $fileKey = new OnlyofficeFileKeys($user->getApiGroupId(), $fId);
            }

            $fileKey->setName($filename);

            $em->persist($fileKey);
            $em->flush();

            return new JsonResponse(Array(
                "token" => $file->getToken(),
                "key" => $fileKey->getKey()
            ));

        }
        return new JsonResponse();
    }

    /**
     * @param Request $request
     * @param $mode
     * @return mixed|Response
     */
    public function readAction(Request $request, $mode)
    {

        $this->getParametersForMode($mode);

        $fToken = $request->query->get("fileToken", null);
        $fId = $request->query->getInt("fileId", 0);

        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFile");

        $file = $repo->findOneBy(Array("fileId" => $fId, "token" => $fToken));

        if ($file != null) {

            if ($file->getDate()->getTimestamp() > (new \DateTime())->getTimestamp() - 60 * 60) {

                $file->resetDate();
                $em->persist($file);
                $em->flush();

                $apiData = Array(
                    "fileId" => $file->getFileId()
                );

                $data = $this->api('drive/download', $apiData, true, $file->getGroupId());


                $response = new Response();
                $disposition = $response->headers->makeDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, "file");
                $response->headers->set('Content-Disposition', $disposition);
                $response->setContent($data);

                return $response;


            }

            $em->remove($file);
            $em->flush();

        }

        return new Response();

    }


}
