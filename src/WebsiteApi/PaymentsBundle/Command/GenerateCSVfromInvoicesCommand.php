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
        //usage : php bin/console twake:generate_ics /mypath/ --nbData=5
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
        $lignes[] = array("id subscription",
            "pricing plan",
            "balance",
            "autoRenew",
            "autoPrelevement",
            "Date de début",
            "Date de fin",
            "Groupe",
            "id Groupe",
            "archivé"
        );

        $fichier_csv = fopen($pathFile, 'w+');

        fprintf($fichier_csv, chr(0xEF).chr(0xBB).chr(0xBF)); //corrige les accent pour Excel


        //recupérations de data depusi les services

        if($limit){

            $i=1;
            foreach($services->get("app.subscription_system")->getAll() as $abo){

                // /!\ if value equals 0 its display nothing
                if($abo && $i<=$limit){
                    $abo = $abo->getAsArray();
                    $lignes[]= array(
                        $abo["id"]?$abo["id"]: 0 ,
                        $abo["pricingPlan"]["id"]?$abo["pricingPlan"]["id"] : 0,
                        $abo["balance"] ? $abo["balance"]  : 0,
                        $abo["autoRenew"]? $abo["autoRenew"] : 0,
                        $abo["autoWithdrawable"]?$abo["autoWithdrawable"]:0,
                        $abo["startDate"]?date("c",$abo["startDate"]):0,
                        $abo["endDate"]?date("c",$abo["endDate"]):0,
                        $abo["group"]["name"]?$abo["group"]["name"]:"NULL",
                        $abo["group"]["id"] ? $abo["group"]["id"] : 0,
                        $abo["archived"] ? $abo["archived"] : 0
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