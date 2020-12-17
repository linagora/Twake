<?php

namespace Twake\Workspaces\Services;

use Twake\Workspaces\Entity\AppPricingInstance;
use Twake\Workspaces\Entity\ClosedGroupPeriod;
use Twake\Workspaces\Entity\GroupManager;
use Twake\Workspaces\Entity\GroupPeriod;
use Twake\Workspaces\Entity\GroupPricingInstance;
use Twake\Workspaces\Model\GroupPeriodInterface;
use App\App;
class GroupPeriods
{

    private $doctrine;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
    }

    public function init($group, $pricing_plan)
    {
        $groupPeriodRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupPeriod");

        $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

        if ($groupPeriod) {
            return false;
        } else {
            $groupPricing = new GroupPricingInstance($group, "monthly", $pricing_plan);
            $date = new \DateTime();
            $date->modify('+1 month');
            $groupPricing->setEndAt($date);
            $groupPeriod = new GroupPeriod($group, $groupPricing);
            $groupPeriod->setGroupPricingInstance($groupPricing);

            $this->doctrine->persist($groupPricing);
            $this->doctrine->persist($groupPeriod);
            $this->doctrine->flush();
            return true;
        }
    }
}