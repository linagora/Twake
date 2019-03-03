<?php


namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\DriveBundle\Entity\DriveFile;
use ZipStream\ZipStream;
use Symfony\Component\HttpFoundation\StreamedResponse;
use OpenStack\OpenStack;
use GuzzleHttp\Psr7\Stream;
use GuzzleHttp\Psr7;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use OpenStack\Common\Transport\Utils as TransportUtils;
use OpenStack\Identity\v2\Service;

class Adapter_OpenStack_DriveFileSystem extends DriveFileSystem
{

    public function __construct($openstack_config, $doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities, $objectLinkSystem)
    {
        parent::__construct($doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities, $objectLinkSystem);

        $this->openstack_buckets = $openstack_config["buckets"];
        $this->openstack_buckets_prefix = $openstack_config["buckets_prefix"];
        $this->openstack_credentials_key = $openstack_config["user"]["id"];
        $this->openstack_credentials_secret = $openstack_config["user"]["password"];
        $this->openstack_project_id = $openstack_config["project_id"];
        $this->openstack_auth_url = $openstack_config["auth_url"];


        $httpClient = new Client([
            'base_uri' => TransportUtils::normalizeUrl($this->openstack_auth_url),
            'handler' => HandlerStack::create(),
        ]);

        $region = false;
        foreach ($this->openstack_buckets as $region_code => $openstack_region) {
            if ($region_code == "fr" || !$region) {
                if (isset($openstack_region["private"])) {
                    $region = $openstack_region["private"];
                    $public_region = $openstack_region["public"];
                } else {
                    $region = $openstack_region["public"];
                }
                $region_id = $openstack_region["region"];
            }
        }
        $this->openstack_bucket_name = $this->openstack_buckets_prefix . $region;
        $this->openstack_public_bucket_name = $this->openstack_buckets_prefix . $public_region;
        $this->openstack_bucket_region = $region;
        $this->openstack_region_id = $region_id;

        $this->openstack = new OpenStack([
            'authUrl' => $this->openstack_auth_url,
            'region' => $this->openstack_region_id,
            'tenantId' => $this->openstack_project_id,
            'username' => $this->openstack_credentials_key,
            'password' => $this->openstack_credentials_secret,
            'identityService' => Service::factory($httpClient)
        ]);

    }

    public function encode($path, $key, $mode = null)
    {

        $key = "OpenStack" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        parent::encode($path, $key, $mode);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $options = [
                'name' => "drive/" . $key_path,
                'stream' => new Stream(fopen($path, 'rb')),
            ];

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->createObject($options);

            @unlink($path);

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

    }

    protected function writeEncode($path, $key, $content, $mode = null)
    {
        $dirpath = dirname($path);
        if (!file_exists($dirpath)) {
            mkdir($dirpath, 0777, true);
        }

        if (!$content) {
            return;
        }

        $key = "OpenStack" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        file_put_contents($path, $content);
        parent::encode($path, $key, $mode);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $options = [
                'name' => "drive/" . $key_path,
                'stream' => new Stream(fopen($path, 'rb')),
            ];

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->createObject($options);

            // Upload data.
            @unlink($path);

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }

    public function decode($path, $key, $mode = null)
    {

        $key = "OpenStack" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $stream = $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject("drive/" . $key_path)
                ->download();

            $tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
            $this->verifyPath($tmpPath);
            file_put_contents($tmpPath, $stream->getContents());

            $decodedPath = parent::decode($tmpPath, $key, $mode);
            rename($decodedPath, $tmpPath);

            return $tmpPath;

        } catch (Exception $e) {
            error_log("Error accessing aws file.");
        }

