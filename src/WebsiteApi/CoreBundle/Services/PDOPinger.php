<?php

namespace WebsiteApi\CoreBundle\Services;

use Gos\Bundle\WebSocketBundle\Periodic\PeriodicInterface;
use Gos\Bundle\WebSocketBundle\Server\App\Registry\PeriodicRegistry;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

class PDOPinger implements PeriodicInterface
{
    /**
     * @var \PDO
     */
    protected $pdo;
    /**
     * @var LoggerInterface|NullLogger
     */
    protected $logger;
    /**
     * @var int|float
     */
    protected $timeout;

    /**
     * @param PeriodicRegistry $periodicRegistry
     * @param \PDO $pdo
     * @param LoggerInterface $logger
     */
    public function __construct(\PDO $pdo = null, LoggerInterface $logger = null)
    {
        $this->pdo = $pdo;
        $this->logger = null === $logger ? new NullLogger() : $logger;
        $this->timeout = 20;
    }

    public function tick()
    {
        if (null === $this->pdo) {
            $this->logger->warning('Unable to ping sql server, service pdo is unavailable');
            return;
        }
        //if connection is persistent we don't need to ping
        if (true === $this->pdo->getAttribute(\PDO::ATTR_PERSISTENT)) {
            return;
        }
        try {
            $startTime = microtime(true);
            $this->pdo->query('SELECT 1');
            $endTime = microtime(true);
            $this->logger->notice(sprintf('Successfully ping sql server (~%s ms)', round(($endTime - $startTime) * 100000), 2));
        } catch (\PDOException $e) {
            $this->logger->emergency('Sql server is gone, and unable to reconnect');
            throw $e;
        }
    }

    /**
     * @return int
     */
    public function getTimeout()
    {
        return $this->timeout;
    }

    /**
     * @param int|float $timeout
     */
    public function setTimeout($timeout)
    {
        $this->timeout = $timeout;
    }
}