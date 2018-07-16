<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/06/18
 * Time: 15:41
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface PDFBuilderInterface
{
    //@makeBillPDF make a bill from the given data
    public function makeBillPDF($data);

    //@makeUsageStatPDF  make a stat pdf from the given data
    public function makeUsageStatPDF($data);
}