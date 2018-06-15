<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 14/06/18
 * Time: 09:18
 */

namespace WebsiteApi\PaymentsBundle\Services;


use phpDocumentor\Reflection\Types\Array_;
use WebsiteApi\PaymentsBundle\Entity\BillingUserList;
use WebsiteApi\PaymentsBundle\Model\MailSenderInterface;

class MailSender implements MailSenderInterface
{

    var $doctrine;
    var $mailer;

    public function __construct($doctrine, $mailer)
    {
        $this->doctrine = $doctrine;
        $this->mailer = $mailer;
    }

    private function getList($group){
        $list_addressee = $this->doctrine->getRepository("TwakePaymentsBundle:BillingUserList")->findBy(Array("group" => $group));
        $infos = array();
        foreach ($list_addressee as $user) {
            $info = array();
            $mail = $user->getUser()->getEmail();
            $username = $user->getUser()->getUsername();
            $info["username"] = $username;
            $info["mail"] = $mail;
            array_push($infos,$info);
        }
        return $infos;
    }

    public function sendBill($group, $billFilesPath){//TODO mettre bill template
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"UnpaidSubscription",Array("username"=>$username),"TwakePaymentsBundle:Mail", $billFilesPath);
        }
    }

    public function sendEndPeriodsMail($group, $timeleft){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"endPeriod",Array("timeleft"=>$timeleft,"username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

    public function sendIsOverUsingALittle($group, $overuse){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"IsOverUsingALittle",Array("overuse"=>$overuse,"username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

    public function sendWillBeOverUsing($group, $overuse){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"WillOverUsingALittle",Array("overuse"=>$overuse,"username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

    public function sendIsOverUsingALot($group, $overuse){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"IsOverUsingALot",Array("overuse"=>$overuse,"username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

    public function sendDirectDebitNotification($group, $howMuch){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"DirectDebitNotification",Array("howMuch"=>$howMuch,"username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

    public function setBillingUsersList($usersList, $group){
        $list = $this->doctrine->getRepository("TwakePaymentsBundle:BillingUserList")->findBy(Array("group" => $group));
        foreach ($list as $line){
            $user = $line->getUser();
            $this->doctrine->getRepository("TwakePaymentsBundle:BillingUserList")->removeUser($user);
        }
        foreach ($usersList as $newuser){
            $newList = new BillingUserList($group,$newuser);
            $this->doctrine->persist($newList);
        }
        $this->doctrine->flush();

    }

    public function sendUnpaidSubscription($group){
        $list = $this->getList($group);
        foreach ($list as $user){
            $mail = $user["mail"];
            $username = $user["username"];
            $this->mailer->send($mail,"UnpaidSubscription",Array("username"=>$username),"TwakePaymentsBundle:Mail");
        }
    }

}