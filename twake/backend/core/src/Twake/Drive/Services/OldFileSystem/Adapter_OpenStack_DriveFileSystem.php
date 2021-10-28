<?php


namespace Twake\Drive\Services\OldFileSystem;

use App\App;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use OpenStack\Common\Transport\Utils as TransportUtils;
use OpenStack\Identity\v2\Service;
use OpenStack\OpenStack;

class Adapter_OpenStack_DriveFileSystem
{

    public function __construct(App $app)
    {
        $configuration = $app->getContainer()->getParameter("storage.openstack");
        foreach($app->getContainer()->getParameter("storage.providers") as $providerConfiguration){
            if($providerConfiguration["type"] == "openstack"){
                $configuration = $providerConfiguration;
            }
        }
        $this->configure($app, $configuration);
    }

    public function configure(App $app, $config){
        $openstack_config = $config;
        $this->root = $this->local = $app->getAppRootDir();
        $this->parameter_drive_salt = $openstack_config["override_drive_salt"] ?: $app->getContainer()->getParameter("storage.drive_salt");

        $this->openstack_buckets = $openstack_config["buckets"];
        $this->openstack_buckets_prefix = isset($openstack_config["buckets_prefix"]) ? $openstack_config["buckets_prefix"] : "";
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

        } catch (\Exception $e) {
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
