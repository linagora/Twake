<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/06/18
 * Time: 14:15
 */

namespace WebsiteApi\PaymentsBundle\Entity;


use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * GroupIdentity
 *
 * @ORM\Table(name="group_identity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\GroupIdentityRepository")
 */
class GroupIdentity
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
     */
    private $group;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $billingaddress;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $address;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $mail;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $phonenumber;

    /**
     * @ORM\Column(type="twake_datetime", nullable=true)
     */
    private $lockdate;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $havealreadysendisoverusingalotmail;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $havealreadysendisoverusingalittlemail;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $havealreadysendwillbeoverusingmail;

    public function __construct($group, $billingaddress, $address, $mail, $phonenumber)
    {
        $this->group = $group;
        $this->billingaddress = $billingaddress;
        $this->address = $address;
        $this->mail = $mail;
        $this->phonenumber = $phonenumber;
        $this->havealreadysendisoverusingalittlemail = false;
        $this->havealreadysendisoverusingalotmail = false;
        $this->havealreadysendwillbeoverusingmail = false;
    }

    /**
     * @param mixed $lockdate
     */
    public function setLockDate($lockdate)
    {
        $this->lockdate = $lockdate;
    }

    /**
     * @return mixed
     */
    public function getLockDate()
    {
        return $this->lockdate;
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @return mixed
     */
    public function getBillingAddress()
    {
        return $this->billingaddress;
    }

    /**
     * @return mixed
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * @return mixed
     */
    public function getMail()
    {
        return $this->mail;
    }

    /**
     * @return mixed
     */
    public function getPhoneNumber()
    {
        return $this->phonenumber;
    }



    public function getAsArray() {

        $group_identity =  Array(
            "id" => $this->getId(),
            "billing_address" => $this->getBillingAddress(),
            "address" => $this->getAddress(),
            "mail" => $this->getMail(),
            "phone_number" => $this->getPhoneNumber(),
            "lock_date" => $this-> getLockDate()
        );

        $group = $this->getGroup()->getAsArray();

        return array_merge($group_identity,$group);
    }

    /**
     * @return mixed
     */
    public function getHaveAlreadySendIsOverUsingALotMail()
    {
        return $this->havealreadysendisoverusingalotmail;
    }

    /**
     * @param mixed $havealreadysendisoverusingalotmail
     */
    public function setHaveAlreadySendIsOverUsingALotMail($havealreadysendisoverusingalotmail)
    {
        $this->havealreadysendisoverusingalotmail = $havealreadysendisoverusingalotmail;
    }

    /**
     * @return mixed
     */
    public function getHaveAlreadySendIsOverUsingALittleMail()
    {
        return $this->havealreadysendisoverusingalittlemail;
    }

    /**
     * @param mixed $havealreadysendisoverusingalittlemail
     */
    public function setHaveAlreadySendIsOverUsingALittleMail($havealreadysendisoverusingalittlemail)
    {
        $this->havealreadysendisoverusingalittlemail = $havealreadysendisoverusingalittlemail;
    }

    /**
     * @return mixed
     */
    public function getHaveAlreadySendWillBeOverUsingMail()
    {
        return $this->havealreadysendwillbeoverusingmail;
    }

    /**
     * @param mixed $havealreadysendwillbeoverusingmail
     */
    public function setHaveAlreadySendWillBeOverUsingMail($havealreadysendwillbeoverusingmail)
    {
        $this->havealreadysendwillbeoverusingmail = $havealreadysendwillbeoverusingmail;
    }

}