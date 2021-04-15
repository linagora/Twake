<?php


namespace Twake\Drive\Controller;

use PHPUnit\Util\Json;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Upload extends BaseController
{

    public function Preprocess(Request $request)
    {
        $identifier = $this->get('driveupload.upload')->preprocess($request, $this->getUser()->getId());

        if($GLOBALS["segment_enabled"]) \Segment::track([
            "event" => "drive:file:create",
            "userId" => $this->getuser()->getIdentityProviderId() ?: $this->getUser()->getId()
        ]);

        return new Response(Array("identifier" => $identifier));
    }

    public function uploadFile(Request $request)
    {
        $current_user_id = $this->getUser()->getId();
        $res = $this->get('driveupload.upload')->upload($request, $response, $current_user_id);

        $this->get("administration.counter")->incrementCounter("total_files", 1);
        $this->get("administration.counter")->incrementCounter("total_files_size", intval($res["size"] / 1000));

        return new Response(Array("data" => Array("object" => $res)));
    }


    public function Preview(Request $request)
    {
        $response = new Response();

        if($GLOBALS["segment_enabled"]) \Segment::track([
            "event" => "drive:preview",
            "userId" => $this->isConnected() ? ($this->getuser()->getIdentityProviderId() ?: $this->getUser()->getId()) : "anonymous"
        ]);

        $this->get('driveupload.previewmanager')->generatePreviewFromFolder($request);
        return $response;
    }

}
