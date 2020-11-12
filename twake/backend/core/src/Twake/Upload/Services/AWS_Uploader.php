<?php


namespace Twake\Upload\Services;

use App\App;
use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;

class AWS_Uploader extends Uploader
{


    public function __construct(App $app)
    {

        $s3_config = $app->getContainer()->getParameter("storage.S3");

        parent::__construct($app);

        $this->aws_version = $s3_config["version"];
        $this->aws_buckets = $s3_config["buckets"];
        $this->aws_buckets_prefix = $s3_config["buckets_prefix"];
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

    public function upload($realfile, $file, $context)
    {
        $contexts = $this->getContexts();

        $file_size = filesize($realfile);

        $upload_status = [];

        $error = "unknown";
        if ($upload_status["status"] != "error") {

            try {
                // Upload data.
                $result = $this->aws_s3_client->putObject([
                    'Bucket' => $this->aws_bucket_name,
                    'Key' => "public/uploads/" . $file->getType() . "/" . $file->getName(),
                    'Body' => fopen($realfile, "rb"),
                    'ACL' => 'public-read'
                ]);

                $file->setPublicLink($result['ObjectURL']);

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
