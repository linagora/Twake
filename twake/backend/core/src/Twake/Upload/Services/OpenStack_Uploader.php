<?php


namespace Twake\Upload\Services;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Stream;
use OpenStack\Common\Transport\Utils as TransportUtils;
use OpenStack\Identity\v3\Service;
use OpenStack\OpenStack;
use App\App;

class OpenStack_Uploader extends Uploader
{

    public function __construct(App $app)
    {
        parent::__construct($app);
    }

    public function configure($openstack){
        
        $this->openstack_buckets = $openstack["buckets"];
        $this->openstack_buckets_prefix = $openstack["buckets_prefix"];
        $this->openstack_credentials_key = $openstack["user"]["id"];
        $this->openstack_credentials_secret = $openstack["user"]["password"];
        $this->openstack_domain_name = $openstack["user"]["domain_name"];
        $this->openstack_project_id = $openstack["project_id"];
        $this->openstack_auth_url = $openstack["auth_url"];
        $this->disable_encryption = $openstack["disable_encryption"];

        $httpClient = new Client([
            'base_uri' => TransportUtils::normalizeUrl($this->openstack_auth_url ? $this->openstack_auth_url : ""),
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
            'user' => [
                'name' => $this->openstack_credentials_key,
                'password' => $this->openstack_credentials_secret,
                'domain'   => [ 'id' => $this->openstack_domain_name ]
            ],
            'scope'   => [
                'project' => [
                    'id' => $this->openstack_project_id
                ]
            ],
            'identityService' => Service::factory($httpClient)
        ]);


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
                $options = [
                    'name' => "public/uploads/" . $file->getType() . "/" . $file->getName(),
                    'stream' => new Stream(fopen($realfile, "rb")),
                ];
                $result = $this->openstack->objectStoreV1()
                    ->getContainer($this->openstack_public_bucket_name)
                    ->createObject($options);

                $file->setPublicLink($result->getPublicUri());

                return Array(
                    "errors" => [],
                    "status" => "success",
                    "filesize" => $file_size
                );

            } catch (\Exception $e) {
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
                ->getContainer($this->openstack_public_bucket_name)
                ->getObject("public/uploads/" . $file->getType() . "/" . $file->getName())
                ->delete();

        } catch (\Exception $e) {
            $error = $e->getMessage();
        }

        $this->doctrine->remove($file);
        if ($flush) {
            $this->doctrine->flush();
        }
    }

}