        return false;
    }

    public function generateZipStream($workspace, $directory, &$zip, $prefix)
    {
        if ($prefix != "") {

            //ADD DIRECTORY
            $zip->addFile($prefix, '');

        }

        if ($directory == null) {
            $children = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
                ->listDirectory($workspace, null, false);
        } else {
            $children = $directory->getChildren();
        }

        foreach ($children as $child) {
            if ($child->getIsDirectory()) {
                $dirname = $child->getName();
                $dirname = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $dirname);
                $dirname = mb_ereg_replace("([\.]{2,})", '', $dirname);
                if ($dirname == "") {
                    $dirname = "no_name";
                }
                $this->generateZipStream($workspace, $child, $zip, $prefix . $dirname . "/");
            } else {

                //ADD FILE

                $filename = $child->getName();
                $filename = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $filename);
                $filename = mb_ereg_replace("([\.]{2,})", '', $filename);
                if ($filename == "") {
                    $filename = "no_name";
                }

                $key_path = $child->getPath();

                $key = $child->getLastVersion($this->doctrine)->getKey();
                $key = "OpenStack" . $this->parameter_drive_salt . $key;
                $key = md5($key);

                $stream = $this->openstack->objectStoreV1()
                    ->getContainer($this->openstack_bucket_name)
                    ->getObject("drive/" . $key_path)
                    ->download();

                $tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
                file_put_contents($tmpPath, $stream->getContents());
                $decodedPath = parent::decode($tmpPath, $key, $child->getLastVersion($this->doctrine)->getMode());
                rename($decodedPath, $tmpPath);

                $zip->addFile($prefix . $filename, file_get_contents($tmpPath));

                unlink($tmpPath);

                /*$command = $this->aws_s3_client->getCommand('GetObject', $data);
                $expiry = "+10 minutes";

                $signedUrl = $this->aws_s3_client->createPresignedRequest($command, $expiry)->getUri();

                // We want to fetch the file to a file pointer so we create it here
                //  and create a curl request and store the response into the file
                //  pointer.
                // After we've fetched the file we add the file to the zip file using
                //  the file pointer and then we close the curl request and the file
                //  pointer.
                // Closing the file pointer removes the file.
                $fp = tmpfile();
                $ch = curl_init($signedUrl);
                curl_setopt($ch, CURLOPT_TIMEOUT, 120);
                curl_setopt($ch, CURLOPT_FILE, $fp);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_exec($ch);
                curl_close($ch);
                $zip->addFileFromStream($prefix.$filename, $fp);
                fclose($fp);*/

            }
        }
    }

    public function download($workspace, $file, $download, $versionId = 0)
    {

        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        }
        header('Access-Control-Allow-Credentials: true');

        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        $file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

        if (!$this->isWorkspaceAllowed($workspace, $file)) {
            return false;
        }

        //Directory : download as zip
        if ($file == null || $file->getIsDirectory()) { //Directory or root

            if ($file == null) {
                $totalSize = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize($workspace);
                if ($totalSize > 1000000000) //1Go is too large
                {
                    return false;
                }
            } else if ($file->getSize() > 1000000000) //1Go is too large
            {
                return false;
            }
            $archive_name = ($file ? $file->getName() : "Documents");

            $response = new StreamedResponse(function () use ($archive_name, $workspace, $file) {
                $zip = new ZipStream($archive_name . '.zip', Array(
                    'content_type' => 'application/octet-stream'
                ));

                $this->generateZipStream($workspace, $file, $zip, "");

                $zip->finish();

            });

            return $response;

        } else {

            /* @var DriveFile $file */
            if ($versionId != 0) {
                $version = $this->convertToEntity($versionId, "TwakeDriveBundle:DriveFileVersion");
                $file->setLastVersionId($version->getId());
                $file->setName(date("Y-m-d_h:i", $version->getDateAdded()->getTimestamp()) . "_" . $version->getFileName());
            }
            $key_path = $file->getPath();

            $key = $file->getLastVersion($this->doctrine)->getKey();
            $key = "OpenStack" . $this->parameter_drive_salt . $key;
            $key = md5($key);

            try {
                // Get the object.
                $object = $this->openstack->objectStoreV1()
                    ->getContainer($this->openstack_bucket_name)
                    ->getObject("drive/" . $key_path);
                $contentType = $object->contentType;
                $contentLength = $object->contentLength;
                $stream = $object->download();

                header('Content-Description: File Transfer');
                if ($download) {
                    header('Content-Type: application/octet-stream');
                    header("Content-type: application/force-download");
                    header('Content-Disposition: attachment; filename="' . $file->getName() . '"');
                } else {
                    header('Content-Disposition: inline; filename="' . $file->getName() . '"');
                    if (in_array($ext, ["gif", "svg", "jpeg", "jpg", "tiff", "png"])) {
                        header('Content-Type: image; filename="' . $file->getName() . '"');
                    }
                    if ($ext == "pdf") {
                        header("Content-type: application/pdf");
                    }
                }

                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . $contentLength);

                // Display the object in the browser.
                header("Content-Type: {$contentType}");

                $tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
                file_put_contents($tmpPath, $stream->getContents());


                $decodedPath = parent::decode($tmpPath, $key, $file->getLastVersion($this->doctrine)->getMode());
                rename($decodedPath, $tmpPath);

                echo file_get_contents($tmpPath);

                unlink($tmpPath);

            } catch (Exception $e) {
                echo $e->getMessage() . PHP_EOL;
            }

            exit;
            die();
        }

    }

    public function rawContent($file)
    {
        $key_path = $file->getPath();

        $stream = $this->openstack->objectStoreV1()
            ->getContainer($this->openstack_bucket_name)
            ->getObject("drive/" . $key_path)
            ->download();
        $content = $stream->getContents();

        return $content;
    }

    protected function deleteFile($file)
    {
        // Remove real file
        $key_path = $file->getPath();
        try {
            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject("drive/" . $key_path)
                ->delete();
        } catch (\Exception $e) {
            error_log($e->getMessage());
        }

        // Remove preview file
        try {
            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_public_bucket_name)
                ->getObject("public/uploads/previews/" . $file->getPath() . ".png")
                ->delete();
        } catch (\Exception $e) {
            error_log($e->getMessage());
        }

    }

    public function rawPreview($file)
    {
        $link = $file->getPreviewLink();
        if (!$link) {
            return false;
        }
        return $this->read($link);
    }

    public function genPreview(DriveFile $file)
    {
        try {

            if (!$file->getIsDirectory() && $file->getLastVersion($this->doctrine)) {

                $ext = $file->getExtension();
                $tmppath = $this->decode($file->getPath(), $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());

                if ($tmppath) {

                    rename($tmppath, $tmppath . ".tw");
                    $tmppath = $tmppath . ".tw";

                    try {

                        //Remove old preview
                        if ($file->getPreviewLink()) {
                            try {
                                $this->openstack->objectStoreV1()
                                    ->getContainer($this->openstack_public_bucket_name)
                                    ->getObject("public/uploads/previews/" . $file->getPath() . ".png")
                                    ->delete();
                            } catch (Exception $e) {
                                error_log($e->getMessage());
                            }
                        }

                        $this->preview->generatePreview(basename($file->getPath()), $tmppath, dirname($tmppath), $ext);
                        $previewpath = dirname($tmppath) . "/" . basename($file->getPreviewPath());

                        if (file_exists($previewpath . ".png")) {

                            try {
                                // Upload data.
                                $options = [
                                    'name' => "public/uploads/previews/" . $file->getPreviewPath() . ".png",
                                    'stream' => new Stream(fopen($previewpath . ".png", "rb")),
                                ];
                                $result = $this->openstack->objectStoreV1()
                                    ->getContainer($this->openstack_public_bucket_name)
                                    ->createObject($options);

                                $file->setPreviewLink($result->getPublicUri());

                            } catch (Exception $e) {
                                $e->getMessage();
                            }

                            @unlink($previewpath . ".png");
                            error_log("PREVIEW GENERATED !");

                        } else {
                            error_log("FILE NOT GENERATED !");
                        }

                    } catch (\Exception $e) {

                    }

                    @unlink($tmppath);

                }

            }

        } catch (\Exception $e) {

        }

    }

    public function verifyPath($path)
    {
        if (strpos($path, "/tmp") !== false) {
            parent::verifyPath($path);
        }
    }

    protected function file_exists($path, $file = null)
    {
        return true;
    }

    protected function filesize($path, $file = null)
    {
        return 10;
    }
}
