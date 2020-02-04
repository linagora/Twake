<?php

namespace WebsiteApi\CoreBundle\Topic;

use Gos\Bundle\WebSocketBundle\Router\WampRequest;
use Gos\Bundle\WebSocketBundle\RPC\RpcInterface;
use Ratchet\ConnectionInterface;

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