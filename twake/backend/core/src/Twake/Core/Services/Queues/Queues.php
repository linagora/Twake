<?php


namespace Twake\Core\Services\Queues;

use App\App;
use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twake\Core\Services\Queues\Adapters\SQS;
use Twake\Core\Services\Queues\Adapters\RabbitMQ;
use Twake\Core\Services\Queues\Adapters\EmptyManager;

class Queues
{

    var $adapter = null;

    public function __construct(App $app)
    {
        $this->adapter = new EmptyManager();
        if ($app->getContainer()->getParameter("queues.rabbitmq.use")) {
            $this->adapter = new RabbitMQ($app->getContainer()->getParameter("queues.rabbitmq"));
        }
    }

    /**
     * @return QueueManager
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

}
