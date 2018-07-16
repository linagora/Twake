<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 13/06/18
 * Time: 14:14
 */

namespace WebsiteApi\PaymentsBundle\Entity;


class PaymentCard
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="string")
     */
    private $card_type;

    /**
     * @ORM\Column(type="string")
     */
    private $card_number;


}