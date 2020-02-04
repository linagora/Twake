<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;


class DbStressTestCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:db_stress_test");
    }


    protected function execute(InputInterface $input, OutputInterface $output)
    {
        return;

        $services = $this->getApplication()->getKernel()->getContainer();
        $manager = $services->get('app.twake_doctrine');

        $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array());

        $time = microtime(true);
        $d = date("U");
        for ($i = 0; $i < 1000000; $i++) {
            $pseudo = "stress_test_" . $d . "_" . $i;
            $password = "1234567890DSQKL$$";
            $mail = $pseudo . "@twakeapp.com";
            $user = $services->get("app.user")->subscribeInfo($mail, $password, $pseudo, "", "", "", "", "fr", "stress_test", true);

            $levelRepository = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
            $level = $levelRepository->findOneBy(Array("workspace" => $workspace));
            $member = new WorkspaceUser($workspace, $user, $level->getId());
            $manager->persist($member);
            $manager->flush();

            if ($i % 100 == 0 && $i > 0) {
                error_log($i);
                error_log("> " . (microtime(true) - $time));
                sleep(4);
                $time = microtime(true);
            }
        }

    }


}