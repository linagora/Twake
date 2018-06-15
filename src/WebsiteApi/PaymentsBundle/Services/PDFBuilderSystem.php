<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 14:59
 */

namespace WebsiteApi\PaymentsBundle\Services;


use Dompdf\Dompdf;
use WebsiteApi\PaymentsBundle\Model\PDFBuilderInterface;

class PDFBuilderSystem implements PDFBuilderInterface
{
    public function makeBillPDF($data)
    {
        // TODO: Implement makeBillPDF() method.
    }

    public function makePDFFromHtml($html, $name){
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);

        $dompdf->setPaper('A4', 'portrait');

        $dompdf->render();

        $output = $dompdf->output();
        file_put_contents($name, $output);
    }

    public function makeUsageStatPDF($data)
    {
        // TODO: Implement makeUsageStatPDF() method.
    }
}