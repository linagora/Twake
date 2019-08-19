<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;


class DownloadFile
{
    private $resumable;
    private $doctrine;
    private $download;
    private $versionId;
    private $oldFileSystem;
    private $workspace_id;

    public function __construct($resumable, $doctrine)
    {
        $this->resumable = $resumable;
        $this->doctrine = $doctrine;
    }

    public function addOneFile($file, $version)
    {
        $oldFileSystem = $this->oldFileSystem;
        if (!$version) {
            error_log("no version found");
            return false;
        }
        if (isset($version->getData()["identifier"]) && isset($version->getData()["upload_mode"]) && $version->getData()["upload_mode"] == "chunk") {
            $this->resumable->downloadFile($version->getData()["identifier"]);
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

    public function downloadList($files, $zip_prefix = false)
    {

        $download = $this->download;
        $versionId = $this->versionId;
        $workspace_id = $this->workspace_id;

        $first_element = true;
        foreach ($files as $file) {

            if (is_string($file)) {
                $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file));
            }
            if ($file->getWorkspaceId() != $workspace_id && !$file->getDetachedFile()) {
                continue;
            }

            if ($file) {

                $download_name = $file->getName();
                $ext = $file->getExtension();

                $version = null;
                if ($versionId != 0) {
                    $version = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileVersion")->find($versionId);
                    if ($version->getFileId() != $file->getId()) {
                        continue;
                    }

                    $download_name = date("Y-m-d_h:i", $version->getDateAdded()->getTimestamp()) . "_" . $version->getFileName();
                } else {
                    $version = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileVersion")->find($file->getLastVersionId());
                }

                if ($first_element) {
                    $first_element = false;

                    if (count($files_ids) > 1) {
                        $final_download_name = "Documents.zip";
                        $final_download_size = 0;
                    } else {
                        $final_download_name = $download_name;
                        $final_download_size = $file->getSize();
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

                $this->addOneFile($file, $version);

            }

        }

    }

    public function download($workspace_id, $files_ids, $download, $versionId, $oldFileSystem = null)
    {

        //TODO verify access to this file

        if (!is_array($files_ids)) {
            $files_ids = [$files_ids];
        }

        $this->oldFileSystem = $oldFileSystem;
        $this->download = $download;
        $this->versionId = $versionId;
        $this->workspace_id = $workspace_id;

        $this->downloadList($files_ids, false);

        die();
        return true;

    }
}
