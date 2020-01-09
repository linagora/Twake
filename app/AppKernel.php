<?php

use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Config\Loader\LoaderInterface;

define("APPPATH", realpath(dirname(__FILE__)));

class AppKernel extends Kernel
{
    public function registerBundles()
    {
        $bundles = [
			new Symfony\Bundle\FrameworkBundle\FrameworkBundle(),
			new Symfony\Bundle\SecurityBundle\SecurityBundle(),
			new Symfony\Bundle\TwigBundle\TwigBundle(),
			new Symfony\Bundle\MonologBundle\MonologBundle(),
			new Symfony\Bundle\SwiftmailerBundle\SwiftmailerBundle(),
			new Doctrine\Bundle\DoctrineBundle\DoctrineBundle(),
			new Sensio\Bundle\FrameworkExtraBundle\SensioFrameworkExtraBundle(),
			new FOS\UserBundle\FOSUserBundle(),
			new Symfony\Bundle\AsseticBundle\AsseticBundle(),
	        new EasyCorp\Bundle\EasyAdminBundle\EasyAdminBundle(),
	        new CMEN\GoogleChartsBundle\CMENGoogleChartsBundle(),
            new \Aws\Symfony\AwsBundle(),
            new Circle\RestClientBundle\CircleRestClientBundle(),
            new TweedeGolf\PrometheusBundle\TweedeGolfPrometheusBundle(),

			new WebsiteApi\CoreBundle\TwakeCoreBundle(),
			new WebsiteApi\UsersBundle\TwakeUsersBundle(),
			new WebsiteApi\WorkspacesBundle\TwakeWorkspacesBundle(),
			new WebsiteApi\PaymentsBundle\TwakePaymentsBundle(),
			new WebsiteApi\UploadBundle\TwakeUploadBundle(),
			new WebsiteApi\DiscussionBundle\TwakeDiscussionBundle(),
            new WebsiteApi\ChannelsBundle\TwakeChannelsBundle(),
			new Gos\Bundle\WebSocketBundle\GosWebSocketBundle(),
			new Gos\Bundle\PubSubRouterBundle\GosPubSubRouterBundle(),
	        new Nelmio\ApiDocBundle\NelmioApiDocBundle(),
            new WebsiteApi\MarketBundle\TwakeMarketBundle(),
            new WebsiteApi\DriveBundle\TwakeDriveBundle(),
            new WebsiteApi\GlobalSearchBundle\TwakeGlobalSearchBundle(),
            new WebsiteApi\DriveUploadBundle\TwakeDriveUploadBundle(),
            new WebsiteApi\CalendarBundle\TwakeCalendarBundle(),
            new WebsiteApi\TasksBundle\TwakeTasksBundle(),
            new WebsiteApi\NotificationsBundle\TwakeNotificationsBundle(),
            new DevelopersApiV1\CoreBundle\DevelopersApiV1CoreBundle(),
            new DevelopersApiV1\MessagesBundle\DevelopersApiV1MessagesBundle(),
            new DevelopersApiV1\UsersBundle\DevelopersApiV1UsersBundle(),
            new DevelopersApiV1\ChannelsBundle\DevelopersApiV1ChannelsBundle(),
            new DevelopersApiV1\GeneralBundle\DevelopersApiV1GeneralBundle(),
            new DevelopersApiV1\CalendarBundle\DevelopersApiV1CalendarBundle(),
            new DevelopersApiV1\DriveBundle\DevelopersApiV1DriveBundle(),
            new DevelopersApiV1\TasksBundle\DevelopersApiV1TasksBundle(),

            new AdministrationApi\CoreBundle\AdministrationApiCoreBundle(),
            new AdministrationApi\UsersBundle\AdministrationApiUsersBundle(),
            new AdministrationApi\WorkspacesBundle\AdministrationApiWorkspacesBundle(),
            new AdministrationApi\AppsBundle\AdministrationApiAppsBundle(),
            new AdministrationApi\CounterBundle\AdministrationApiCounterBundle(),
            new AdministrationApi\GroupBundle\AdministrationApiGroupBundle(),
            new Sentry\SentryBundle\SentryBundle(),
        ];

        if (in_array($this->getEnvironment(), ['dev', 'test'], true)) {
            $bundles[] = new Symfony\Bundle\DebugBundle\DebugBundle();
            $bundles[] = new Symfony\Bundle\WebProfilerBundle\WebProfilerBundle();
            $bundles[] = new Sensio\Bundle\DistributionBundle\SensioDistributionBundle();
        }

        return $bundles;
    }

    public function getRootDir()
    {
        return __DIR__;
    }

    public function getCacheDir()
    {
        return dirname(__DIR__).'/var/cache/'.$this->getEnvironment();
    }

    public function getLogDir()
    {
        return dirname(__DIR__).'/var/logs';
    }

    public function registerContainerConfiguration(LoaderInterface $loader)
    {
        $loader->load($this->getRootDir().'/config/config_'.$this->getEnvironment().'.yml');
    }
}
