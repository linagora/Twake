<?php

namespace WebsiteApi\UsersBundle\Model;

/**
 * This is an interface for the service User
 *
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
interface UserInterface
{

	// @connected return null or current user
	public function current();

	// @login log in an user
	public function login($usernameOrMail, $password, $rememberMe = false, $request = null, $response = null);

	// @logout log out an user
	public function logout();

	// @ban disable access for an user
	public function ban($userId);

	// @unban enable access for an user
	public function unban($userId);

	// @delete delete user data
	public function delete($userId);

	// @unsubscribe start unsubscribe process for an user
	public function unsubscribe($userId, $reason);

	// @cancelUnsubscribe stop unsubscribe process for an user
	public function cancelUnsubscribe($userId);

	// @checkUnsubscribedUsers definitively remove unsubscribed users
	public function checkUnsubscribedUsers();

	// @requestNewPassword send a number by mail to an user
	public function requestNewPassword($mail);

	// @requestNewPassword send a number by mail to an user
	public function checkNumberForNewPasswordRequest($token, $number);

	// @setNewPasswordAfterNewPasswordRequest change user password and log him
	public function setNewPasswordAfterNewPasswordRequest($token, $number, $password);

	// @subscribeMail send a number by mail
	public function subscribeMail($mail);

	// @checkNumberForSubscribe check the number sent by mail
	public function checkNumberForSubscribe($token, $number);

	// @subscribe terminate subscribtion
	public function subscribe($token, $number, $pseudo, $password);

	// @checkPassword check password for an user
	public function checkPassword($userId, $password);

	// @addDevice add device
	public function addDevice($userId, $type, $value);

	// @removeDevice remove device
	public function removeDevice($userId, $type, $value);

	// @getMails get all secondary mails
	public function getSecondaryMails($userId);

	// @addNewMail send a number by mail to verify new mail
	public function addNewMail($userId, $mail);

	// @removeSecondaryMail remove a secondary mail
	public function removeSecondaryMail($userId, $mail);

	// @checkNumberForAddNewMail verify new mail
	public function checkNumberForAddNewMail($userId, $token, $number);

	// @changePassword change password
	public function changePassword($userId, $oldPassword, $password);

	// @changePseudo change pseudo
	public function changePseudo($userId, $pseudo);

	// @changePseudo change main mail
	public function changeMainMail($userId, $mainMailId);

	// @updateUserBasicData change user basic data
	public function updateUserBasicData($userId, $firstName, $lastName, $imageFile=null);

}