<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use Reprovinci\DoctrineEncrypt\Encryptors\EncryptorInterface;

class TwakeEncryptor implements EncryptorInterface
{

    /**
     * Must accept data and return encrypted data
     */
    public function encrypt($data)
    {
        // TODO: Implement encrypt() method.
        return $data;
    }

    /**
     * Must accept data and return decrypted data
     */
    public function decrypt($data)
    {
        // TODO: Implement decrypt() method.
        return $data;
    }
}
