<?php


namespace WebsiteApi\DriveBundle\Services;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use ZipStream\ZipStream;
use Symfony\Component\HttpFoundation\StreamedResponse;

class Adapter_AWS_DriveFileSystem extends DriveFileSystem
{

    public function __construct($aws_config, $doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities, $objectLinkSystem, $drive_previews_tmp_folder)
    {
        parent::__construct($doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities, $objectLinkSystem, $drive_previews_tmp_folder);

        $s3_config = $aws_config["S3"];
        $this->aws_version = $s3_config["version"];
        $this->aws_buckets = $s3_config["buckets"];
        $this->aws_buckets_prefix = isset($s3_config["buckets_prefix"]) ? $s3_config["buckets_prefix"] : "";
        $this->aws_credentials_key = $s3_config["credentials"]["key"];
        $this->aws_credentials_secret = $s3_config["credentials"]["secret"];

        $region = false;
        foreach ($this->aws_buckets as $region_code => $aws_region) {
            if ($region_code == "fr" || !$region) {
                $region = $aws_region;
            }
        }
        $this->aws_bucket_name = $this->aws_buckets_prefix . 'twake.' . $region;
        $this->aws_bucket_region = $region;

        $options = [
            'version' => $this->aws_version,
            'region' => $this->aws_bucket_region,
            'credentials' => [
                'key' => $this->aws_credentials_key,
                'secret' => $this->aws_credentials_secret
            ]
        ];
        if (isset($s3_config["base_url"]) && $s3_config["base_url"]) {
            $options["endpoint"] = $s3_config["base_url"];
        }

        $this->aws_s3_client = new S3Client($options);
    }

    public function encode($path, $key, $mode = null)
    {

        $key = "AWS" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $data = [
                'Bucket' => $this->aws_bucket_name,
                'Key' => "drive/" . $key_path,
                'Body' => fopen($path, 'rb'),
                'ACL' => 'private',
                'SSECustomerAlgorithm' => 'AES256',
                'SSECustomerKey' => $key,
                'SSECustomerKeyMD5' => md5($key, true)
            ];

            // Upload data.
            $result = $this->aws_s3_client->putObject($data);
            @unlink($path);

        } catch (S3Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

    }

    protected function writeEncode($path, $key, $content, $mode = null)
    {
        $key = "AWS" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $data = [
                'Bucket' => $this->aws_bucket_name,
                'Key' => "drive/" . $key_path,
                'Body' => $content,
                'ACL' => 'private',
                'SSECustomerAlgorithm' => 'AES256',
                'SSECustomerKey' => $key,
                'SSECustomerKeyMD5' => md5($key, true)
            ];

            // Upload data.
            $this->aws_s3_client->putObject($data);
            @unlink($path);

        } catch (S3Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }

