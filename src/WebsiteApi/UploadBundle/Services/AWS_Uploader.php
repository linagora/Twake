<?php


namespace WebsiteApi\UploadBundle\Services;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class AWS_Uploader extends Uploader
{


    function __construct($aws_config, $doctrine, $uploadService, $modifiersService)
    {

        parent::__construct($doctrine, $uploadService, $modifiersService);

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

    public function upload($realfile, $file, $context)
    {
        $contexts = $this->getContexts();

        $file_size = filesize($realfile["tmp_name"]);

        $upload_status = [];
        $this->uploadService->verifyContext($upload_status, $realfile, $contexts[$context]);

        $error = "unknown";
        if ($upload_status["status"] != "error") {

            try {
                // Upload data.
                $result = $this->aws_s3_client->putObject([
                    'Bucket' => $this->aws_bucket_name,
                    'Key' => "public/uploads/" . $file->getType() . "/" . $file->getName(),
                    'Body' => fopen($realfile["tmp_name"], "rb"),
                    'ACL' => 'public-read'
                ]);

                $file->setAwsPublicLink($result['ObjectURL']);

                return Array(
                    "errors" => [],
                    "status" => "success",
                    "filesize" => $file_size
                );

            } catch (S3Exception $e) {
                $error = $e->getMessage();
            }

        }

        return Array(
            "errors" => [$error],
            "status" => "error"
        );
    }

    public function removeFile($file, $flush = true)
    {

        try {

            $this->aws_s3_client->deleteObject([
                'Bucket' => $this->aws_bucket_name,
                'Key' => "public/uploads/" . $file->getType() . "/" . $file->getName(),
            ]);

        } catch (S3Exception $e) {
            $error = $e->getMessage();
        }

        $this->doctrine->remove($file);
        if ($flush) {
            $this->doctrine->flush();
        }
    }

}