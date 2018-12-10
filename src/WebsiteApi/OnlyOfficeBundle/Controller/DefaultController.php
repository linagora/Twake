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
                $color = "aa5252";
                $defaultExtension = ".pptx";
                $apikey = $this->APIPUBLICKEY_SLIDE;
                break;
            case "spreadsheet":
                $mode = "spreadsheet";
                $name = "Spreadsheet";
                $color = "40865c";
                $defaultExtension = ".xlsx";
                $apikey = $this->APIPUBLICKEY_SPREADSHEET;
                break;
            default:
                $mode = "text";
                $name = "Document";
                $color = "446995";
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
        $workspaceId = $request->query->get("workspaceId", 0);

        if ($user != null) {

            $data = Array();
            $data["userid"] = $user->getId();
            $data["username"] = $user->getUsername();
            $data["language"] = $user->getLanguage();
            $data["userimage"] = ($user->getThumbnail() == null) ? null : $user->getThumbnail()->getPublicURL(2);
            $data["mode"] = $parameters["mode"];
            $data["onlyoffice_server"] = $this->getParameter('ONLYOFFICE_SERVER');
            $data["defaultExtension"] = $parameters["defaultExtension"];
            $data["color"] = $parameters["color"];
            $data["modeName"] = $parameters["name"];
            $data["workspaceId"] = $workspaceId;
            $data["server"] = $this->getParameter('SERVER_NAME') . "/";

            return $this->render('TwakeOnlyOfficeBundle:Default:index.html.twig', $data);

        }

        return $this->render('TwakeOnlyOfficeBundle:Default:error.html.twig', Array());

    }

    /**
     * Save / open files
     */
    public function saveAction(Request $request, $mode)
    {

        $fToken = $request->query->get("token");
        $request = json_decode($request->getContent(), true);

        if ($request["status"] == "2") {

            $key = $request["key"];
            $document = $request["url"];

            $em = $this->get("app.twake_doctrine");

            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFileKeys");
            $fileKey = $repo->findOneBy(Array("key" => $key));

            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFile");

            if ($fileKey != null) {

                /** @var OnlyofficeFile $file */
                $file = $repo->findOneBy(Array("fileid" => $fileKey->getFileId(), "token" => $fToken));

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

                    $url = $document;
                    //IMPORTANT ! Disable local files !!!
                    if (strpos($url, "http://") !== false) {
                        $url = "http://" . str_replace("http://", "", $url);
                    } else {
                        $url = "https://" . str_replace("https://", "", $url);
                    }

                    if (!$url || !$this->get("app.drive.adapter_selector")->getFileSystem()->canAccessTo($fileKey->getFileId(), $file->getWorkspaceId(), null)) {

                        return new JsonResponse(Array("error" => 1));

                    } else {

                        $content = file_get_contents($url);
                        $this->get("app.drive.adapter_selector")->getFileSystem()->setRawContent($fileKey->getFileId(), $content);

                        if ($newName != $oldFilename) {
                            $this->get("app.drive.adapter_selector")->getFileSystem()->rename($fileKey->getFileId(), $newName);
                        }

                    }

                }

            }

        }

        return new JsonResponse(Array("error" => 0));
    }

    public function openAction(Request $request, $mode)
    {

        $user = $this->getUser();
        $workspaceId = $request->request->get("workspaceId", 0);

        if ($user != null) {

            $fId = $request->request->get("fileId", 0);
            $filename = $request->request->get("filename", 0);
            $em = $this->get("app.twake_doctrine");

            $file = new OnlyofficeFile($workspaceId, $fId);
            $em->persist($file);


            $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFileKeys");
            $fileKey = $repo->findOneBy(Array("fileid" => $fId));

            if (!$fileKey) {
                $fileKey = new OnlyofficeFileKeys($workspaceId, $fId);
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

    public function readAction(Request $request, $mode)
    {

        $this->getParametersForMode($mode);

        $fToken = $request->query->get("fileToken", null);
        $fId = $request->query->get("fileId", 0);

        $em = $this->get("app.twake_doctrine");
        $repo = $em->getRepository("TwakeOnlyOfficeBundle:OnlyofficeFile");

        /** @var OnlyofficeFile $file */
        $file = $repo->findOneBy(Array("fileid" => $fId, "token" => $fToken));

        if ($file != null) {

            if ($file->getDate()->getTimestamp() > (new \DateTime())->getTimestamp() - 60 * 60) {

                $file->resetDate();
                $em->persist($file);
                $em->flush();

                $response = new Response();
                $disposition = $response->headers->makeDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, "file");
                $response->headers->set('Content-Disposition', $disposition);
                $response->sendHeaders();

                $this->get("app.drive.adapter_selector")->getFileSystem()->download($file->getWorkspaceId(), $file->getFileId(), false);
                die();


            }

            $em->remove($file);
            $em->flush();

        }

        return new Response();

    }


}
