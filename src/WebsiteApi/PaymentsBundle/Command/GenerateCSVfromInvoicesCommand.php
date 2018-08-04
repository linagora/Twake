<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/07/18
 * Time: 14:13
 */

namespace WebsiteApi\PaymentsBundle\Command;


use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;

class GenerateCSVfromInvoicesCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        //usage : php bin/console twake:generate_ics /mypath --nbData=5
        $this
            ->setHelp('usage : php bin/console twake:generate_ics [myPath] --nb={number}')
            ->setName("twake:generate_ics")
            ->setDescription("Generate an ICS file with payment data")
            ->addArgument('pathFile', InputArgument::OPTIONAL, 'Path for file')
            ->addOption(
                'nbData',
                null,
                InputOption::VALUE_REQUIRED,
                'How many data should be printed?',
                10
            )
        ;


    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {



        $DEFAULT_PATH = 'factures.csv';
        $delimiteur = "\t"; // ; ou , ou tab
        $len = strlen("a.csv");

        //services to get data
        $services = $this->getApplication()->getKernel()->getContainer();


        //check path

        $input->getArgument('pathFile') ?
            $pathFile = $input->getArgument('pathFile') :
            $pathFile = $DEFAULT_PATH;

        $string_end = substr($pathFile, strlen($pathFile) - $len);

        //vérfifie que la fin est bien pour un fichier csv, sinon créé une fin par défaut
        if(!preg_match("/[a-zA-Z]+.csv/", $string_end)){
            $pathFile .= "Factures.csv";
        }

        //check option
        $limit = $input->getOption('nbData');

        //data
        $lignes[] = array(
            "id subscription",
            "bill id ",
            "pricing plan",
            "month price",
            "year price",
            "discount",
            "Start date",
            "Issue date",
            "Group",
            "id Group",

        );

        $fichier_csv = fopen($pathFile, 'w+');

        fprintf($fichier_csv, chr(0xEF).chr(0xBB).chr(0xBF)); //corrige les accent pour Excel


        //recupérations de data depusi les services

        if($limit){

            $i=1;
            foreach($services->get("app.billing")->getAllReceipt() as $receipt){

                // /!\ if value equals 0 its display nothing
                if($receipt && $i<=$limit){

                    $rEntity = $receipt;
                    $receipt = $receipt->getAsArray();
                    $lignes[]= array(
                        $receipt["id"]?$receipt["id"]: 0 ,
                        $receipt["bill_id"] ? $receipt["bill_id"] : 0 ,

                        $receipt["label"]?$receipt["label"] : 0,

                        $receipt["month_price"] ? $receipt["month_price"] : 0,
                        $receipt["year_price"] ? $receipt["year_price"] : 0,

                        $receipt["discount"]? $receipt["discount"] : 0,
                        $receipt["start_date_of_service"]?$receipt["start_date_of_service"]:0,
                        $receipt["issue_date"]?$receipt["issue_date"]: 0,
                        $rEntity->getGroupIdentity()->getGroup()->getName()? $rEntity->getGroupIdentity()->getGroup()->getName():"NULL",
                        $rEntity->getGroupIdentity()->getId() ? $rEntity->getGroupIdentity()->getId() : 0,

                    );
                    $i++;
                }

            }

        }else{
            //pas de limite donc par défaut on récupère tout ?
            //limit est require + default
        }



        // Boucle foreach sur chaque ligne du tableau
        foreach($lignes as $ligne){
            // chaque ligne en cours de lecture est insérée dans le fichier
            // les valeurs présentes dans chaque ligne seront séparées par $delimiteur
            fputcsv($fichier_csv, $ligne, $delimiteur);
        }

        fclose($fichier_csv);
    }

}