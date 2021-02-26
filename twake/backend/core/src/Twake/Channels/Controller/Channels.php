<?php	

namespace Twake\Channels\Controller;	

use Common\BaseController;	
use Common\Http\Response;	
use Common\Http\Request;	

class Channels extends BaseController	
{	
    public function getAction(Request $request)	
    {	
        $options = $request->request->get("options");	
        $objects = $this->get("app.channels.channels_system")->get($options, $this->getUser());	
        if ($objects === false) {	
            return new Response(Array("status" => "error"));	
        }	
        return new Response(Array("data" => $objects));	
    }	

} 