<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;
use WebsiteApi\DriveUploadBundle\Entity\UploadState;

class Adapter_AWS implements AdapterInterface{

    public function __construct($aws_config)
    {

        $s3_config = $aws_config["S3"];
        $this->aws_version = $s3_config["version"];
        $this->aws_buckets = $s3_config["buckets"];
        $this->aws_buckets_prefix = isset($s3_config["buckets_prefix"]) ? $s3_config["buckets_prefix"] : "";
        $this->aws_credentials_key = $s3_config["credentials"]["key"];
        $this->aws_credentials_secret = $s3_config["credentials"]["secret"];

        $region = false;
        foreach ($this->aws_buckets ? $this->aws_buckets : [] as $region_code => $aws_region) {
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

    public function read($chunkFile, $chunkNo, $param_bag, UploadState $uploadState)
    {

        $key = "AWS" . $param_bag->getSalt() . $param_bag->getKey();
        $key = md5($key);

        try {

            $object = $this->aws_s3_client->getObject([
                'Bucket' => $this->aws_bucket_name,
                'Key' => "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo,
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

    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState)
    {

        $key = "AWS" . $param_bag->getSalt() . $param_bag->getKey();
        $key = md5($key);

        $file_path = "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;

        try {

            $data = [
                'Bucket' => $this->aws_bucket_name,
                'Key' => $file_path,
                'Body' => "",
                'ACL' => 'private',
                'SSECustomerAlgorithm' => 'AES256',
                'SSECustomerKey' => $key,
                'SSECustomerKeyMD5' => md5($key, true)
            ];

            // Upload data.
            $result = $this->aws_s3_client->putObject($data);
            $this->aws_s3_client->registerStreamWrapper();

            $hDest = fopen('s3://' . $this->aws_bucket_name . '/' . $file_path, 'w');

            $hSource = fopen($chunkFile, 'r');
            $hDest = fopen(UPLOADS_DIR . '/' . $MyTempName . '.tmp', 'w');
            while (!feof($hSource)) {
                /*
                 *  I'm going to read in 1K chunks. You could make this
                 *  larger, but as a rule of thumb I'd keep it to 1/4 of
                 *  your php memory_limit.
                 */
                $chunk = fread($hSource, 1024);
                fwrite($hDest, $chunk);
            }
            fclose($hSource);
            fclose($hDest);


//            @unlink($chunkFile);

        } catch (S3Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

        return $result;

    }

    public function streamModeIsAvailable()
    {
        return true;
    }

}