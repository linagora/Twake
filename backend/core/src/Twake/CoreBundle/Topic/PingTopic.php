<?php

namespace Twake\Core\Topic;

use Gos\Bundle\WebSocket\Router\WampRequest;
use Gos\Bundle\WebSocket\RPC\RpcInterface;
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