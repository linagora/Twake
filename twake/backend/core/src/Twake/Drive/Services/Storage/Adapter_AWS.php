<?php

namespace Twake\Drive\Services\Storage;

use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Twake\Drive\Entity\DriveFile;
use Twake\Drive\Entity\UploadState;

class Adapter_AWS implements AdapterInterface
{

    public function __construct($aws_config, $preview, $doctrine)
    {

        $s3_config = $aws_config;
        $this->aws_version = $s3_config["version"];
        $this->aws_buckets = $s3_config["buckets"];
        $this->aws_buckets_prefix = isset($s3_config["buckets_prefix"]) ? $s3_config["buckets_prefix"] : "";
        $this->aws_credentials_key = $s3_config["credentials"]["key"];
        $this->aws_credentials_secret = $s3_config["credentials"]["secret"];
        $this->disable_encryption = $s3_config["disable_encryption"] ?: false;
        $this->parameter_drive_salt = $s3_config["override_drive_salt"] ?: $s3_config["default_drive_salt"];
	    $this->default_parameter_drive_salt = $s3_config["default_drive_salt"];

        $region = false;
        foreach ($this->aws_buckets ? $this->aws_buckets : [] as $region_code => $aws_region) {
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

        $this->preview = $preview;
        $this->doctrine = $doctrine;
    }


    public function genPreview(DriveFile $file, $tmppath)
    {

        $res = false;
        if (!$file->getIsDirectory() && $file->getLastVersion($this->doctrine)) {

            $ext = $file->getExtension();


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
                        //error_log("PREVIEW GENERATED !");

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

    public function read($destination, $chunkNo, $param_bag, UploadState $uploadState, &$zip = null, $zip_prefix = null)
    {

        $key = "AWS" . $param_bag->getSalt() . $param_bag->getKey();
	if($param_bag->getSalt() == $this->default_parameter_drive_salt){
        	$key = "AWS" . $this->parameter_drive_salt . $param_bag->getKey();
	}
        $key = md5($key);

        $file_path = "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;

        try {

            $options = [
                'Bucket' => $this->aws_bucket_name,
                'Key' => $file_path
            ];

            if(!$this->disable_encryption){
                $options = array_merge($options, [
                    'SSECustomerAlgorithm' => 'AES256',
                    'SSECustomerKey' => $key,
                    'SSECustomerKeyMD5' => md5($key, true)
                ]);
            }

            $object = $this->aws_s3_client->getObject($options);

            if ($destination == "stream") {
                echo $object["Body"];
                return true;
            } elseif ($destination == "original_stream") {
                $fp = tmpfile();
                fwrite($fp, $object["Body"]);
                rewind($fp);
                return $fp;
            }

            file_put_contents($destination, $object["Body"]);
            return $destination;

        } catch (S3Exception $e) {
            error_log("Error accessing aws file." . $e);
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
                'Body' => fopen($chunkFile, 'r'),
                'ACL' => 'private'
            ];

            if(!$this->disable_encryption){
                $data = array_merge($data, [
                    'SSECustomerAlgorithm' => 'AES256',
                    'SSECustomerKey' => $key,
                    'SSECustomerKeyMD5' => md5($key, true)
                ]);
            }

            // Upload data.
            $result = $this->aws_s3_client->putObject($data);

            @unlink($chunkFile);

        } catch (S3Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

        return $result;

    }

    public function remove(UploadState $uploadState, $chunkNo = 1)
    {

        $file_path = "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;

        try {

            $data = [
                'Bucket' => $this->aws_bucket_name,
                'Key' => $file_path
            ];

            // Upload data.
            $result = $this->aws_s3_client->deleteObject($data);

        } catch (S3Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

        return $result;

    }

    public function streamModeIsAvailable()
    {
        return false;
    }

}
