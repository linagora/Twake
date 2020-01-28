<?php

namespace WebsiteApi\DriveBundle\Services\Storage;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use OpenStack\Common\Transport\Utils as TransportUtils;

use OpenStack\OpenStack;

use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Services\Storage\Encryption\AESCryptFileLib;
use WebsiteApi\DriveBundle\Services\Storage\Encryption\OpenSSLCryptLib;
use WebsiteApi\DriveBundle\Services\Storage\Encryption\MCryptAES256Implementation;
use GuzzleHttp\Psr7\Stream;

use OpenStack\Identity\v2\Service;
use WebsiteApi\DriveBundle\Entity\UploadState;
use WebsiteApi\DriveBundle\Services\ZipStream\Exception;
use WebsiteApi\DriveBundle\Services\ZipStream\File;
use WebsiteApi\DriveBundle\Services\ZipStream\Option\File as FileOptions;
use WebsiteApi\DriveBundle\Services\ZipStream\TwakeFileStream;

class Adapter_Local implements AdapterInterface
{

    protected $root;
    protected $preview;
    protected $doctrine;

    public function __construct($local_config, $preview, $doctrine)
    {

        $this->root = $local_config["storage"]["location"];
        $this->preview_root = $local_config["storage"]["preview_location"];
        $this->pre_public_path = $local_config["storage"]["preview_public_path"];
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
                                $pre_path = $this->root . "/" . "public/uploads/previews/" . $file->getPath() . ".png";
                                @unlink($pre_path);
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
                                $pre_path = $this->preview_root . "/" . "public/uploads/previews/" . $file->getPath() . ".png";
                                $this->verifyPath($pre_path);
                                $pre_public_path = $this->pre_public_path . "/" . "public/uploads/previews/" . $file->getPath() . ".png";
                                rename($previewpath . ".png", $pre_path);

                                $file->setPreviewLink($pre_public_path . "");
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
                            error_log("FILE NOT GENERATED !" . $e->getMessage());
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

            $file_path = "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;
            $this->verifyPath($file_path);
            error_log($chunkFile);
            if (file_exists($chunkFile)) {
                rename($chunkFile, $file_path);
            } else {
                return false;
            }

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }
    }


    public function read($destination, $chunkNo, $param_bag, UploadState $uploadState, &$zip = null, $zip_prefix = null)
    {
        try {

            $file_path = $this->root . "/" . "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;
            $stream = fopen($file_path, 'r');

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

        } catch (Exception $e) {
            error_log("Error accessing openstack file.");
        }

        return false;
    }

    private function encode($chunkFile, $param_bag)
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

        $finalpath = $lib->encryptFile($chunkFile, $key, $pathTemp);
        //error_log(print_r($finalpath,true));
        @unlink($chunkFile);

        return $finalpath;
    }


    protected function decode($chunkFile, $param_bag)
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
        return $pathTemp;

    }

    public function remove(UploadState $uploadState, $chunkNo = 1)
    {

        $file_path = $this->root . "/" . "drive/" . $uploadState->getWorkspaceId() . "/" . $uploadState->getIdentifier() . "/" . $chunkNo;

        try {

            @unlink($file_path);

        } catch (Exception $e) {
            error_log($e->getMessage() . PHP_EOL);
        }

        return true;

    }

    public function streamModeIsAvailable()
    {
        return false;
    }

    public function verifyPath($path)
    {
        $path = dirname($path);
        error_log($path);
        if (!is_dir($path)) {
            mkdir($path, 0777, true);
        }
    }


}