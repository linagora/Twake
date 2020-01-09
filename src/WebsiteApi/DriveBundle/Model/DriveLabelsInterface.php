<?php

namespace WebsiteApi\DriveBundle\Model;

interface DriveLabelsInterface
{

    // @getLabels returns labels in a group
    public function get($group);

    // @updateLabels update labels in a group
    public function update($group, $labels);


}