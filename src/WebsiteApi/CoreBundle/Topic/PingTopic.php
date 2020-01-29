<?php

namespace WebsiteApi\CoreBundle\Topic;

use Ratchet\ConnectionInterface;
use Gos\Bundle\WebSocketBundle\RPC\RpcInterface;
use Gos\Bundle\WebSocketBundle\Router\WampRequest;

class PingTopic implements RpcInterface
{
    public function ping(ConnectionInterface $connection, WampRequest $request, $params)
    {
        return 1;
    }

    /**
     * Name of RPC, use for pubsub router (see step3)
     *
     * @return string
     */
    public function getName()
    {
        return 'ping.rpc';
    }
}