<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 16/07/18
 * Time: 09:48
 */

namespace WebsiteApi\ObjectLinksBundle\Model;


interface ObjectLinksInterface
{

    public function getRepository();

    public function getAsArrayFormated();
}