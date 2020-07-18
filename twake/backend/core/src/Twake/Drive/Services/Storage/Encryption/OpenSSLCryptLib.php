<?php

namespace Twake\Drive\Services\Storage\Encryption;

class OpenSSLCryptLib
{
    public function decryptFile($in, $key, $out)
    {

        $key = md5($key);

        if ($out != $in) {
            $temp = $out;
        } else {
            $temp = $in . ".tmp";
        }

        $iv = bin2hex(substr($key, 0, openssl_cipher_iv_length('aes-256-cbc') / 2));

        shell_exec('openssl enc -aes-256-cbc -base64 -d -A -p -K ' . $key . ' -iv ' . $iv . ' -in ' . $in . ' -out ' . $temp);

        if ($out == $in) {
            rename($in . ".tmp", $out);
        }

    }

    public function encryptFile($in, $key, $out)
    {

        $key = md5($key);

        if ($out != $in) {
            $temp = $out;
        } else {
            $temp = $in . ".tmp";
        }

        $iv = bin2hex(substr($key, 0, openssl_cipher_iv_length('aes-256-cbc') / 2));

        shell_exec('openssl enc -aes-256-cbc -base64 -e -A -p -K ' . $key . ' -iv ' . $iv . ' -in ' . $in . ' -out ' . $temp);

        if ($out == $in) {
            rename($in . ".tmp", $out);
        }

    }
}