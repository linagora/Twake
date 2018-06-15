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
    private $templating;

    public function __construct($doctrine, $templating)
    {
        $this->templating = $templating;
    }

    public function makeBillPDF($data)
    {
        $html =  $this->templating->render(
            "TwakePaymentsBundle:Pdf:bill.html.twig",
            $data
        );
        $name = $data["bill_id"].".pdf";

        $this->makePDFFromHtml($html,$name);

        return $name;
    }

    public function makePDFFromHtml($html, $name){
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);

        $dompdf->setPaper('A4', 'portrait');

        $dompdf->render();

        $output = $dompdf->output();
        file_put_contents($name, $output);

        return $name;
    }

    public function makeUsageStatPDF($data)
    {
        // TODO: Implement makeUsageStatPDF() method.
    }
}