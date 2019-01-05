<?php


namespace WebsiteApi\UploadBundle\Services;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class OpenStack_Uploader extends Uploader
{


    function __construct($openstack_config, $doctrine, $uploadService, $modifiersService)
    {

        parent::__construct($doctrine, $uploadService, $modifiersService);

        $this->openstack_version = $openstack_config["version"];
        $this->openstack_buckets = $openstack_config["buckets"];
        $this->openstack_buckets_prefix = $openstack_config["buckets_prefix"];
        $this->openstack_credentials_key = $openstack_config["user"]["id"];
        $this->openstack_credentials_secret = $openstack_config["user"]["password"];

        $region = false;
        foreach ($this->aws_buckets as $region_code => $aws_region) {
            if ($region_code == "fr" || !$region) {
                $region = $aws_region;
            }
        }
        $this->openstack_bucket_name = $this->openstack_buckets_prefix . 'twake.' . $region;
        $this->openstack_bucket_region = $region;

        //TODO finish connection config
        $this->openstack = new OpenStack\OpenStack([
            'authUrl' => '{authUrl}',
            'region' => '{region}',
            'user' => [
                'id' => $this->openstack_credentials_key,
                'password' => $this->openstack_credentials_secret
            ],
            'scope' => ['project' => ['id' => '{projectId}']]
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
                $options = [
                    'name' => "public/uploads/" . $file->getType() . "/" . $file->getName(),
                    'stream' => new Stream(fopen($realfile["tmp_name"], "rb")),
                ];
                $result = $this->openstack->objectStoreV1()
                    ->getContainer($this->openstack_bucket_name)
                    ->createObject($options);

                $file->setAwsPublicLink($result->getPublicUri());

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

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject("public/uploads/" . $file->getType() . "/" . $file->getName())
                ->delete();

        } catch (S3Exception $e) {
            $error = $e->getMessage();
        }

        $this->doctrine->remove($file);
        if ($flush) {
            $this->doctrine->flush();
        }
    }

}