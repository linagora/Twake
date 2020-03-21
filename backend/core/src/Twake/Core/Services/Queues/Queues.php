<?php


namespace Twake\Core\Services\Queues;

use App\App;
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

    public function push($route, $message)
    {
        if (!$this->adapter) {
            return;
        }
        $this->adapter->push($route, $message);
    }

    public function consume()
    {
        if (!$this->adapter) {
            return [];
        }
        return $this->adapter->consume($route, $message);
    }

    public function close()
    {
        if ($this->adapter) {
            $this->adapter->close();
        }
    }

}
