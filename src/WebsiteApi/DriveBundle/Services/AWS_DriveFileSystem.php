<?php


namespace WebsiteApi\DriveBundle\Services;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class AWS_DriveFileSystem extends DriveFileSystem
{

    public function __construct($aws_config, $doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities)
    {
        parent::__construct($doctrine, $rootDirectory, $labelsService, $parameter_drive_salt, $pricing, $preview, $pusher, $applicationService, $userToNotifyService, $translate, $workspacesApps, $workspacesActivities);

        $s3_config = $aws_config["S3"];
        $this->aws_version = $s3_config["version"];
        $this->aws_buckets = $s3_config["buckets"];
        $this->aws_credentials_key = $s3_config["credentials"]["key"];
        $this->aws_credentials_secret = $s3_config["credentials"]["secret"];

        $region = false;
        foreach ($this->aws_buckets as $region_code => $aws_region) {
            if ($region_code == "fr" || !$region) {
                $region = $aws_region;
            }
        }
        $this->aws_bucket_name = 'twake.' . $region;
        $this->aws_bucket_region = $region;

        $this->aws_s3_client = new S3Client([
            'version' => $this->aws_version,
            'region' => $this->aws_bucket_region,
            'credentials' => [
                'key' => $this->aws_credentials_key,
                'secret' => $this->aws_credentials_secret
            ]
        ]);

    }

    public function encode($path, $key, $mode = null)
    {

        $key = "AWS" . $this->parameter_drive_salt;
        $key = md5($key);

        $key_path = str_replace($this->getRoot(), "", $path);

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

    public function decode($path, $key, $mode = null)
    {

        $key = "AWS" . $this->parameter_drive_salt;
        $key = md5($key);

        $key_path = str_replace($this->getRoot(), "", $path);

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
        $real = $this->getRoot() . $file->getPreviewPath();
        if (file_exists($real)) {
            unlink($real);
        }
    }

    public function verifyPath($path)
    {
        if (strpos($path, "/tmp") !== false) {
            parent::verifyPath($path);
        }
    }

    protected function file_exists($path, $file)
    {
        return true;
    }

    protected function filesize($path, $file)
    {
        return 10;
    }

}
