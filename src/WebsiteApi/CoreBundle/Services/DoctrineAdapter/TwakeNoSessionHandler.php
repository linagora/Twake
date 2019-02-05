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

class TwakeNoSessionHandler implements \SessionHandlerInterface
{

    public function __construct()
    {
    }

    public function open($savePath, $sessionName)
    {
        return true;
    }

    public function close()
    {
        return true;
    }

    public function destroy($sessionId)
    {
        return true;
    }

    public function gc($maxlifetime)
    {
        return true;
    }

    public function write($sessionId, $data)
    {
        return true;
    }

    public function read($sessionId)
    {
        return '';
    }

    public function prepare()
    {
        return true;
    }

}
