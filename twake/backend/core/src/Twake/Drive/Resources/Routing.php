<?php

namespace Twake\Drive\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/";

    protected $routes = [
# Drive base

#Old mobile versions
        "drive/get" => ["handler" => "DriveFile:getAction", "methods" => ["POST"]],
        "drive/save" => ["handler" => "DriveFile:save", "methods" => ["POST"]],
        "drive/find" => ["handler" => "DriveFile:find", "methods" => ["POST"]],
        "drive/remove" => ["handler" => "DriveFile:remove", "methods" => ["POST"]],
#Drive v1.2
        "drive/v2/get" => ["handler" => "DriveFile:getAction", "methods" => ["POST"]],
        "drive/v2/save" => ["handler" => "DriveFile:save", "methods" => ["POST"]],
        "drive/v2/remove" => ["handler" => "DriveFile:remove", "methods" => ["POST"]],
        "drive/v2/find" => ["handler" => "DriveFile:find", "methods" => ["POST"]],
        "drive/access/set" => ["handler" => "DriveFile:set_file_access", "methods" => ["POST"]],
        "drive/access/reset" => ["handler" => "DriveFile:reset_file_access", "methods" => ["POST"]],
        "drive/trash/empty" => ["handler" => "DriveFile:emptyTrash", "methods" => ["POST"]],
        "drive/open" => ["handler" => "DriveFile:open", "methods" => ["POST"]],
        "driveupload/upload" => ["handler" => "Upload:uploadFile", "methods" => ["POST"]],
        "drive/download" => ["handler" => "Download:downloadfile", "methods" => ["POST", "GET"]],
        "driveupload/download" => ["handler" => "Download:downloadfile", "methods" => ["POST", "GET"]],
        "driveupload/preprocess" => ["handler" => "Upload:Preprocess", "methods" => ["POST"]],
    ];

}