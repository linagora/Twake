<?php

namespace Twake\Drive\Services\Storage\Encryption;

class MCryptAES256Implementation implements AES256Implementation
{
    const BLOCK_SIZE = 16; // 128 bits
    const KEY_SIZE = 32; // 256 bits
    const MY_MCRYPT_CIPHER = MCRYPT_RIJNDAEL_128; //AES
    const MY_MCRYPT_MODE = MCRYPT_MODE_CBC; //AES

    public function checkDependencies()
    {
        $function_list = array(
            "mcrypt_create_iv",
            "mcrypt_encrypt",
            "mcrypt_decrypt",
        );
        foreach ($function_list as $func) {
            if (!function_exists($func)) {
                throw new \Exception("Missing function dependency: " . $func);
            }
        }
    }

    public function createIV()
    {
        return mcrypt_create_iv(self::BLOCK_SIZE, MCRYPT_RAND);
    }

    public function createRandomKey()
    {
        return mcrypt_create_iv(self::KEY_SIZE, MCRYPT_RAND);
    }

    public function encryptData($the_data, $iv, $enc_key)
    {
        return mcrypt_encrypt(self::MY_MCRYPT_CIPHER, $enc_key, $the_data, self::MY_MCRYPT_MODE, $iv);
    }

    public function decryptData($the_data, $iv, $enc_key)
    {
        return mcrypt_decrypt(self::MY_MCRYPT_CIPHER, $enc_key, $the_data, self::MY_MCRYPT_MODE, $iv);
    }
}