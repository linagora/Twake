<?php


namespace WebsiteApi\TagsBundle\Services;

use WebsiteApi\TagsBundle\Entity\Tag;
use WebsiteApi\TagsBundle\Entity\TagsLists;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

/**
 * Class Tags, manage tags in application, as a service
 * @package WebsiteApi\CoreBundle\Services
 */
class Tags
{

	var $string_cleaner;
	var $doctrine;
	var $security;

	var $allowed_types = Array(
		"A" //All
	);

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
	}

	function getAllowedTypes(){
		return $this->allowed_types;
	}

	function isAllowedType($type){
		return in_array($type,$this->allowed_types);
	}

	/**
	 *
	 * Check if a tag is present in the database
	 *
	 * @param $type
	 * @param $q
	 * @return bool
	 */
	function isPresent($type="A", $q){

		if(!in_array($type,$this->allowed_types)){
			error_log("bad_type");
			return false;
		}

		$q = $this->string_cleaner->simplify($q);

		$repository = $this->doctrine->getRepository("TwakeTagsBundle:Tag");

		$present = $repository->findOneBy(array('type' => $type, 'valueSimple' => $q));

		if($present==null){
			$present = false;
		}else{
			$present = true;
		}

		return $present;

	}

	/**
	 *
	 * Search a tag with a LIKE query% (tags starting by the query) ordered by popularity
	 *
	 * @param $type
	 * @param $q
	 * @param int $limit
	 * @return array
	 */
	function searchTags($type="A", $q, $limit = 5){


		$q = $this->string_cleaner->simplify($q);

		$res = Array();

		if(strlen($q)<1){
			error_log("query_is_too_short");
			return $res;
		}

		if(!in_array($type,$this->allowed_types)){
			error_log("bad_type");
			return $res;
		}

		$repository = $this->doctrine->getRepository("TwakeTagsBundle:Tag");

		$req = $repository->createQueryBuilder('o')
			->where("o.type = '$type'")
			->andWhere("o.valueSimple LIKE '$q%'")
			->setMaxResults(intval($limit))
			->orderBy('o.popularity', 'DESC')
			->getQuery()
			->getResult();

		foreach($req as $tag) {
			$res[] = $tag->getValue();
		}

		return $res;

	}

	/**
	 *
	 * Get list of tags for an object
	 *
	 * @param $ownerType
	 * @param $ownerId
	 * @param string $type
	 * @return array|bool
	 */
	function getTags($ownerType, $ownerId, $type="A"){

		$res = Array();

		if(!in_array($type,$this->allowed_types)){
			error_log("bad_type");
			return false;
		}

		$repository = $this->doctrine->getRepository("TwakeTagsBundle:TagsLists");

		$req = $repository->createQueryBuilder('o')
			->where("o.type = '$type'")
			->andWhere("o.ownerId = $ownerId")
			->andWhere("o.ownerType = '$ownerType'")
			->getQuery()
			->getResult();

		foreach($req as $tag) {
			$res[] = $tag->getTag()->getValue();
		}

		return $res;

	}


	/**
	 *
	 * Permit to save a list of tags, using some parameters
	 *
	 * @param $list (separation par des virgules) -> list of tags
	 * @param $ownerType
	 * @param $ownerId
	 * @param $tagType
	 * @param int $can_create -> parameter to set if it is possible to add not present tags in the database
	 */
	function setTags($list, $ownerType, $ownerId, $tagType="A", $can_create=0){

		if(!in_array($tagType,$this->allowed_types)){
			error_log("bad_type");
			return false;
		}

		$tags_to_search = Array();
		$real_tags = Array();

		foreach(explode(",",$list) as $tag){

			$tag = trim($tag," ");
			$tag = substr($tag,0,32);

			$stag = $this->string_cleaner->simplify($tag);

			if(strlen($stag)>2){

				$tags_to_search[] = $stag;
				$real_tags[$stag] = $tag;

			}

		}


		$tags_already_present = Array();
		$tags_found = Array();

		$repository = $this->doctrine->getRepository("TwakeTagsBundle:Tag");
		$req = $repository->createQueryBuilder('o')
			->where("o.type = '$tagType'")
			->andWhere("o.valueSimple IN ('".join("','",$tags_to_search)."')")
			->getQuery()
			->getResult();

		foreach($req as $tag) {
			$tags_found[] = $tag;
			$tags_already_present[] = $tag->getValueSimple();
		}
		$to_add = array_diff($tags_to_search, $tags_already_present);


		//If we can add tags, we add them (array_diff used to keep only not present tags)
		if($can_create && $this->security->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			foreach($to_add as $tag){

				$new_tag = new Tag();
				$new_tag->setType($tagType);
				$new_tag->setLanguage("FR");
				$new_tag->setValueSimple($tag);
				$new_tag->setValue(ucfirst($real_tags[$tag]));
				$new_tag->setNbUses(1);
				$new_tag->setFirstUse(date("U"));
				$new_tag->setLastUse(date("U"));
				$new_tag->setPopularity(1/count($real_tags));

				$this->doctrine->persist($new_tag);
				$this->doctrine->flush();

				$tags_found[] = $new_tag;

			}

		}

		$all_tags = Array();
		foreach($tags_found as $tag){
			$all_tags[] = $tag->getValueSimple();
		}


		//Add tags to the TagsLists to link tags to the object

		$id_tags_to_delete = Array();
		$id_tags_to_notadd = Array();

		$repository = $this->doctrine->getRepository("TwakeTagsBundle:TagsLists");
		$req = $repository->createQueryBuilder('o')
			->where("o.ownerId = '$ownerId'")
			->andWhere("o.ownerType = '$ownerType'")
			->getQuery()
			->getResult();

		foreach($req as $tag) {
			if(!in_array($tag->getTag()->getValueSimple(), $all_tags)){
				$id_tags_to_delete[] = $tag->getTag()->getId();
			}else{
				$id_tags_to_notadd[] = $tag->getTag()->getId();
			}
		}

		//DELETE WHAT TAGS TO DELETE
		if(count($id_tags_to_delete)>0) {
			$this->doctrine->createQueryBuilder('o')
				->delete("TwakeTagsBundle:TagsLists", "TL")
				->where("IDENTITY(TL.tag) IN (" . join(',', $id_tags_to_delete) . ")")
				->andWhere("TL.ownerId = '$ownerId'")
				->andWhere("TL.ownerType = '$ownerType'")
				->getQuery()
				->getResult();
		}

		//ADD NEW TAGS
		foreach($tags_found as $tag){

			if(!in_array($tag->getId(),$id_tags_to_notadd)) {

				echo "adding a tag ".$tag->getValueSimple();

				$tagsLink = new TagsLists();
				$tagsLink->setOwnerType($ownerType);
				$tagsLink->setOwnerId($ownerId);
				$tagsLink->setType($tagType);
				$tagsLink->setTag($tag);

				$date = date("U");
				$tag->setLastUse($date);
				$tag->setNbUses($tag->getNbUses()+1);
				$tag->setPopularity($tag->getPopularity() + 1/count($real_tags));//Formula popularity

				$this->doctrine->persist($tag);
				$this->doctrine->persist($tagsLink);
				$this->doctrine->flush();

			}

		}

		return true;

	}

}