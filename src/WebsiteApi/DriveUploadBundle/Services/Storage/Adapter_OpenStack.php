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
use WebsiteApi\DriveUploadBundle\Entity\UploadState;

class Adapter_OpenStack implements AdapterInterface{

    protected $openstack;

    public function __construct($openstack)
    {

        $this->openstack_buckets = $openstack["buckets"];
        $this->openstack_buckets_prefix = $openstack["buckets_prefix"];
        $this->openstack_credentials_key = $openstack["user"]["id"];
        $this->openstack_credentials_secret = $openstack["user"]["password"];
        $this->openstack_project_id = $openstack["project_id"];
        $this->openstack_auth_url = $openstack["auth_url"];

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
            'tenantId' => $this->openstack_project_id,
            'username' => $this->openstack_credentials_key."",
            'password' => $this->openstack_credentials_secret,
            'identityService' => Service::factory($httpClient)
        ]);

    }

    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState)
    {
        //error_log(print_r($chunkFile,true));
        //error_log("cc open stack");
        $key = "OpenStack" . $param_bag->getSalt() . $param_bag->getKey();
        $key = md5($key);
        $this->encode($chunkFile,$param_bag);

        $key_path = explode("/", $chunkFile)[1];

        $chunkFile = $chunkFile.".encrypt";

        try {

            $options = [
                'name' => "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo,
                'stream' => new Stream(fopen($chunkFile, 'rb')),
            ];

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->createObject($options);

            @unlink($chunkFile);

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }

    public function read($chunkFile, $chunkNo, $param_bag, UploadState $uploadState)
    {
        $key = "OpenStack" . $param_bag->getSalt(). $param_bag->getKey();
        $key = md5($key);

        try {
            $stream = $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject("drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo)
                ->download();

            $tmpPath = "uploads" . DIRECTORY_SEPARATOR . $chunkFile;
            //$this->verifyPath($tmpPath);
            file_put_contents($tmpPath, $stream->getContents());

            $decodedPath = $this->decode($tmpPath, $param_bag);

            return $decodedPath;

        } catch (Exception $e) {
            error_log("Error accessing aws file.");
        }

        return false;
    }

    private function encode($chunkFile,$param_bag)
    {
        //error_log(print_r($chunkFile,true));

        $key = $param_bag->getKey();
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

        $pathTemp = $chunkFile . ".encrypt";


        //rename($path, $pathTemp);

        $finalpath = $lib->encryptFile($chunkFile , $key , $pathTemp);
        //error_log(print_r($finalpath,true));
        @unlink($chunkFile);

        return $finalpath;
    }


    protected function decode($chunkFile,$param_bag)
    {
        $key = $param_bag->getKey();
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
        $pathTemp = $chunkFile . ".decrypt";

        $finalpath = $lib->decryptFile($chunkFile, $key, $pathTemp);
        @unlink($chunkFile);
        return $finalpath;

    }


}