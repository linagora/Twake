<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use Reprovinci\DoctrineEncrypt\Encryptors\EncryptorInterface;
use Reprovinci\DoctrineEncrypt\Subscribers\DoctrineEncryptSubscriber;
use WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Repository\DefaultRepositoryFactory;
use Doctrine\ORM\Tools\Setup;

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
