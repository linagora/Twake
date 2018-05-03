<?php

namespace WebsiteApi\NotificationsBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Process\Process;

class NotificationMailCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:notifications_mail");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $doctrine = $this->getContainer()->get('doctrine');
        $em = $doctrine->getManager();

        //Today notifications

        $number_of_mails = 0;
        $last_mail_before = null;
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before);

        $this->sendMail($users_id_count, "today");
        $em->getRepository("TwakeNotificationsBundle:Notification")->updateMailCandidates($number_of_mails, $last_mail_before);

        // Week notifications

        $number_of_mails = 1;
        $last_mail_before = new \DateTime("7 days ago");
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before);

        $this->sendMail($users_id_count, "this week");
        $em->getRepository("TwakeNotificationsBundle:Notification")->updateMailCandidates($number_of_mails, $last_mail_before);

    }

    protected function sendMail($users_id_count, $time_text)
    {

        $services = $this->getApplication()->getKernel()->getContainer();
        $doctrine = $this->getContainer()->get('doctrine');
        $em = $doctrine->getManager();

        foreach ($users_id_count as $user_id_count) {
            $user_id = $user_id_count[1];
            $count = $user_id_count[2];

            $user = $em->getRepository("TwakeUsersBundle:User")->find($user_id);
            $notifications = $em->getRepository("TwakeNotificationsBundle:Notification")->findBy(Array("user" => $user_id), Array("date" => "DESC"), min(10, $count));

            $data = Array(
                "username" => $user->getUsername(),
                "total_notifications" => $count,
                "notifications" => Array(),
                "time_text" => $time_text
            );
            foreach ($notifications as $notification) {
                $data["notifications"][] = Array(
                    "title" => $notification->getTitle(),
                    "delay" => (new \DateTime())->diff($notification->getDate())->format("%a"),
                    "text" => $notification->getText()
                );
            }

            $services->get("app.twake_mailer")->send($user->getEmail(), "unread_notifications", $data);
        }

    }

}