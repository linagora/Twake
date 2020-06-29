<?php

namespace Twake\Drive\Services\Storage\Encryption;

interface AES256Implementation
{
    public function checkDependencies();

    public function createIV();

    public function createRandomKey();

    public function encryptData($the_data, $iv, $enc_key);

    public function decryptData($the_data, $iv, $enc_key);
}