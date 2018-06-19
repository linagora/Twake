<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 14/06/18
 * Time: 09:32
 */

namespace Tests\TestingTestsBundle\Subscription;


use Tests\WebTestCaseExtended;

class SubscriptionTest extends WebTestCaseExtended
{


    public function testIndex(){

        //détruire les données avant de refaire les tests

        //init de datas qui peuvent être utiles

        $user = $this->newUserByName("phpunit");
        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        $group = $this->newGroup($user->getId());
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        $work = $this->newWorkspace($group->getId());
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();

        $pricing_plan = new \WebsiteApi\WorkspacesBundle\Entity\Pricingplan("testPHP");
        $pricing_plan->setMonthPrice(100);
        $pricing_plan->setYearPrice( 1200);
        $this->getDoctrine()->persist($pricing_plan);
        //$this->getDoctrine()->flush();
        try{

            $subscription = $this->newSubscription($group,$pricing_plan, $pricing_plan->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false);
            $this->getDoctrine()->persist($subscription);
            $this->getDoctrine()->flush();

        }catch(\Exception $e){
            \Monolog\Handler\error_log("Pb avec l'init de subscription, error log : ".$e->getTraceAsString());
        }


        // methods Subscription
        $log = "";
        $log .=$this->assertInit($subscription, $pricing_plan)."\n";
        $log .= $this->assertConsoUsuelle($subscription)."\n";
        $log .= $this->assertConsoDepasse($subscription)."\n";
        $log .= $this->assertRenewUp($subscription)."\n";
        $log .= $this->assertRenewDown($subscription)."\n";
        $log .= $this->assertCheckEndPeriod($group,$pricing_plan)."\n";
        //$log .= $this->casBatard();

       var_dump($log);
    }

    //app.subscription_manager
    /**
     * Scénario : un utilisateur est créé, il a un group qui correspond, il possède un premier abonnement qui est créé
     *  Vérifcation des données de base
     */
    public function assertInit($sub, $pricing_plan){
        $result = ($this->get("app.subscription_system")->get($sub->getGroup()->getId()));
        $this->assertTrue($result!=null, "Result ne doit pas être null, Id non présent dans la table");

        $arraySub = $result->getAsArray();

        $this->assertTrue($pricing_plan->getId() == $arraySub["pricingPlan"]["id"], " Pricing plan doivent être les mêmes");
        $this->assertTrue($sub->getId() == $arraySub["id"], "Les id doivent être les mêmes ");
        $this->assertTrue($sub->getGroup()->getId() == $arraySub["group"]["id"], " Les groupees doivent être les memes" );
        $this->assertTrue($sub->getBalance() == $arraySub["balance"], "Les balances doivent être les memes ");
        $this->assertTrue($sub->getBalanceConsumed() == $arraySub["balanceConsumed"], "Les balances de consommation doivent être les memes");
        $this->assertTrue($arraySub["autoRenew"] == false, " Doit être à faux");
        $this->assertTrue($arraySub["autoWithdrawable"] == false,"DOit être à faux");

        $log = "Le scénario d'initialisation s'est bien déroulé. Un utilisateur a été créé. Un groupe lui est associé. Un abonnement a été créé. \n";

        return $log;
    }


    /**
     * Consommation usuelle d'un abonnement
     */
    public function assertConsoUsuelle($sub){

        $test1= $this->get("app.subscription_system")->get($sub->getGroup());
        $this->assertTrue($test1 != null, " ne doit pas être faux, id non présent dans la db");

        $this->assertTrue($test1->getBalanceConsumed()==0, "Test1 : ". $test1->getBalanceConsumed());
        $test2= $this->get("app.subscription_system")->addBalanceConsumption(100 ,$sub->getGroup());

        $test3= $this->get("app.subscription_system")->get($sub->getGroup()->getId());

        $this->assertTrue(($test3->getBalanceConsumed() == 100), " Test 3 ". $test3->getBalanceConsumed());

        $testOverUsing = $this->get("app.subscription_manager")->checkOverusingByGroup($sub->getGroup());

        $this->assertTrue($testOverUsing==12, "Doit être vrai car ne génère pas de dépassement");

        $log = "Le scénario de vérification de la consommation usuelle s'est bien déroulé. L'utilisateur a bien un solde initialement nul. Il a consommé 100 unités et il n'est pas en surconsommation. \n";

        return $log;
    }

