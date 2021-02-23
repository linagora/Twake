<?php

namespace Twake\Drive\Services\Storage;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Stream;
use OpenStack\Common\Transport\Utils as TransportUtils;
use OpenStack\Identity\v3\Service;
use OpenStack\OpenStack;
use Twake\Drive\Entity\DriveFile;
use Twake\Drive\Entity\UploadState;
use Twake\Drive\Services\Storage\Encryption\AESCryptFileLib;
use Twake\Drive\Services\Storage\Encryption\MCryptAES256Implementation;
use Twake\Drive\Services\Storage\Encryption\OpenSSLCryptLib;
use Twake\Drive\Services\ZipStream\Exception;

class Adapter_OpenStack implements AdapterInterface
{

    protected $openstack;
    protected $openstack_buckets;
    protected $openstack_buckets_prefix;
    protected $openstack_credentials_key;
    protected $openstack_credentials_secret;
    protected $openstack_project_id;
    protected $openstack_auth_url;
    protected $openstack_bucket_name;
    protected $openstack_public_bucket_name;
    protected $openstack_bucket_region;
    protected $openstack_region_id;
    protected $preview;
    protected $doctrine;

    public function __construct($openstack, $preview, $doctrine)
    {

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

        $this->preview = $preview;
        $this->doctrine = $doctrine;

    }

    public function genPreview(Drivefile $file, $tmppath)
    {
        $res = false;

        try {

            if (!$file->getIsDirectory() && $file->getLastVersion($this->doctrine)) {

                $ext = $file->getExtension();

                if ($tmppath) {
                    rename($tmppath, $tmppath . ".tw");
                    $tmppath = $tmppath . ".tw";

                    try {

                        //Remove old preview
                        if ($file->hasPreviewLink()) {
                            try {
                                $this->openstack->objectStoreV1()
                                    ->getContainer($this->openstack_public_bucket_name)
                                    ->getObject("public/uploads/previews/" . $file->getPath() . ".png")
                                    ->delete();
                            } catch (\Exception $e) {
                                //error_log($e->getMessage());
                            }
                        }

                        try {
                            $this->preview->generatePreview(basename($file->getPath()), $tmppath, dirname($tmppath), $ext, $file);
                        } catch (\Exception $e) {
                            //error_log($e->getMessage());
                        }
                        $previewpath = dirname($tmppath) . "/" . basename($file->getPath());
                        if ($previewpath && file_exists($previewpath . ".png")) {

                            try {
                                // Upload data.
                                $options = [
                                    'name' => "public/uploads/previews/" . $file->getPath() . ".png",
                                    'stream' => new Stream(fopen($previewpath . ".png", "rb")),
                                ];
                                $result = $this->openstack->objectStoreV1()
                                    ->getContainer($this->openstack_public_bucket_name)
                                    ->createObject($options);

                                $file->setPreviewLink($result->getPublicUri() . "");
                                $file->setPreviewHasBeenGenerated(true);
                                $file->setHasPreview(true);
                                $this->doctrine->persist($file);
                                $this->doctrine->flush();
                                $res = true;

                            } catch (\Exception $e) {
                                $res = false;
                                //error_log($e->getMessage());
                            }
                            @unlink($previewpath . ".png");
                            //error_log("PREVIEW GENERATED !");

                        } else {
                            $res = false;
                            error_log("PREVIEW NOT GENERATED !");
                        }

                    } catch (\Exception $e) {
                        //error_log($e->getMessage());
                    }

                    @unlink($tmppath);

                }
            }

        } catch (\Exception $e) {
            //error_log($e->getMessage());
            $res = false;
        }
        return $res;

    }


    public function write($chunkFile, $chunkNo, $param_bag, UploadState $uploadState)
    {
        $this->encode($chunkFile, $param_bag);

        $chunkFile = $chunkFile . ".encrypt";

        try {

            $options = [
                'name' => "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo,
                'stream' => new Stream(fopen($chunkFile, 'rb')),
            ];

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->createObject($options);

            @unlink($chunkFile);

        } catch (\Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }

    private function encode($chunkFile, $param_bag)
    {

        if($this->disable_encryption){
            $pathTemp = $chunkFile . ".encrypt";
            copy($chunkFile, $pathTemp);
            return $pathTemp;
        }

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

        $finalpath = $lib->encryptFile($chunkFile, $key, $pathTemp);
        //error_log(print_r($finalpath,true));
        @unlink($chunkFile);

        return $finalpath;
    }

    public function read($destination, $chunkNo, $param_bag, UploadState $uploadState, &$zip = null, $zip_prefix = null)
    {
        try {
            $stream = $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject("drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo)
                ->download();

            $tmp_upload = "/tmp/" . date("U") . $uploadState->getWorkspaceId() . $uploadState->getIdentifier();
            file_put_contents($tmp_upload, $stream->getContents());
            $decodedPath = $this->decode($tmp_upload, $param_bag);

            if ($destination == "stream") {
                if ($stream = fopen($decodedPath, 'r')) {
                    // While the stream is still open
                    while (!feof($stream)) {
                        // Read 1,024 bytes from the stream
                        echo fread($stream, 1024);
                    }
                    // Be sure to close the stream resource when you're done with it
                    fclose($stream);
                    unlink($decodedPath);
                }
                return true;
            }

            if ($destination == "original_stream") {
                if ($stream = fopen($decodedPath, 'r')) {
                    return $stream;
                }
            }

            return $decodedPath;

        } catch (\Exception $e) {
            error_log("Error accessing openstack file.");
        }

        return false;
    }

    protected function decode($chunkFile, $param_bag)
    {
        if($this->disable_encryption){
            $pathTemp = $chunkFile . ".decrypt";
            copy($chunkFile, $pathTemp);
            return $pathTemp;
        }

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
        return $pathTemp;

    }

    public function remove(UploadState $uploadState, $chunkNo = 1)
    {

        $file_path = "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;

        try {

            $this->openstack->objectStoreV1()
                ->getContainer($this->openstack_bucket_name)
                ->getObject($file_path)
                ->delete();

        } catch (\Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

        return $result;

    }

    public function streamModeIsAvailable()
    {
        return false;
    }


}
