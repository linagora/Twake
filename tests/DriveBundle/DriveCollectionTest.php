<?php

namespace Tests\DriveBundle;

use Tests\WebTestCaseExtended;

class DriveCollectionTest extends WebTestCaseExtended
{
    public function testCreateFile(){

        $object = Array("parent_id" => "8287d84a-5b64-11e9-a7a4-0242ac120005", "workspace_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest");
        $option = Array();

        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "option" => $option
        ));

        error_log(print_r($result));

    }

    public function testCreateFileDetached(){

    }

    public function testUpdateFileTest(){

    }

    public function testReAttachedFile(){

    }

}