    /**
     * consommation d'un abonnement mais qui dépasse
     */
    public function assertConsoDepasse($sub){

        $test1= $this->get("app.subscription_system")->get($sub->getGroup());
        $this->assertTrue($test1 != null, " ne doit pas être faux, id non présent dans la db");

        $this->assertTrue($test1->getBalanceConsumed()==100, "Test1 : ". $test1->getBalanceConsumed());

        $test2= $this->get("app.subscription_system")->addBalanceConsumption(500 ,$sub->getGroup());
        $test3= $this->get("app.subscription_system")->get($sub->getGroup());

        //un petit peu
        $this->assertTrue(($test3->getBalanceConsumed() == 600));

        $testOverUsing = $this->get("app.subscription_manager")->checkOverusingByGroup($sub->getGroup());

        $this->assertTrue($testOverUsing==10, "Doit être vrai car génère petit depassement");

        //beaucoup
        $test1= $this->get("app.subscription_system")->get($sub->getGroup());
        $this->assertTrue($test1 != null, " ne doit pas être faux, id non présent dans la db");


        $this->assertTrue($test1->getBalanceConsumed()==600, "Test1 : ". $test1->getBalanceConsumed());

        $test2= $this->get("app.subscription_system")->addBalanceConsumption( 3000,$sub->getGroup());
        $test3= $this->get("app.subscription_system")->get($sub->getGroup());

        $this->assertTrue(($test3->getBalanceConsumed() == 3600));


        $testOverUsing = $this->get("app.subscription_manager")->checkOverusingByGroup($sub->getGroup());

        $this->assertTrue($testOverUsing==9, "Doit être vrai car génère gros depassement");

        //Deplacer la date de 5 jours et faire le test suivant :
        //$this->assertTrue($this->get("app.subscription_manager")->checkLocked()[$sub->getGroup()->getId()],"Doit être true car lock avec le overusing");

        $log = "Le scénario de consommation d'un abonnement avec dépassement s'est bien déroulé. Le solde de la consommation initiale est de 100 unités. On ajoute une consommation de 500 unités 
        pour avoir un petit dépassement. On gère les petits dépassements. On ajoute une consommation de 3 000 unités pour avoir un ENOME dépassement. On gère les gros dépassements. \n";

        return $log;

    }

    /**
     * renouvellement d'un abonnement ( archivage de l'ancien et nouveau abo )
     */
    public function assertRenewUp($sub){

        $pricing_plan_cher = new \WebsiteApi\WorkspacesBundle\Entity\PricingPlan("testCher");
        $pricing_plan_cher->setMonthPrice(1000);
        $pricing_plan_cher->setYearPrice(12000);
        $this->getDoctrine()->persist($pricing_plan_cher);
        $this->getDoctrine()->flush();

        try{
            $cost = $sub->getBalance()+$this->get("app.subscription_system")->getRemainingBalance($sub->getGroup());
           $bill =  $this->get("app.subscription_manager")->renew($sub->getGroup(),$pricing_plan_cher, $pricing_plan_cher->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false,$cost);

        }catch(\Exception $e){
            \Monolog\Handler\error_log("Pb avec renew de subscription, error log : ".$e->getTraceAsString());
        }

        $this->assertTrue($bill != null);
        $result = ($this->get("app.subscription_system")->get($sub->getGroup()));
        $this->assertTrue($result!=null, "Result ne doit pas être null, Id non présent dans la table");

        $arraySub = $result->getAsArray();

        $this->assertTrue($pricing_plan_cher->getId() == $arraySub["pricingPlan"]["id"], " Pricing plan doivent être les mêmes");
        $this->assertTrue($sub->getId() != $arraySub["id"], "Les id ne doivent pas être les mêmes ");
        $this->assertTrue($sub->getGroup()->getId()== $arraySub["group"]["id"], " Les groupees doivent être les memes" );
        $this->assertTrue($arraySub["autoRenew"] == false, " Doit être à faux");
        $this->assertTrue($arraySub["autoWithdrawable"] == false,"DOit être à faux");

        $log = "Le scénario du renouvellement d'un abonnement à la hausse s'est bien déroulé. On archive l'ancien abonnement et on en crée un nouveau. Les prix annuel et mensuel sont désormais de 12 000 et 1 000 unités. 
        Le renouvellement d'abonnement et le prévlèvement ne sont pas automatiques.\n";

        return $log;
    }

