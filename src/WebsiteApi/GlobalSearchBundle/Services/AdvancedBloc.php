<?php


namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;

class AdvancedBloc
{
    private $doctrine;
    private $blocservice;
    private $workspaceservice;
    private $globalresult;

    public function __construct($doctrine, $blocservice, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->blocservice = $blocservice;
        $this->workspaceservice = $workspaceservice;

    }

    public function SearchInBloc($current_user_id, $options, $channels)
    {
        
        $channel_acces = Array();
        if (!$channels && !is_array($channels)) {
            $channels_member = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember")->findBy(Array("direct" => false, "user_id" => $current_user_id));
            foreach ($channels_member as $cm) {
                $channel = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $cm->getChannelId()));
                if ($channel) {
                    $channel_acces[] = $channel;
                }
            }
        } else {
            foreach ($channels as $channel) {
                $member = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $current_user_id, "channel_id" => $channel));
                if ($member) {
                    $channel_acces[] = $channel;
                }
            }
        }

        if (isset($channel_acces) && $channel_acces != Array()) {
            $messages = $this->blocservice->search($options, $channel_acces);
            $this->globalresult = $messages;
        }

    }

    public function AdvancedBloc($current_user_id, $options, $channels)
    {

        $this->globalresult = Array();

        $this->SearchInBloc($current_user_id, $options, $channels);

        return $this->globalresult;
    }

}