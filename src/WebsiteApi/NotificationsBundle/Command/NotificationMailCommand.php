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

        //Daily send an email with a summary of unread notifications for all apps after 8 hours without mails sent (including messages)
        $number_of_mails = 1;
        $last_mail_before = new \DateTime();
        $last_mail_before->setTimestamp(date("U") - 60 * 60 * 8);
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before);
        $this->sendMail($users_id_count, "unread_notifications");
        $em->getRepository("TwakeNotificationsBundle:Notification")->updateMailCandidates($number_of_mails, $last_mail_before);

        //Send an email for unread notifications after more than 30 minutes only for messages
        $number_of_mails = 0; //Never notified
        $last_mail_before = null; //Never notified
        $delay = 60 * 30;
        $app = $em->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "messages"));
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before, $delay, $app);
        $this->sendMail($users_id_count, "messages_notifications");
        $em->getRepository("TwakeNotificationsBundle:Notification")->updateMailCandidates($number_of_mails, $last_mail_before);

    }

    protected function sendMail($users_id_count, $template = "unread_notifications")
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
                "notifications" => Array()
            );
            foreach ($notifications as $notification) {
                $data["notifications"][] = Array(
                    "title" => $notification->getTitle(),
                    "delay" => (new \DateTime())->diff($notification->getDate())->format("%h"),
                    "text" => $notification->getText()
                );
            }

            $services->get("app.twake_mailer")->send($user->getEmail(), $template, $data);
        }

    }

}