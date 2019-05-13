<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use OpenStack\Common\Transport\Utils as TransportUtils;

use OpenStack\OpenStack;

use WebsiteApi\DriveBundle\Services\AESCryptFileLib;
use WebsiteApi\DriveBundle\Services\OpenSSLCryptLib;
use WebsiteApi\DriveBundle\Services\MCryptAES256Implementation;
use GuzzleHttp\Psr7\Stream;

use OpenStack\Identity\v2\Service;


class Adapter_OpenStack implements AdapterInterface{

    protected  $parameter_drive_salt = "let's try a salt";
    protected $root ;
    protected $openstack;

    public function __construct($root,$openstack)
    {
        $this->root = $root;
        error_log(print_r($openstack,true));

        $this->openstack_buckets = $openstack["buckets"];
        $this->openstack_buckets_prefix = $openstack["buckets_prefix"];
        $this->openstack_credentials_key = $openstack["user"]["id"];
        $this->openstack_credentials_secret = $openstack["user"]["password"];
        $this->openstack_project_id = $openstack["project_id"];
        $this->openstack_auth_url = $openstack["auth_url"];

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
            'username' => $this->openstack_credentials_key."",
            'password' => $this->openstack_credentials_secret,
            'identityService' => Service::factory($httpClient)
        ]);

    }

    protected function getRoot()
    {
        error_log(print_r($this->root,true));
        return dirname($this->root) . "/" . "drive" . "/";
    }

    public function read()
    {
        // TODO: Implement read() method.
    }

    public function write($param_bag)
    {

        //error_log("cc open stack");
        $key = "OpenStack" . $this->parameter_drive_salt . $param_bag->getKey();
        $key = md5($key);

        $this->encode($param_bag);

//        $key_path = str_replace($this->getRoot() . "/", "", $param_bag->getPath());
//        $key_path = str_replace($this->getRoot(), "", $key_path);

        $key_path = $param_bag->getPath();

        //error_log(print_r($key_path,true));

        try {

            $options = [
                'name' => "drive/" . $key_path,
                'stream' => new Stream(fopen($param_bag->getPath(), 'rb')),
            ];
            //error_log(print_r($this->options,true));
            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->createObject($options);

            @unlink($param_bag->getPath());

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }

    public function encode($param_bag)
    {
        if ($param_bag->getMode() == "AES") {
            $mcrypt = new MCryptAES256Implementation();
            $lib = new AESCryptFileLib($mcrypt);
        }
        if ($param_bag->getMode() == "OpenSSL") {
            $lib = new OpenSSLCryptLib();
        }
        if ($param_bag->getMode() == "OpenSSL-2") {
            $lib = new OpenSSLCryptLib();
            $key = $param_bag->getMode() . $this->parameter_drive_salt . $param_bag->getKey();
        }

        $pathTemp = $param_bag->getPath() . ".encrypt";


        //rename($path, $pathTemp);

        $finalpath = $lib->encryptFile($param_bag->getPath() , $param_bag->getKey() , $pathTemp);
        //error_log(print_r($finalpath,true));
        @unlink($param_bag->getPath());
        $param_bag->setPath($pathTemp);
        return $finalpath;
    }
}