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

        $user = $this->newUser("TestInit");
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

        try{

            $subscription = $this->newSubscription($group,$pricing_plan, $pricing_plan->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false);
            $this->getDoctrine()->persist($subscription);
            $this->getDoctrine()->flush();

        }catch(\Exception $e){
            \Monolog\Handler\error_log("Pb avec l'init de subscription, error log : ".$e);
        }

        for($i = 1; $i<10; $i++){

            $user = $this->newUserByName("TestUser ".$i);
            $this->getDoctrine()->persist($user);
            $this->get("app.workspace_members")->addMember($work->getId(),$user->getId());
            $this->getDoctrine()->flush();
        }


        // methods Subscription
        $log = "";
        $log .=$this->assertInit($subscription, $pricing_plan);
        $log .= $this->assertConsoUsuelle($subscription);
        $log .= $this->assertConsoDepasse($subscription);
        $log .= $this->assertRenewUp();
        $log .= $this->assertRenewDown();
        //$log .= $this->casBatard();

        \Monolog\Handler\error_log($log);
    }

    //app.subscription_manager
    /**
     * Scénario : un utilisateur est créé, il a un group qui correspond, il possède un premier abonnement qui est créé
     *  Vérifcation des données de base
     */
    public function assertInit($sub, $pricing_plan){
        $result = ($this->get("app.subscription_system")->get($sub->getGroup()->getId()));
        assertTrue($result!=null, "Result ne doit pas être null, Id non présent dans la table");

        $arraySub = $result->getAsArray();

        assertTrue($pricing_plan == $arraySub["pricingPlan"], " Pricing plan doivent être les mêmes");
        assertTrue($sub->getId() == $arraySub["id"], "Les id doivent être les mêmes ");
        assertTrue($sub->getGroup()== $arraySub["group"], " Les groupees doivent être les memes" );
        assertTrue($sub->getStartDate() == $arraySub["startDate"], "Les dates de départ doivent être les mêms ");
        assertTrue($sub->getEndDate() == $arraySub["endDate"], "Les dates de fin doivent être les memes ");
        assertTrue($sub->getBalance() == $arraySub["balance"], "Les balances doivent être les memes ");
        assertTrue($sub->getBAlanceConsumed() == $arraySub["balanceConsumed"], "Les balances de consommation doivent être les memes");
        assertTrue($arraySub["autoRenew"] == false, " Doit être à faux");
        assertTrue($arraySub["autoWithdrawable"] == false,"DOit être à faux");
        assertTrue(($arraySub["startDate"] - $arraySub["endDate"]) < 0 , "Les dates doivent être dans le bon ordre");

        assertTrue(($arraySub["pricingPlan"]["monthPrice"] == 200) && ($arraySub["pricingPlan"]["yearPrice"] == 2400), "Les données doivent être bonnes" );

        //faire un rapport de log

    }


    /**
     * Consommation usuelle d'un abonnement
     */
    public function assertConsoUsuelle($sub){

        $test1= $this->get("app.subscription_system")->get($sub->getGroup()->getId());
        $test2= $this->get("app.subscription_system")->addBalanceConsumption($sub->getGroup()->getId(), 100);
       //test de bonne réponse de tout s'est ben passé ( pas encore implémenté )
        $this->getDoctrine()->persist($sub);
        $this->getDoctrine()->flush();
        $test3= $this->get("app.subscription_system")->get($sub->getGroup()->getId());

        assertTrue(($test1 != $test3) && ($test1 == 0) && ($test3 == 100));

        //faire les check de dépassement de conso ?

        assertTrue(!($this->get("app.subscription_system")->groupIsOverUsingALittle($sub->getGroup()->getId())), "Doit être false");
        assertTrue(!($this->get("app.subscription_system")->groupIsOverUsingALot($sub->getGroup()->getId())), "Doit être false");
        assertTrue(!($this->get("app.subscription_system")->groupWillBeOVerUsing($sub->getGroup()->getId())), "Doit être false");
        assertTrue(!($this->get("app.subscription_system")->getOverCost($sub->getGroup()->getId())), "Doit être false");
    }

    /**
     * consommation d'un abonnement mais qui dépasse
     */
    public function assertConsoDepasse($sub){

        $test1= $this->get("app.subscription_system")->get($sub->getGroup()->getId());
        $test2= $this->get("app.subscription_system")->addBalanceConsumption($sub->getGroup()->getId(), 500);
        $this->getDoctrine()->persist($sub);
        $this->getDoctrine()->flush();
        $test3= $this->get("app.subscription_system")->get($sub->getGroup()->getId());

        //un petit peu
        assertTrue(($test1 != $test3) && ($test1 == 100) && ($test3 == 600));

        assertTrue(($this->get("app.subscription_system")->groupIsOverUsingALittle($sub->getGroup()->getId())), "Doit être true");
        assertTrue(!($this->get("app.subscription_system")->groupIsOverUsingALot($sub->getGroup()->getId())), "Doit être false");
        assertTrue(($this->get("app.subscription_system")->groupWillBeOVerUsing($sub->getGroup()->getId())), "Doit être true");
        assertTrue(($this->get("app.subscription_system")->getOverCost($sub->getGroup()->getId())), "Doit être true");

        //beaucoup
        $test1= $this->get("app.subscription_system")->get($sub->getGroup()->getId());
        $test2= $this->get("app.subscription_system")->addBalanceConsumption($sub->getGroup()->getId(), 3000);
        $this->getDoctrine()->persist($sub);
        $this->getDoctrine()->flush();
        $test3= $this->get("app.subscription_system")->get($sub->getGroup()->getId());

        assertTrue(($test1 != $test3) && ($test1 == 600) && ($test3 == 3600));


        assertTrue(!($this->get("app.subscription_system")->groupIsOverUsingALittle($sub->getGroup()->getId())), "Doit être false");
        assertTrue(($this->get("app.subscription_system")->groupIsOverUsingALot($sub->getGroup()->getId())), "Doit être true");
        assertTrue(($this->get("app.subscription_system")->groupWillBeOVerUsing($sub->getGroup()->getId())), "Doit être true");
        assertTrue(($this->get("app.subscription_system")->getOverCost($sub->getGroup()->getId())), "Doit être true");

        //faire le lock aussi ensuite
        assertTrue($this->get("app.subscription_system")->updateLockdate($sub->getGroup()->getId()), " ne doit pas retourner false");
        assertTrue($this->get("app.subscription_manager")->checkLocked());
    }

    /**
     * renouvellement d'un abonnement ( archivage de l'ancien et nouveau abo )
     */
    public function assertRenewUp(){
        //TODO
    }

    /**
     * renouvellement d'un abonnement revue à la baisse
     */
    public function assertRenewDown(){
        //TODO
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