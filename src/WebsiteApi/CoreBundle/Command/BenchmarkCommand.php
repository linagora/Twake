<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;


class BenchmarkCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:benchmark")
            ->setDescription("Test server performances");
    }

    //[REMOVE_ONPREMISE]
    public function initScenarios($nb = 1)
    {
        $this->scenario = [
            Array(
                "name" => "get current user",
                "times" => 2,
                "calls" => [
                    Array(
                        "service" => "app.user_stats",
                        "method" => "create",
                        "arguments" => [$this->user]
                    ),
                    Array(
                        "service" => "app.workspaces",
                        "method" => "getPrivate",
                        "arguments" => [$this->user->getId()]
                    ),
                    Array(
                        "service" => "app.workspace_members",
                        "method" => "getWorkspaces",
                        "arguments" => [$this->user->getId()]
                    )
                ]
            ),
            Array(
                "name" => "get initial workspace detail",
                "times" => 2,
                "calls" => [
                    Array(
                        "service" => "app.workspaces",
                        "method" => "get",
                        "arguments" => [$this->workspace->getId(), $this->user->getId()]
                    ),
                    Array(
                        "service" => "app.workspaces_apps",
                        "method" => "getApps",
                        "arguments" => [$this->workspace->getId()]
                    ),
                    Array(
                        "service" => "app.workspace_members",
                        "method" => "getMembers",
                        "arguments" => [$this->workspace->getId(), $this->user->getId()]
                    ),
                    Array(
                        "service" => "app.workspace_levels",
                        "method" => "getLevel",
                        "arguments" => [$this->workspace->getId(), $this->user->getId()]
                    ),
                    Array(
                        "service" => "app.pricing_plan",
                        "method" => "getLimitation",
                        "arguments" => [$this->workspace->getGroup()->getId(), "maxUser", PHP_INT_MAX]
                    )
                ]
            ),
            Array(
                "name" => "get last messages",
                "times" => 1,
                "calls" => [
                    Array(
                        "service" => "app.messages_master",
                        "method" => "getLastMessages",
                        "arguments" => [$this->user]
                    )
                ]
            ),
            Array(
                "name" => "get last files",
                "times" => 1,
                "calls" => [
                    Array(
                        "service" => "app.drive.FileSystem",
                        "method" => "listLastUsed",
                        "arguments" => [$this->workspace->getId(), 0, 20]
                    ),
                    Array(
                        "service" => "app.workspace_levels",
                        "method" => "can",
                        "arguments" => [$this->workspace->getId(), $this->user->getId(), "drive:read"]
                    )
                ]
            )
        ];

        $this->scenarios_state = Array();
        $this->scenarios_current_user = 0;

        for ($i = 0; $i < $nb; $i++) {
            $this->scenarios_state[$i] = Array(
                "current_step" => 0,
                "scenario" => $this->scenario
            );
        }
    }

    public function runScenario($services)
    {

        $user = $this->scenarios_state[$this->scenarios_current_user];
        $action = $user["scenario"][$user["current_step"]];

        foreach ($action["calls"] as $call) {
            call_user_func_array(array($services->get($call["service"]), $call["method"]), $call["arguments"]);
        }

        $this->scenarios_state[$this->scenarios_current_user]["current_step"] += 1;


        $this->scenarios_current_user++;
        if ($this->scenarios_current_user >= count($this->scenarios_state)) {
            $this->scenarios_current_user = 0;
        }

        if ($this->scenarios_current_user == 0 && $this->scenarios_state[$this->scenarios_current_user]["current_step"] >= count($this->scenarios_state[$this->scenarios_current_user]["scenario"])) {
            return false;
        }
        return true;
    }

    //[/REMOVE_ONPREMISE]

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        //[REMOVE_ONPREMISE]

        $services = $this->getApplication()->getKernel()->getContainer();

        $doctrine = $this->getContainer()->get('doctrine');
        $manager = $doctrine->getManager();

        $this->user = $manager->getRepository("TwakeUsersBundle:User")->find(1);
        $this->workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->find(2);

        $users = 2000;

        $this->initScenarios($users);

        $totalTime = 0;
        $inter = microtime(true);

        error_log("Start scenario with " . $users . " users");

        $continue = true;
        $i = 0;
        while ($continue) {
            $this->doctrine->clear();
            $continue = $this->runScenario($services);
            if ($this->scenarios_current_user == 0) {
                $interval = microtime(true) - $inter;
                error_log("Step " . $i . " (" . $this->scenario[$i]["name"] . ", counted " . $this->scenario[$i]["times"] . " times) : " . ($interval));
                $totalTime += $interval * $this->scenario[$i]["times"];
                $inter = microtime(true);
                $i++;
            }
        }

        error_log("Total : " . $totalTime);
        error_log("Users per s : " . ($users / $totalTime));
        error_log("Op per s : " . (count($this->scenario) * $users / $totalTime));

        //[/REMOVE_ONPREMISE]
    }

}