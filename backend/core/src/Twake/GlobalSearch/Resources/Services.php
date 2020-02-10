<?php

namespace Twake\GlobalSearch\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "globalsearch.quicksearch" => "QuickSearch",
//    arguments: ["@app.twake_doctrine", "@app.users", "@app.workspaces", "@app.channels.channels_system", "@globalsearch.advancedfile", "@app.workspace_members", "@globalsearch.messagebloc"]
        "globalsearch.advancedbloc" => "AdvancedBloc",
//    arguments: ["@app.twake_doctrine", "@globalsearch.messagebloc", "@app.workspaces"]
        "globalsearch.advancedfile" => "AdvancedFile",
//    arguments: ["@app.twake_doctrine","@app.workspaces"]
        "globalsearch.advancedtask" => "AdvancedTask",
//    arguments: ["@app.twake_doctrine", "@app.workspaces"]
        "globalsearch.advancedevent" => "AdvancedEvent",
//    arguments: ["@app.twake_doctrine", "@app.workspaces"]
        "globalsearch.messagebloc" => "Blocmessage",
//    arguments: ["@app.twake_doctrine"]
        "globalsearch.reindex" => "Reindex",
//    arguments: ["@app.twake_doctrine"]
        "globalsearch.mapping" => "Mapping",
        "globalsearch.pagination" => "Pagination",
//    arguments: ["@app.twake_doctrine"]
        "globalsearch.tag" => "Tag",
//      arguments: ["@app.twake_doctrine", "@app.accessmanager"]
    ];

}