<?php


namespace WebsiteApi\DriveBundle\Services;

use AESCryptFileLib;
use MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Entity\DriveSmartFolder;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;
use WebsiteApi\DriveBundle\Model\DriveSmartFoldersInterface;

class DriveSmartFolders implements DriveSmartFoldersInterface
{

	var $doctrine;

	public function __construct($doctrine){
		$this->doctrine = $doctrine;
	}

	public function create($group, $name, $labels)
	{
		$folder = new DriveSmartFolder($group, $name, $labels);
		$this->doctrine->persist($folder);
		$this->doctrine->flush();
	}

	public function remove($group, $id)
	{
		$folder = $this->doctrine->getRepository("TwakeDriveBundle:DriveSmartFolder")->find($id);
		if($folder != null){
			$this->doctrine->remove($folder);
		}
		$this->doctrine->flush();
	}

	public function edit($group, $id, $name, $labels)
	{
		$folder = $this->doctrine->getRepository("TwakeDriveBundle:DriveSmartFolder")->find($id);
        if ($folder != null && $folder->getWorkspaceId() == $group) {
			$folder->setName($name);
			$folder->setLabels($labels);
			$this->doctrine->persist($folder);
			$this->doctrine->flush();
		}
	}

	public function get($group)
	{
		$folder = $this->doctrine->getRepository("TwakeDriveBundle:DriveSmartFolder")->findBy(Array("group"=>$group));
		return $folder;
	}

}
