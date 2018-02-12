<?php
/**
 * The Safari Push Notification Message.
 *
 * The class represents a Safari Push Notification message.
 *
 * @ingroup ApnsPHP_Message
 */
class ApnsPHP_Message_Safari extends ApnsPHP_Message
{
	protected $_sTitle; /**< @type string The title of the notification. */
	protected $_sAction; /**< @type string The label of the action button, if the user sets the notifications to appear as alerts. */
	protected $_aUrlArgs; /**< @type array Variable string values to appear in place of the format specifiers in urlFormatString. */

	/**
	 * Set the title of the notification.
	 *
	 * @param  $sTitle @type string The title of the notification
	 */
	public function setTitle($sTitle)
	{
		$this->_sTitle = $sTitle;
	}

	/**
	 * Get the title of the notification.
	 *
	 * @return @type string The title of the notification
	 */
	public function getTitle()
	{
		return $this->_sTitle;
	}

	/**
	 * Set the label of the action button, if the user sets the notifications to appear as alerts.
	 *
	 * @param  $sAction @type string The label of the action button
	 */
	public function setAction($sAction)
	{
		$this->_sAction = $sAction;
	}

	/**
	 * Get the label of the action button, if the user sets the notifications to appear as alerts.
	 *
	 * @return @type string The label of the action button
	 */
	public function getAction()
	{
		return $this->_sAction;
	}

	/**
	 * Set the variable string values to appear in place of the format specifiers
	 * in urlFormatString.
	 *
	 * @param  $aUrlArgs @type array The variable string values.
	 */
	public function setUrlArgs($aUrlArgs)
	{
		$this->_aUrlArgs = $aUrlArgs;
	}

	/**
	 * Get the variable string values to appear in place of the format specifiers
	 * in urlFormatString.
	 *
	 * @return @type string The variable string values.
	 */
	public function getUrlArgs()
	{
		return $this->_aUrlArgs;
	}

	/**
	 * Get the payload dictionary.
	 *
	 * @return @type array The payload dictionary.
	 */
	protected function _getPayload()
	{
		$aPayload[self::APPLE_RESERVED_NAMESPACE]['alert'] = array();

		if (isset($this->_sTitle)) {
			$aPayload[self::APPLE_RESERVED_NAMESPACE]['alert']['title'] = (string)$this->_sTitle;
		}

		if (isset($this->_sText)) {
			$aPayload[self::APPLE_RESERVED_NAMESPACE]['alert']['body'] = (string)$this->_sText;
		}

		if (isset($this->_sAction)) {
			$aPayload[self::APPLE_RESERVED_NAMESPACE]['alert']['action'] = (string)$this->_sAction;
		}

		if (isset($this->_aUrlArgs)) {
			$aPayload[self::APPLE_RESERVED_NAMESPACE]['url-args'] = $this->_aUrlArgs;
		}

		return $aPayload;
	}
}