    public function decode($path, $key, $mode = null)
    {

        $key = "AWS" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        $key_path = str_replace($this->getRoot() . "/", "", $path);
        $key_path = str_replace($this->getRoot(), "", $key_path);

        try {

            $object = $this->aws_s3_client->getObject([
                'Bucket' => $this->aws_bucket_name,
                'Key' => "drive/" . $key_path,
                'SSECustomerAlgorithm' => 'AES256',
                'SSECustomerKey' => $key,
                'SSECustomerKeyMD5' => md5($key, true)
            ]);

            $tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
            $this->verifyPath($tmpPath);
            file_put_contents($tmpPath, $object["Body"]);

            return $tmpPath;

        } catch (S3Exception $e) {
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

        if (is_array($directory)) {
            $children = $directory;
        } else
            if ($directory == null) {
                $children = $this->listDirectory($workspace->getId(), null, false);
            } else {
                $children = $this->listDirectory($workspace->getId(), $directory->getId(), false);
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
                $key = "AWS" . $this->parameter_drive_salt . $key;
                $key = md5($key);

                $data = [
                    'Bucket' => $this->aws_bucket_name,
                    'Key' => "drive/" . $key_path,
                    'SSECustomerAlgorithm' => 'AES256',
                    'SSECustomerKey' => $key,
                    'SSECustomerKeyMD5' => md5($key, true),
                    'Body' => '',
                    'ContentMD5' => false,
                    'ContentType' => 'image/png',
                    'ResponseContentDisposition' => 'attachment; filename="' . $filename . '"'
                ];

                $res = $this->aws_s3_client->getObject($data);

                $zip->addFile($prefix . $filename, $res["Body"]);

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

            $this->aws_s3_client->registerStreamWrapper();

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
            $key = "AWS" . $this->parameter_drive_salt . $key;
            $key = md5($key);

            try {
                // Get the object.
                $result = $this->aws_s3_client->getObject([
                    'Bucket' => $this->aws_bucket_name,
                    'Key' => "drive/" . $key_path,
                    'SSECustomerAlgorithm' => 'AES256',
                    'SSECustomerKey' => $key,
                    'SSECustomerKeyMD5' => md5($key, true)
                ]);

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
                header('Content-Length: ' . $result['ContentLength']);

                // Display the object in the browser.
                header("Content-Type: {$result['ContentType']}");
                echo $result['Body'];

            } catch (S3Exception $e) {
                echo $e->getMessage() . PHP_EOL;
            }

            exit;
            die();
        }

    }

    public function rawContent($file)
    {
        $key_path = $file->getPath();

        $key = $file->getLastVersion($this->doctrine)->getKey();
        $key = "AWS" . $this->parameter_drive_salt . $key;
        $key = md5($key);

        $result = $this->aws_s3_client->getObject([
            'Bucket' => $this->aws_bucket_name,
            'Key' => "drive/" . $key_path,
            'SSECustomerAlgorithm' => 'AES256',
            'SSECustomerKey' => $key,
            'SSECustomerKeyMD5' => md5($key, true)
        ]);

        return $result['Body'];
    }

    protected function deleteFile($file)
    {
        // Remove real file
        $key_path = $file->getPath();
        try {
            $this->aws_s3_client->deleteObject([
                'Bucket' => $this->aws_bucket_name,
                'Key' => "drive/" . $key_path,
            ]);
        } catch (S3Exception $e) {
            error_log($e->getMessage());
        }

        // Remove preview file
        try {
            $this->aws_s3_client->deleteObject([
                'Bucket' => $this->aws_bucket_name,
                'Key' => "public/uploads/previews/" . $file->getPath() . ".png",
            ]);
        } catch (S3Exception $e) {
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

        $res = false;
        if (!$file->getIsDirectory() && $file->getLastVersion($this->doctrine)) {

            $ext = $file->getExtension();

            $tmppath = $this->checkLocalFileForPreview($file);
            if (!$tmppath || !file_exists($tmppath)) {
                $tmppath = $this->decode($file->getPath(), $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());
            }

            if ($tmppath) {

                rename($tmppath, $tmppath . ".tw");
                $tmppath = $tmppath . ".tw";

                try {

                    //Remove old preview
                    if ($file->getPreviewLink()) {
                        try {
                            $this->aws_s3_client->deleteObject([
                                'Bucket' => $this->aws_bucket_name,
                                'Key' => "public/uploads/previews/" . $file->getPath() . ".png",
                            ]);
                        } catch (S3Exception $e) {
                            error_log($e->getMessage());
                        }
                    }

                    try {
                        $this->preview->generatePreview(basename($file->getPath()), $tmppath, dirname($tmppath), $ext, $file);
                    } catch (\Exception $e) {
                        //error_log($e->getMessage());
                    }
                    $previewpath = dirname($tmppath) . "/" . basename($file->getPath());

                    if (file_exists($previewpath . ".png")) {

                        try {
                            // Upload data.
                            $result = $this->aws_s3_client->putObject([
                                'Bucket' => $this->aws_bucket_name,
                                'Key' => "public/uploads/previews/" . $file->getId() . ".png",
                                'Body' => fopen($previewpath . ".png", "rb"),
                                'ACL' => 'public-read'
                            ]);

                            $file->setPreviewLink($result['ObjectURL'] . "");
                            $file->setPreviewHasBeenGenerated(true);
                            $file->setHasPreview(true);
                            $this->doctrine->persist($file);
                            $this->doctrine->flush();
                            $res = true;

                        } catch (S3Exception $e) {
                            $res = false;
                            $e->getMessage();
                        }

                        @unlink($previewpath . ".png");
                        error_log("PREVIEW GENERATED !");

                    } else {
                        $res = false;
                        error_log("FILE NOT GENERATED !");
                    }

                } catch (\Exception $e) {

                }

                @unlink($tmppath);

            }

        }
        return $res;

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
