<?php

namespace WebsiteApi\DriveUploadBundle\Services;


use http\Client\Response;
use WebsiteApi\DriveUploadBundle\Services\ZipStream\Stream;
use WebsiteApi\DriveUploadBundle\Services\ZipStream\ZipStream;
use WebsiteApi\DriveUploadBundle\Services\ZipStream\Option\Archive;


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


    public function zipDownload($workspace_id, $files_ids, $download, $versionId, $oldFileSystem = null){

        # enable output of HTTP headers
        $options = new Archive();
        $options->setSendHttpHeaders(true);

        # create a new zipstream object
        $zip = new ZipStream('example.zip', $options);

//        # add a file named 'goodbye.txt' from an open stream resource
//        $fp = tmpfile();
//        fwrite($fp, 'The quick brown fox jumped over the lazy dog.');
//        rewind($fp);
        //$zip->addFileFromStream('goodbye.txt', $fp);

        //$stream = new Stream($fp);
        //$zip->addFileFromPsr7Stream('goodbye.txt', $stream);


        if (!is_array($files_ids)) {
            $files_ids = [$files_ids];
        }

        $this->oldFileSystem = $oldFileSystem;
        $this->download = $download;
        $this->versionId = $versionId;
        $this->workspace_id = $workspace_id;

        $zip = null;
        # enable output of HTTP headers
        $options = new Archive();
        $options->setSendHttpHeaders(true);
        # create a new zipstream object
        $zip = new ZipStream('example.zip', $options);


        $this->downloadList($files_ids, $zip, "/");

        # finish the zip stream
        //error_log("passage");
        $zip->finish();

    }

    public function addOneFile($file, $version, &$zip = null, $zip_prefix = null)
    {
        $oldFileSystem = $this->oldFileSystem;
        if (!$version) {
            error_log("no version found");
            return false;
        }
        if (isset($version->getData()["identifier"]) && isset($version->getData()["upload_mode"]) && $version->getData()["upload_mode"] == "chunk") {
            $this->resumable->downloadFile($version->getData()["identifier"],$file->getName(), $zip, $zip_prefix);
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
                $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file));
            }
            if ($file->getWorkspaceId() != $workspace_id && !$file->getDetachedFile()) {
                continue;
            }

            if ($file) {
                $download_name = $file->getName();
                $ext = $file->getExtension();

//                error_log(print_r("son id : " . $file->getId()."", true));
//                error_log(print_r("son name : " . $file->getName(), true));

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


                    if (!isset($zip) || !isset($zip_prefix)) {
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

                if(isset($zip_prefix)) {
                    if ($file->getIsDirectory()){
                        if($zip_prefix == "/"){
                            $zip_prefix = $zip_prefix . $file->getName();
                        }
                        else{
                            $zip_prefix = $zip_prefix . DIRECTORY_SEPARATOR . $file->getName();
                        }
                        // error_log(print_r($file->getId()."", true));
                        //error_log($file->getName());

                        $files_son = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $file->getWorkspaceId(), "parent_id" => $file->getId()));
                        foreach ($files_son as $son) {
//                            error_log(print_r("son id : " . $son->getId()."", true));
//                            error_log(print_r($zip_prefix, true));
//                            error_log(print_r("son name : " . $son->getName(), true));
                            $this->downloadList(Array($son->getId().""), $zip, $zip_prefix);
                            //error_log("fin un fils");
                        }
                    }
                    else{
                        //error_log(print_r("solo file id: " . $file->getId()."",true));
                        $this->addOneFile($file, $version,$zip, $zip_prefix);
                    }
                }
            }
        }
    }

    public function download($workspace_id, $files_ids, $download, $versionId, $oldFileSystem = null)
    {

//        error_log(print_r($workspace_id,true));
//        error_log(print_r($files_ids,true));
////        error_log(print_r($download,true));
////        error_log(print_r($versionId,true));
//
//        $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $files_ids));
//        error_log(print_r($file->getAsArray(),true));

        //TODO verify access to this file

        if (!is_array($files_ids)) {
            $files_ids = [$files_ids];
        }

        $this->oldFileSystem = $oldFileSystem;
        $this->download = $download;
        $this->versionId = $versionId;
        $this->workspace_id = $workspace_id;

        $this->downloadList($files_ids);

        die();
        return true;

    }
}
