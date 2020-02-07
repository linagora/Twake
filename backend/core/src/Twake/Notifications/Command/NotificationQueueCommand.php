<?php

namespace Twake\Notifications\Command;

use Symfony\Bundle\Framework\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class NotificationQueueCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:notifications_queue");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();
        $em = $services->get('app.twake_doctrine');
        $circle = $services->get("app.restclient");
        $key = $this->getContainer()->getParameter('LICENCE_KEY');
        $server = $this->getContainer()->getParameter('PUSH_NOTIFICATION_SERVER');
        $notifRepo = $em->getRepository("Twake\Notifications:PushNotificationQueue");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            // TODO Lock
            $notifications = $notifRepo->findBy(Array(), Array(), 20, 0);
            foreach ($notifications as $notification) {
                $em->remove($notification);
            }
            $em->flush();
            //Unlock

            if (count($notifications) == 0) {
                sleep(1);
            } else {

                if (!$this->getContainer()->getParameter('STANDALONE')) {
                    $masterServer = "https://app.twakeapp.com/api/remote/push";
                    $dataArray = Array(
                        "licenceKey" => $key,
                        "data" => Array()
                    );
                    foreach ($notifications as $notification) {
                        $dataArray["data"][] = $notification->getText();
                    }
                    $circle->post($masterServer, json_encode($dataArray), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 3, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));

                } else {
                    foreach ($notifications as $notification) {
                        $data = $notification->getText();
                        $circle->post($server, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1));
                    }
                }

            }
        }

    }

}