<?php


namespace Twake\GlobalSearch\Services;

use App\App;

class AdvancedBloc
{
    private $doctrine;
    private $blocservice;
    private $workspaceservice;
    private $globalresult;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->blocservice = $app->getServices()->get("globalsearch.messagebloc");
        $this->workspaceservice = $app->getServices()->get("app.workspaces");
    }

    public function AdvancedBloc($current_user_id, $options, $channels)
    {
        $this->globalresult = Array();
        $this->SearchInBloc($current_user_id, $options, $channels);
        return $this->globalresult;
    }

    public function SearchInBloc($current_user_id, $options, $channels)
    {

        $channel_acces = Array();
        if (!$channels && !is_array($channels)) {
            $channels_member = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findBy(Array("direct" => false, "user_id" => $current_user_id));
            foreach ($channels_member as $cm) {
                $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $cm->getChannelId()));
                if ($channel) {
                    $channel_acces[] = $channel;
                }
            }
            $channels_member = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findBy(Array("direct" => true, "user_id" => $current_user_id));
            foreach ($channels_member as $cm) {
                $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $cm->getChannelId()));
                if ($channel) {
                    $channel_acces[] = $channel;
                }
            }
        } else {
            foreach ($channels as $channel) {
                $member = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $current_user_id, "channel_id" => $channel));
                if (!$member) {
                    $member = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => true, "user_id" => $current_user_id, "channel_id" => $channel));
                }
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

}
