<?php

namespace Twake\Drive\Services;

use http\Client\Response;
use Twake\Drive\Services\Storage\EncryptionBag;
use Twake\Drive\Services\ZipStream\Option\Archive;
use Twake\Drive\Services\ZipStream\TwakeFileStream;
use Twake\Drive\Services\ZipStream\ZipStream;
use App\App;

class DownloadFile
{
    private $resumable;
    private $doctrine;
    private $download;
    private $versionId;
    private $oldFileSystem;
    private $workspace_id;
    private $storagemanager;
    private $parameter_drive_salt;

    public function __construct(App $app)
    {
        $this->resumable = $app->getServices()->get("driveupload.resumable");
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->storagemanager = $app->getServices()->get("driveupload.storemanager");
        $this->parameter_drive_salt = $app->getContainer()->getParameter("storage.drive_salt");
        $this->oldFileSystem = $app->getServices()->get("app.drive.old.adapter_selector")->getFileSystem();
    }

    public function download($workspace_id, $files_ids, $download, $versionId)
    {

        //TODO verify access to this file

        if (!is_array($files_ids)) {
            $files_ids = [$files_ids];
        }

        $zip_archive = null;
        $zip = false;

        $this->download = $download;
        $this->versionId = $versionId;
        $this->workspace_id = $workspace_id;
        $name = null;

        if (count($files_ids) > 1) {
            $zip = true;
            $name = "Document.zip";
        } elseif (count($files_ids) == 1) {
            $file = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $files_ids[0]));
            if($file){
                if ($file->getIsDirectory()) {
                    $name = $file->getName() . ".zip";
                    $zip = true;
                    $files_ids = Array();
                    $files_son = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $file->getWorkspaceId(), "parent_id" => $file->getId()));
                    foreach ($files_son as $son) {
                        $files_ids[] = $son->getId() . "";
                    }
                }
            }
        }

        if (isset($zip) && $zip) {
            //plusieurs fichiers ou un dossier, on fait un zip
            # enable output of HTTP headers
            $options = new Archive();
            $options->setSendHttpHeaders(true);
            $options->setZeroHeader(true);
            $options->setEnableZip64(false);

            # create a new zipstream object
            $zip_archive = new ZipStream($name, $options);
            //error_log(print_r($files_ids,true));
            $this->downloadList($files_ids, $zip_archive, "/");

        } else {
            //téléchargement classique
            $this->downloadList($files_ids);
        }


        if (isset($zip) && $zip) {
            //on ajoute un fichier url dans le zip

            # finish the zip stream
            $zip_archive->finish();
        }

        die();
        return true;

    }

    public function downloadList($files, &$zip = null, $zip_prefix = null)
    {
        $download = $this->download;
        $versionId = $this->versionId;
        $workspace_id = $this->workspace_id;
        $first_element = true;

        foreach ($files as $file) {

            if (!$file) {
                return false;
            }

            if (is_string($file)) {
                $file = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $file));
            }

            if ($file->getWorkspaceId() != $workspace_id && !$file->getDetachedFile()) {
                continue;
            }

            if ($file) {
                $download_name = $file->getName();
                $ext = $file->getExtension();

                $version = null;

                if ($file->getUrl()) {

                    $version = null;

                } else if (isset($versionId) && $versionId && strlen($versionId) > 10 && $versionId != $file->getLastVersionId()) {

                    $version = $this->doctrine->getRepository("Twake\Drive:DriveFileVersion")->find($versionId);

                    if (!$version || $version->getFileId() != $file->getId()) {
                        continue;
                    }

                    $download_name = date("Y-m-d_h:i", $version->getDateAdded()->getTimestamp()) . "_" . $version->getFileName();
                } else {

                    $version = $this->doctrine->getRepository("Twake\Drive:DriveFileVersion")->find($file->getLastVersionId());
                }

                if ($first_element) {

                    $first_element = false;

                    if (!isset($zip) || !isset($zip_prefix)) {

                        $final_download_name = $download_name;
                        if ($version) {
                            $final_download_size = $version->getSize();
                        } else {
                            $final_download_size = 0;
                        }

                        header('Content-Description: File Transfer');
                        if ($download) {
                            header('Content-Type: application/octet-stream');
                            header("Content-type: application/force-download");
                            header('Content-Disposition: attachment; filename="' . $final_download_name . '"');
                        } else {
                            header('Content-Disposition: inline; filename="' . $final_download_name . '"');

                            if (in_array($ext, ["gif", "svg", "jpeg", "jpg", "tiff", "png"])) {
                                header('Content-Type: image; filename="' . $final_download_name . '"');
                            }
                            if ($ext == "pdf") {
                                header("Content-type: application/pdf");
                            }

                        }

                        header('Expires: 0');
                        header('Cache-Control: must-revalidate');
                        header('Pragma: public');
                        header('Content-Length: ' . $final_download_size);

                        if (isset($_SERVER['HTTP_ORIGIN'])) {
                            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
                        }
                        header('Access-Control-Allow-Credentials: true');

                    }
                }

                if (isset($zip_prefix)) {
                    if ($file->getIsDirectory()) {
                        if ($zip_prefix == "/") {
                            $next_zip_prefix = $zip_prefix . $file->getName();
                        } else {
                            $next_zip_prefix = $zip_prefix . DIRECTORY_SEPARATOR . $file->getName();
                        }

                        $files_son = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $file->getWorkspaceId(), "parent_id" => $file->getId()));
                        foreach ($files_son as $son) {

                            $this->downloadList(Array($son->getId() . ""), $zip, $next_zip_prefix);
                        }
                    } else {
                        $this->addOneFile($file, $version, $zip, $zip_prefix);
                    }
                } else {
                    $this->addOneFile($file, $version);
                }
            }
        }
    }

    public function addOneFile($file, $version, &$zip = null, $zip_prefix = null)
    {
        $oldFileSystem = $this->oldFileSystem;
        if (!$version && !$file->getUrl()) {
            error_log("no version found");
            return false;
        }
        if (!$version && $file->getUrl()) {
            $url = $file->getUrl();
            if (isset($url)) {
                //on ajoute un fichier url dans le zip
                $zip->addFile($file->getName() . ".url", "[InternetShortcut]" . "\n" . "URL=" . $url);
            }
            return true;
        }
        if (isset($version->getData()["identifier"]) && isset($version->getData()["upload_mode"]) && $version->getData()["upload_mode"] == "chunk") {
            $this->downloadFile($version->getData()["identifier"], $file->getName(), $zip, $zip_prefix);
            return true;
        } else {
            if ($oldFileSystem) {
                $completePath = $oldFileSystem->getRoot() . $file->getPath();

                //START - Woodpecker files import !
                $test_old_version = explode("/previews/", $file->getPreviewLink());
                if (count($test_old_version) == 2) {
                    $test_old_version = explode("/", $test_old_version[1]);
                    if ($test_old_version[0] == "detached") {
                        $test_old_version[0] = $test_old_version[1];
                    }
                    if (intval($test_old_version[0]) . "" == $test_old_version[0]) {
                        $completePath = $oldFileSystem->getRoot() . str_replace(Array("https://s3.eu-west-3.amazonaws.com/twake.eu-west-3/public/uploads/previews/", ".png"), "", $file->getPreviewLink());
                    }
                }
                //END - Woodpecker files import !

                $completePath = $oldFileSystem->decode($completePath, $version->getKey(), $version->getMode());
                $fp = fopen($completePath, "r");
                ob_clean();
                flush();
                while (!feof($fp)) {
                    $buff = fread($fp, 1024);
                    print $buff;
                }
                //Delete decoded file
                @unlink($completePath);
                return true;
            }
        }
        return false;
    }

    public function downloadFile($identifier, $name, &$zip = null, $zip_prefix = null)
    {
        $uploadstate = $this->doctrine->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $identifier));
        if ($uploadstate->getEncryptionMode() == "OpenSSL-2") {
            $param_bag = new EncryptionBag($uploadstate->getEncryptionKey(), $uploadstate->getEncryptionSalt(), $uploadstate->getEncryptionMode());
        } else {
            //Old resumable with drive salt
            $param_bag = new EncryptionBag($uploadstate->getEncryptionKey(), $this->parameter_drive_salt, "OpenSSL-2");
        }
        if (isset($uploadstate)) {
            if (isset($zip_prefix) && isset($zip)) {
                $stream_zip = new TwakeFileStream($this->storagemanager->getAdapter(), $param_bag, $uploadstate);
                $zip->addFileFromPsr7Stream($zip_prefix . DIRECTORY_SEPARATOR . $name, $stream_zip);
            } else {
                for ($i = 1; $i <= $uploadstate->getChunk(); $i++) {
                    $this->storagemanager->getAdapter()->read("stream", $i, $param_bag, $uploadstate);
                }
            }
        } else {
            $file = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findBy(Array("id" => $identifier));
            $url = $file->getUrl();
            if (isset($url)) {
                //on ajoute un fichier url dans le zip
                $zip->addFile("google.url", "[InternetShortcut]" . "\r\n" . "URL=" . $url);
            }
        }
    }
}
