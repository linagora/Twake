<?php

namespace WebsiteApi\DriveBundle\Model;

interface DriveSmartFoldersInterface
{
	//Create a new smart folder
	public function create($group, $name, $labels);

	//Remove a smart folder
	public function remove($group, $id);

	//Edit a smart folder
	public function edit($group, $id, $name, $labels);

	//Get smart folders
	public function get($group);

}