    /**
     * renouvellement d'un abonnement revue à la baisse
     */
    public function assertRenewDown($sub){


        $pricing_plan = new \WebsiteApi\WorkspacesBundle\Entity\Pricingplan("testPHPpasCher");
        $pricing_plan->setMonthPrice(10);
        $pricing_plan->setYearPrice( 120);
        $this->getDoctrine()->persist($pricing_plan);
        //$this->getDoctrine()->flush();
        try{
            $cost = $sub->getBalance()+$this->get("app.subscription_system")->getRemainingBalance($sub->getGroup());
            $bill =  $this->get("app.subscription_manager")->renew($sub->getGroup(),$pricing_plan, $pricing_plan->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false,$cost);

        }catch(\Exception $e){
            \Monolog\Handler\error_log("Pb avec renew de subscription, error log : ".$e->getTraceAsString());
        }

        $this->assertTrue($bill != null);
        $result = ($this->get("app.subscription_system")->get($sub->getGroup()));
        $this->assertTrue($result!=null, "Result ne doit pas être null, Id non présent dans la table");

        $arraySub = $result->getAsArray();

        $this->assertTrue($pricing_plan->getId()== $arraySub["pricingPlan"]["id"], " Pricing plan doivent être les mêmes");
        $this->assertTrue($sub->getId() != $arraySub["id"], "Les id ne doivent pas être les mêmes ");
        $this->assertTrue($sub->getGroup()->getId()== $arraySub["group"]["id"], " Les groupees doivent être les memes" );
        $this->assertTrue($arraySub["autoRenew"] == false, " Doit être à faux");
        $this->assertTrue($arraySub["autoWithdrawable"] == false,"Doit être à faux");

        $log = "Le scénario de renouvellement à la baisse s'est bien déroulé. On archive l'ancien abonnement et on en crée un nouveau. 
        Les prix annuel et mensuel sont désormais de 120 et 10 unités. Le renouvellement d'abonnement et le prévlèvement ne sont pas automatiques\n";

        return $log;

    }

    public function assertCheckEndPeriodSpecPeriod($group,$pricing_plan, $time, $expectedCode){
        $dateInterval = new \DateInterval($time);
        $subscription = $this->newSubscription($group,$pricing_plan, $pricing_plan->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add($dateInterval), false, false);
        $code = $this->get("app.subscription_manager")->checkEndPeriodByGroup($group);
        $this->assertTrue($expectedCode==$code);

    }

    public function assertCheckEndPeriod($group,$pricing_plan){
        /*
         * 1 : bill mail
         * 2 : unpaid mail
         * 3 : 2 month left
         * 4 : 1 month left
         * 5 : 15 days left
         * 6 : 7 days left
         * 7 : 1 day left*/
        $this->assertCheckEndPeriodSpecPeriod($group,$pricing_plan,"P2M",3);
        $this->assertCheckEndPeriodSpecPeriod($group,$pricing_plan,"P1M",4);
        $this->assertCheckEndPeriodSpecPeriod($group,$pricing_plan,"P15D",5);
        $this->assertCheckEndPeriodSpecPeriod($group,$pricing_plan,"P7D",6);
        $this->assertCheckEndPeriodSpecPeriod($group,$pricing_plan,"P1D",7);

        $log = "Le scénario de vérification d'envoie de mail en cas d'approche d'une fin d'abonnement s'est bien déroulé. Si on est à 2 mois, 1 mois, 15 jours, 7 jours ou 1 jour de la fin de l'abonnement, 
        on envoie un mail au client. Et on vérifie que ce mail a bien été envoyé.";

        return $log;
    }

    /**


    public function assertUpdateLockDate(){

    // Verif que la lockdate est mise à jour sur demande ( récupérer groupIdentity )

    $result = ($this->get("service.subscriptionSystem")->get($sub->getId()))->getAsArray();
    assert($result != null, "Result ne doit pas être null, Id non présent ");

    $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
    $identity = $groupIdentityRepo->findOneBy(Array("group"=>$sub->getGroup()->getId()));

    assert($groupIdentityRepo != null && $identity != null);
    $oldLock = $identity->getLockDate();
    $dateLock = (new \DateTime('now'))->add(new \DateInterval("P5D"));
    assert($oldLock == null, "ancienne date doit etre null car non lock par defaut au départ");

    $result = ($this->get("service.subscriptionSystem")->updateLockDate($sub->getGroup->getId()));

    $identity = $groupIdentityRepo->findOneBy(Array("group"=>$sub->getGroup()->getId()));

    assert(($dateLock->getTimestamp() - $identity->getLockDate()) == 0, "doit être egal à 0 " ) ;

    }
     */
}