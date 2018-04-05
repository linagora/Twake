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

			new WebsiteApi\CoreBundle\TwakeCoreBundle(),
			new WebsiteApi\UsersBundle\TwakeUsersBundle(),
			new WebsiteApi\EventsBundle\TwakeEventsBundle(),
			new WebsiteApi\WorkspacesBundle\TwakeWorkspacesBundle(),
			new WebsiteApi\PaymentsBundle\TwakePaymentsBundle(),
			new WebsiteApi\UploadBundle\TwakeUploadBundle(),
			new WebsiteApi\TagsBundle\TwakeTagsBundle(),
			new WebsiteApi\DiscussionBundle\TwakeDiscussionBundle(),
	        new WebsiteApi\CallsBundle\TwakeCallsBundle(),
			new Website\PublicBundle\WebsitePublicBundle(),
			new Administration\GeneralBundle\AdministrationGeneralBundle(),
			new Gos\Bundle\WebSocketBundle\GosWebSocketBundle(),
			new Gos\Bundle\PubSubRouterBundle\GosPubSubRouterBundle(),
	        new RedjanYm\FCMBundle\RedjanYmFCMBundle(),
	        new RMS\PushNotificationsBundle\RMSPushNotificationsBundle(),
	        new Krlove\AsyncServiceCallBundle\KrloveAsyncServiceCallBundle(),
	        new Nelmio\ApiDocBundle\NelmioApiDocBundle(),
            new WebsiteApi\MarketBundle\TwakeMarketBundle(),
            new WebsiteApi\DriveBundle\TwakeDriveBundle(),
            new DevelopersApi\CheckBundle\TwakeCheckBundle(),
            new DevelopersApi\UsersBundle\DevelopersApiUsersBundle(),
            new WebsiteApi\StatusBundle\TwakeStatusBundle(),
            new WebsiteApi\CommentsBundle\TwakeCommentsBundle(),
            new DevelopersApi\DriveBundle\DevelopersApiDriveBundle(),
	        new DevelopersApi\GroupsBundle\DevelopersApiGroupsBundle(),
            new Administration\AuthenticationBundle\AdministrationAuthenticationBundle(),
            new WebsiteApi\CalendarBundle\TwakeCalendarBundle(),
            new WebsiteApi\NotificationsBundle\TwakeNotificationsBundle(),
        ];

        if (in_array($this->getEnvironment(), ['dev', 'test'], true)) {
            $bundles[] = new Symfony\Bundle\DebugBundle\DebugBundle();
            $bundles[] = new Symfony\Bundle\WebProfilerBundle\WebProfilerBundle();
            $bundles[] = new Sensio\Bundle\DistributionBundle\SensioDistributionBundle();
            $bundles[] = new Sensio\Bundle\GeneratorBundle\SensioGeneratorBundle();
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
