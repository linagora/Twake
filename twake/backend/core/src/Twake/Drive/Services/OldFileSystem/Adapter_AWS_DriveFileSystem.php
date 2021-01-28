<?php


namespace Twake\Drive\Services\OldFileSystem;

use App\App;
use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;

class Adapter_AWS_DriveFileSystem
{

    public function __construct(App $app)
    {
        $this->configure($app, $app->getContainer()->getParameter("storage.S3"));
    }

    public function configure(App $app, $config){
        $aws_config = $config;
        $s3_config = $aws_config;

        $this->root = $this->local = $app->getAppRootDir();
        $this->parameter_drive_salt = $app->getContainer()->getParameter("storage.drive_salt");

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
        $this->aws_bucket_name = isset($s3_config["bucket_name"]) ? $s3_config["bucket_name"] : ($this->aws_buckets_prefix . 'twake.' . $region);
        $this->aws_bucket_region = $region;

        $options = [
            'version' => $this->aws_version,
            'region' => $this->aws_bucket_region,
            'use_path_style_endpoint' => isset($s3_config["use_path_style_endpoint"]) ? $s3_config["use_path_style_endpoint"] : false,
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

            $tmpPath = "/tmp/" . bin2hex(random_bytes(16));
            $this->verifyPath($tmpPath);
            file_put_contents($tmpPath, $object["Body"]);

            return $tmpPath;

        } catch (S3Exception $e) {
            error_log("Error accessing aws file.");
        }

        return false;
    }

    public function getRoot()
    {
        return dirname($this->root) . "/" . "drive" . "/";
    }

    public function verifyPath($path)
    {
        if (strpos($path, "/tmp") !== false) {
            $path = dirname($path);
            if (!file_exists($path, null)) {
                mkdir($path, 0777, true);
            }
        }
    }
}
