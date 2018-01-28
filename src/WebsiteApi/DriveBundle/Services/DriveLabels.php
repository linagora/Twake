<?php


namespace WebsiteApi\DriveBundle\Services;

use AESCryptFileLib;
use MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Entity\DriveSmartFolder;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;
use WebsiteApi\DriveBundle\Model\DriveLabelsInterface;
use WebsiteApi\DriveBundle\Model\DriveSmartFoldersInterface;

class DriveLabels implements DriveLabelsInterface
{

	var $doctrine;

	public function __construct($doctrine){
		$this->doctrine = $doctrine;
	}

	public function get($workspaceId)
	{
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$labelsRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel");
		$workspace = $workspaceRepository->find($workspaceId);
		return $labelsRepository->findBy(Array("workspace" => $workspace));
	}

	public function update($workspaceId, $labels)
	{
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$labelsRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel");
		$workspace = $workspaceRepository->find($workspaceId);
		$old_labels = $labelsRepository->findBy(Array("workspace" => $workspace));

		foreach ($old_labels as $old_label){
			$found = false;
			foreach ($labels as $label){
				if($label["id"]==$old_label->getId()){
					$old_label->setName($label["name"]);
					$old_label->setColor($label["color"]);
					$this->doctrine->persist($old_label);
					$found = true;
					break;
				}
			}
			if(!$found) {
				$this->doctrine->remove($old_label);
			}
		}
		foreach ($labels as $label) {
			if ($label["id"]<0) {
				$new_label = new DriveLabel($workspace, $label["name"], $label["color"]);
				$this->doctrine->persist($new_label);
			}
		}

		$this->doctrine->flush();
	}

}
