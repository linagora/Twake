<?php

namespace WebsiteApi\NotificationsBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Process\Process;

class NotificationQueueCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:notifications_queue");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $doctrine = $this->getContainer()->get('doctrine');
        $em = $doctrine->getManager();
        $services = $this->getApplication()->getKernel()->getContainer();
        $circle = $services->get("circle.restclient");
        $key = $this->getContainer()->getParameter('licence_key');
        $server = $this->getContainer()->getParameter('PUSH_NOTIFICATION_SERVER');
        $notifRepo = $em->getRepository("TwakeNotificationsBundle:PushNotificationQueue");

        //while(true) {
        //Lock
        $notifications = $notifRepo->findBy(Array(), Array(), 1, 0);
        foreach ($notifications as $notification) {
            $em->remove($notification);
        }
        $em->flush();
        //Unlock

        if (!$this->getContainer()->getParameter('STANDALONE')) {
            $masterServer = "https://app.twakeapp.com/api/remote/push";
            $dataArray = Array(
                "licenceKey" => $key,
                "data" => Array()
            );
            foreach ($notifications as $notification) {
                $dataArray["data"][] = $notification->getText();
            }
            error_log(json_encode($dataArray));
            $r = $circle->post($masterServer, json_encode($dataArray), array(CURLOPT_CONNECTTIMEOUT => 1));
            var_dump($r);

        }else{
            foreach ($notifications as $notification) {
                $data = $notification->getText();
                $circle->post($server, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1));
            }
        }
        //}

    }

}