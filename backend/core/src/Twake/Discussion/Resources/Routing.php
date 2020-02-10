<?php

namespace Twake\Discussion\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/discussion/";

    protected $routes = [
#Direct messages
        "get" => ["handler" => "Discussion:getAction", "methods" => ["POST"]],
        "save" => ["handler" => "Discussion:save", "methods" => ["POST"]],
        "remove" => ["handler" => "Discussion:remove", "methods" => ["POST"]],
#DiscussionController
        "messageUpdate" => ["handler" => "Discussion:sendMessageUpdate", "methods" => ["POST"]],
        "getStream" => ["handler" => "Discussion:getStream", "methods" => ["POST"]],
        "getMessage" => ["handler" => "Discussion:getMessage", "methods" => ["POST"]],
        "searchMessage" => ["handler" => "Discussion:searchMessage", "methods" => ["POST"]],
        "getDriveMessage" => ["handler" => "Discussion:getDriveMessage", "methods" => ["POST"]],
        "sendMessageFile" => ["handler" => "Discussion:sendMessageFile", "methods" => ["POST"]],
        "newCall" => ["handler" => "Discussion:newCall", "methods" => ["POST"]],
        "streams/getForUser" => ["handler" => "Discussion:getStreamForUser", "methods" => ["POST"]],
        "streams/get" => ["handler" => "Discussion:getStreams", "methods" => ["POST"]],
        "streams/mute" => ["handler" => "Discussion:mute", "methods" => ["POST"]],
        "streams/add" => ["handler" => "Discussion:addStream", "methods" => ["POST"]],
        "streams/remove" => ["handler" => "Discussion:removeStream", "methods" => ["POST"]],
        "streams/edit" => ["handler" => "Discussion:editStream", "methods" => ["POST"]],
        "subject/getList" => ["handler" => "Discussion:getSubject", "methods" => ["POST"]],
        "subject/getMessage" => ["handler" => "Discussion:getSubjectMessage", "methods" => ["POST"]],
        "getLastMessages" => ["handler" => "Discussion:getLastMessages", "methods" => ["POST"]],
#MessageReadController
        "read" => ["handler" => "MessageRead:readMessage", "methods" => ["POST"]],
        "readAll" => ["handler" => "MessageRead:readAllMessages", "methods" => ["POST"]],
    ];

}