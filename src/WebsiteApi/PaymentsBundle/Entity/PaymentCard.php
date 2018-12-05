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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
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