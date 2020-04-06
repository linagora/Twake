<?php


namespace Twake\Core\Services\Queues;

use App\App;
use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twake\Core\Services\Queues\Adapters\SQS;

class Queues
{

    var $adapter = null;

    public function __construct(App $app)
    {
        if ($app->getContainer()->getParameter("queues.sqs.use")) {
            $this->adapter = new SQS($app->getContainer()->getParameter("queues.sqs"));
        } else if ($app->getContainer()->getParameter("queues.rabbitmq.use")) {
            $this->adapter = new SQS($app->getContainer()->getParameter("queues.rabbitmq"));
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
