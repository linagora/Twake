<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

class TwakeSessionHandler implements \SessionHandlerInterface
{
    private $sessionHandler;


    public function __construct($pdo, $cassandra, $driver)
    {

        if ($driver == "pdo_cassandra") {
            $this->sessionHandler = $cassandra;
        } else {
            $this->sessionHandler = $pdo;
        }

    }

    public function open($savePath, $sessionName)
    {
        return $this->sessionHandler->open($savePath, $sessionName);
    }

    public function close()
    {
        return $this->sessionHandler->close();
    }

    public function destroy($sessionId)
    {
        return $this->sessionHandler->destroy($sessionId);
    }

    public function gc($maxlifetime)
    {
        return $this->sessionHandler->gc($maxlifetime);
    }

    public function write($sessionId, $data)
    {
        return $this->sessionHandler->write($sessionId, $data);
    }

    public function read($sessionId)
    {
        return $this->sessionHandler->read($sessionId, $data);
    }

    public function prepare()
    {
        return $this->sessionHandler->prepare();
    }

}
