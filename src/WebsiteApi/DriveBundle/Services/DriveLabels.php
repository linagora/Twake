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

class DriveLabels implements DriveLabelsInterface
{

	var $doctrine;

	public function __construct($doctrine){
		$this->doctrine = $doctrine;
	}

}
