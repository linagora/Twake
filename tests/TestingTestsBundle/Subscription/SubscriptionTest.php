<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 14/06/18
 * Time: 09:32
 */

namespace Tests\TestingTestsBundle\Subscription;


use Tests\WebTestCaseExtended;
use WebsiteApi\WorkspacesBundle\Entity\PricingPlan;

class SubscriptionTest extends WebTestCaseExtended
{


    public function testIndex()
    {

        //détruire les données avant de refaire les tests

        //init de datas qui peuvent être utiles

        $pricing_plan = new Pricingplan("testPHP");
        $pricing_plan->setMonthPrice(100);
        $pricing_plan->setYearPrice(1200);
        $this->getDoctrine()->persist($pricing_plan);
        $this->getDoctrine()->flush();

        $pricing_plan_id = $pricing_plan->getId();
        var_dump($pricing_plan_id);

        $this->InitScenario("benoit.tallandier@telecomnancy.net", "Benoit", "riri",
            "gp_test", "ws_test", 3);
        $this->addMember("damien.vantourout@telecomnancy.net", "Paulo", "fifi", 1);
        $this->addMember("dylan.acary@telecomnancy.net", "Dylan", "loulou", 1);
        $this->addMember("xavier.farchetto@telecomnancy.net", "Fourchette&Couteaux", "toto", 1);
        $this->addMember("thimene.marmorat@telecomnancy.net", "Titi", "titi", 1);
        $this->addMember("zoe.geoffroy@telecomnancy.net", "Zoé", "zozo", 1);
        $this->addMember("lucie.martin@telecomnancy.net", "Lulu", "lulu", 1);
        $this->addMember("romaric.mourgues@twakeapp.com", "Grand Manitou", 1, 1);

        $list = [1, 3, 5, 7, 3, 2, 1, 1];
        for ($i = 1; $i <= 20; $i++)
            $this->DayByDayScenario($list, $i);

        $gp = $this->get("app.subscription_system")->getGroupPeriod(1);
        $startAt = $gp->getPeriodStartedAt();
        $startAt->sub(new \DateInterval("P1M"));
        $gp->setPeriodStartedAt($startAt);
        $this->getDoctrine()->persist($gp);
        $this->getDoctrine()->flush();



        $this->EndScenario();




        $user = $this->newUserByName("phpunit");
        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        $group = $this->newGroup($user->getId());
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        $work = $this->newWorkspace($group->getId());
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();


        try {

            $subscription = $this->newSubscription($group, $pricing_plan, $pricing_plan->getMonthPrice(), new \DateTime('now'), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false);
            $this->getDoctrine()->persist($subscription);
            $this->getDoctrine()->flush();

        } catch (\Exception $e) {
            \Monolog\Handler\error_log("Pb avec l'init de subscription, error log : " . $e->getTraceAsString());
        }


        // methods Subscription
        $log = "";
        $log .=$this->assertInit($subscription, $pricing_plan)."\n";
        $log .= $this->assertConsoUsuelle($subscription)."\n";
        $log .= $this->assertConsoDepasse($subscription)."\n";
        $log .= $this->assertRenewUp($subscription)."\n";
        $log .= $this->assertRenewDown($subscription)."\n";
        $log .= $this->assertCheckEndPeriod($group,$pricing_plan)."\n";
        //$log .= $this->assertUpdateLockDate($group,$work). "\n";
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

    //shell_exec('date +%Y%m%d -s "20081128"')
    //shell_exec('date +%Y%m%d -s "'.date("Ymd", date("U")+60*60*24).'"')
    /**
     * shell_exec('date')
    string(29) "Wed Mar  6 14:18:08 PST 2013\n"
    > exec('date')
    string(28) "Wed Mar  6 14:18:12 PST 2013"

     */

    //exec('sudo -u root -S {{ your command }} < ~/.sudopass/sudopass.secret');
    /**
     * https://github.com/wolfcw/libfaketime pour les tests de date ( à installer en lcoal )
     * @throws \Exception
     */
    /*public function assertUpdateLockDate(){

        $user = $this->newUserByName("phpunit2");
        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        $group = $this->newGroup($user->getId());
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        $pricing_plan = new \WebsiteApi\WorkspacesBundle\Entity\Pricingplan("testPHPLock");
        $pricing_plan->setMonthPrice(100);
        $pricing_plan->setYearPrice( 1200);
        $this->getDoctrine()->persist($pricing_plan);
        //$this->getDoctrine()->flush();
        try{

            $subscription = $this->newSubscription($group,$pricing_plan, $pricing_plan->getMonthPrice(), (new \DateTime('now'))->sub(new \DateInterval("P5D")), (new \DateTime('now'))->add(new \DateInterval("P1M")), false, false);
            $this->getDoctrine()->persist($subscription);
            $this->getDoctrine()->flush();

        }catch(\Exception $e){
            \Monolog\Handler\error_log("Pb avec l'init de subscription, error log : ".$e->getTraceAsString());
        }


        $test2= $this->get("app.subscription_system")->addBalanceConsumption( 3000,$subscription->getGroup());

        $test3= $this->get("app.subscription_system")->get($subscription->getGroup());

        $testOverUsing = $this->get("app.subscription_manager")->checkOverusingByGroup($subscription->getGroup());


        //Deplacer la date de 5 jours et faire les tests suivant :

        $testLocked = $this->get("app.subscription_manager")->checkLocked();

        $this->assertTrue(count($testLocked)>0 , " Count doit être au moins de 1, il est de ".count($testLocked));

        //modif de la date en bd

        $testLockDate = $this->get("app.subscription_system")->testChangeLockDate($group);

        $this->assertTrue($this->get("app.subscription_manager")->checkLocked()[$subscription->getGroup()->getId()],"Doit être true car lock avec le overusing");


        var_dump($testLockDate);

        //print de la date d'aujourdhui
    /**
        var_dump((new \DateTime('now'))->format("Ymd"));
        //modif de la date pour le jour de demain
        $dateFuture = ((new \DateTime('now'))->add(new \DateInterval("P10D")))->format("Ymd");

        // $dateModif = shell_exec('sudo -u root -S date +%Y%m%d -s "'.$dateFuture.'" < ~/.sudopass/sudopass.secret' );

       // var_dump(shell_exec('cat ~/.sudopass/sudopass.secret'));
        var_dump(shell_exec(" ./changeDate.sh"));
        //print pour la date modif
        //var_dump($dateModif);
        var_dump((new \DateTime('now'))->format("Ymd"));
        var_dump(shell_exec('date '));
    */
    //}


    public function InitScenario($user_mail, $pseudo, $password,$group_name, $workspace_name, $pricing_plan){
        $token = $this->get("app.user")->subscribeMail($user_mail);
        $user = $this->get("app.user")->subscribe($token, null, $pseudo, $password, true);

        $uniquename = $this->get("app.string_cleaner")->simplify($group_name);
        $group = $this->get("app.groups")->create($user->getId(), $group_name, $uniquename, $pricing_plan);

        $groupId = $group->getId();
        $this->get("app.workspaces")->create($workspace_name, $groupId, $user->getId());
    }

    public function addMember($user_mail, $pseudo, $password, $workspace_id){
        $token = $this->get("app.user")->subscribeMail($user_mail);
        $user = $this->get("app.user")->subscribe($token, null, $pseudo, $password, true);

        $this->get("app.workspace_members")->addMember($workspace_id, $user->getId(), false, null, null);
    }

    public function DayByDayScenario($list, $day){
        for ($i = 0; $i < count($list); $i++) {
            $group = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupUser")->findOneBy(Array("user" => $i + 1));
            if ($group == null)
                break;
            if (($day % $list[$i]) == 0) {
                $group->increaseConnectionsPeriod();
                $this->getDoctrine()->persist($group);
            }
        }
        $this->getDoctrine()->flush();
    }


    public function EndScenario(){



        $this->get("app.pricing_plan")->dailyDataGroupUser();
        $this->get("app.pricing_plan")->groupPeriodUsage();
    }
}