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
    public function getId();

    public function getRepository();

    public function getAsArray();

    public function getAsArrayFormated();

    public function synchroniseField($fieldName, $value);

    public function finishSynchroniseField($data);

    public function get($fieldName);

    public function getPushRoute();
}