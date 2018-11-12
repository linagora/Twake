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

        //Daily send an email with a summary of unread notifications for all apps after 12 hours without mails sent (including messages)
        $number_of_mails = 1;
        $last_mail_before = new \DateTime();
        $last_mail_before->setTimestamp(date("U") - 60 * 60 * 12);
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before);
        $this->sendMail($users_id_count, "unread_notifications", null, true);

        //Send an email for unread notifications after more than 30 minutes only for messages
        $number_of_mails = 0; //Never notified
        $last_mail_before = null; //Never notified
        $delay = 60 * 20; //20 minutes + 10 minutes cron average 25min after message was sent
        $app = $em->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "messages"));
        $users_id_count = $em->getRepository("TwakeNotificationsBundle:Notification")->getMailCandidates($number_of_mails, $last_mail_before, $delay, $app);
        $this->sendMail($users_id_count, "messages_notifications", $app);
        $em->getRepository("TwakeNotificationsBundle:Notification")->updateMailCandidates($number_of_mails, $last_mail_before, $delay);

    }

    /**
     * @param $users_id_count
     * @param string $template
     * @param null $app
     * @param bool $all_and_delete
     */
    protected function sendMail($users_id_count, $template = "unread_notifications", $app = null, $all_and_delete = false)
    {

        $services = $this->getApplication()->getKernel()->getContainer();
        $doctrine = $this->getContainer()->get('doctrine');
        $em = $doctrine->getManager();

        foreach ($users_id_count as $user_id_count) {
            $user_id = $user_id_count[1];
            $count = $user_id_count[2];

            $user = $em->getRepository("TwakeUsersBundle:User")->find($user_id);

            $preferences = $user->getNotificationPreference();
            $mail_preferences = isset($preferences["mail_notifications"]) ? $preferences["mail_notifications"] : 2;

            if (($mail_preferences == 2) || ($mail_preferences == 1 && $app == null)) { // Everything or Only daily mails

                $filter = Array("user" => $user_id);
                if ($app) {
                    $filter["application"] = $app;
                }
                $notifications = $em->getRepository("TwakeNotificationsBundle:Notification")->findBy($filter, Array("date" => "DESC"), 20);

                $data = Array(
                    "username" => $user->getUsername(),
                    "total_notifications" => $count,
                    "notifications" => Array()
                );

                $do_not_send = false;
                foreach ($notifications as $notification) {
                    if ($notification->getMailSent() == 1) {
                        $timestamp = $notification->getLastMail();
                        if ($timestamp && (new \DateTime())->getTimestamp() - $timestamp->getTimestamp() < 60 * 20) {
                            $do_not_send = true;
                            break;
                        }
                    }
                }
                if ($do_not_send) {
                    continue;
                }

                foreach ($notifications as $notification) {
                    $data["notifications"][] = Array(
                        "title" => $notification->getTitle(),
                        "delay" => (new \DateTime())->diff($notification->getDate())->format("%h"),
                        "text" => $notification->getText()
                    );
                }

                $services->get("app.twake_mailer")->send($user->getEmail(), $template, $data);

            }

            if ($all_and_delete) {
                $em->getRepository("TwakeNotificationsBundle:Notification")->deleteForUser(1, $user);
            }

        }

    }

}
