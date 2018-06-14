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
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * Receipt
 *
 * @ORM\Table(name="receipt_entity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\ReceiptRepository")
 */
class Receipt
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="datetime")
     */
    private $issueDate;

    /**
     * @ORM\Column(type="datetime")
     */
    private $startDateOfService;
    /**
     * @ORM\Column(type="string", length=255)
     */
    private $billId;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\PaymentsBundle\Entity\GroupIdentity")
     */
    private $groupIdentity;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $pricingPlan;
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance")
     */
    private $groupPricingInstance;

    /**
     * @ORM\Column(type="text")
     */
    private $groupPeriods;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $discount;
}