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

    /**
     * Initialization of encryptor
     * @param string $key
     */
    public function setEncryptionKey($key)
    {
        $this->secretKey = $key;
        $this->iv = "twake_constantiv";
    }

    public function convertToPHPValue($original_data, AbstractPlatform $platform)
    {
        return $this->legacyDecrypt($original_data);
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

    private function legacyDecrypt($original_data){
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
