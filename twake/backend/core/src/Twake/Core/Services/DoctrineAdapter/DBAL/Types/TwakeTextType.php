<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\StringType;


class TwakeTextType extends StringType
{
    /**
     * Secret key for aes algorythm
     * @var string
     */
    private $secretKey;
    protected $searchable = false;

    public function setEncryptionKey($key)
    {
        $this->secretKey = $key;
        $this->iv = "twake_constantiv";
    }

    public function convertToPHPValue($original_data, AbstractPlatform $platform)
    {
        $data = $this->v2Decrypt($original_data);
        if(!$data["done"]){
            $data = $this->v1Decrypt($original_data);
        }
        if(!$data["done"]){
            $data = ["data" => $this->legacyDecrypt($original_data)];
        }
        return $data["data"];
    }

    public function convertToDatabaseValue($data, AbstractPlatform $platform)
    {
        if (!$data) {
            return $data;
        }

        if ($this->searchable) {
            $iv = $this->iv;
            $salt = "";
        } else {
            $iv = openssl_random_pseudo_bytes(16);
            $salt = bin2hex(openssl_random_pseudo_bytes(16));
        }

        $encoded = "encrypted_" . trim(
                base64_encode(
                    openssl_encrypt(
                        $data,
                        "AES-256-CBC",
                        $this->secretKey . $salt,
                        true,
                        $iv
                    )
                )
            );

        if (!$this->searchable) {
            $encoded .= "_" . $salt . "_" . base64_encode($iv);
        }

        return $encoded;

    }

    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return "TEXT";
    }

    public function v2Decrypt($data){
        $key = substr(hash("sha256", unpack("H*", $this->secretKey)[1]), 0, 32);
        $encryptedArray = explode(":", $data);

        if (!count($encryptedArray) || count($encryptedArray) !== 3) {
            return [
                "data" => $data,
                "done" => false,
            ];
        }

        $iv = base64_decode($encryptedArray[0]);
        if ($encryptedArray[0] === "0000000000000000") {
            $iv = "0000000000000000";
        }

        try {
            $tag = base64_decode($encryptedArray[1]);
            $str = openssl_decrypt(base64_decode($encryptedArray[2]), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
            $decrypt = json_decode($str);

            return [
                "data" => $decrypt,
                "done" => true,
            ];
        } catch (Error $err) {
            return [
                "data" => $data,
                "done" => false,
            ];
        }
    }

    public function v1Decrypt($data){
        $key = substr(base64_encode(hash("sha256", unpack("H*", $this->secretKey)[1], true)), 0, 32);
        $encryptedArray = explode(":", $data);

        if (!count($encryptedArray) || count($encryptedArray) !== 2) {
            return [
                "data" => $data,
                "done" => false,
            ];
        }

        try {

            $iv = @hex2bin($encryptedArray[0]);
            if ($encryptedArray[0] === "0000000000000000") {
                $iv = "0000000000000000";
            }

            $str = openssl_decrypt(@hex2bin($encryptedArray[1]), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
            $decrypt = json_decode($str);

            return [
                "data" => $decrypt,
                "done" => true,
            ];
        } catch (Error $err) {
            return [
                "data" => $data,
                "done" => false,
            ];
        }
    }

    public function legacyDecrypt($original_data){
        if (substr($original_data, 0, 10) == "encrypted_") {
            $data = substr($original_data, 10);
            $data = explode("_", $data);
            $salt = isset($data[1]) ? $data[1] : "";
            $iv = isset($data[2]) ? base64_decode($data[2]) : $this->iv;
            $data = base64_decode($data[0]);
            try {
                $data = openssl_decrypt(
                    $data,
                    "AES-256-CBC",
                    $this->secretKey . $salt,
                    true,
                    $iv
                );
            } catch (\Exception $e) {
                $data = $original_data;
            }
        } else {
            $data = $original_data;
        }

        return $data;
    }

}
