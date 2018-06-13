<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/06/18
 * Time: 15:29
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface MailSenderInterface
{
    //@sendBill send the bill to the client
    public function sendBill($group, $billFile);

    //@sendEndPeriodsMail send a mail to the client to notify him of the soon end periods
    public function sendEndPeriodsMail($group, $timeleft);

    //@sendIsOverUsingALittle send a mail to the client to notify him of his overusing (less than 1000)
    public function sendIsOverUsingALittle($group);

    //@sendWillBeOverUsing send a mail to the client to notify him of  his soon overusing
    public function sendWillBeOverUsing($group);

    //@sendIsOverUsingALot send a mail to the client to notify him of his overusing (over than 1000)
    public function sendIsOverUsingALot($group);

    //@sendGiveUsYourMoney send a mail to the client to notify him of the soon debiting
    public function sendGiveUsYourMoney($group, $howMuch);

    //@setBillingUsersList set the list of users which will be notified of financial events
    public function setBillingUsersList($usersList);
}