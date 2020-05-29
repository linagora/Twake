<?php

namespace Twake\Drive\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.drive.preview" => "DrivePreview",
//      arguments: ["@app.twake_doctrine"]
        "app.drive" => "DriveFileSystem",
//      arguments: ["@app.twake_doctrine", "@app.applications_api", "@app.websockets", "@app.accessmanager"]
        "driveupload.storemanager" => "Storage/StorageManager",
//      arguments: [%local%, %aws%, %openstack%, %kernel.root_dir%, "@app.drive.preview","@app.twake_doctrine"]
        "driveupload.download" => "DownloadFile",
//      arguments: ["@driveupload.resumable", "@app.twake_doctrine","@driveupload.storemanager", %DRIVE_SALT%, "@app.drive.old.adapter_selector"]
        "driveupload.resumable" => "Resumable/Resumable",
//      arguments: ["@app.twake_doctrine","@driveupload.storemanager", "@app.drive", %drive_previews_tmp_folder%, %drive_tmp_folder%, %DRIVE_SALT%]
        "driveupload.upload" => "UploadFile",
//      arguments: ["@driveupload.resumable"]

        ### OLD
        "app.drive.old.adapter_selector" => "OldFileSystem/DriveAdapterSelector",
//      arguments: [%aws%, %openstack%, "@app.drive.old.AWS_FileSystem", "@app.drive.old.OpenStack_FileSystem"]
        "app.drive.old.OpenStack_FileSystem" => "OldFileSystem/Adapter_OpenStack_DriveFileSystem",
//      arguments: [%openstack%, %kernel.root_dir%, %DRIVE_SALT%]
        "app.drive.old.AWS_FileSystem" => "OldFileSystem/Adapter_AWS_DriveFileSystem",
//      arguments: [%aws%, %kernel.root_dir%, %DRIVE_SALT%]
    ];

}