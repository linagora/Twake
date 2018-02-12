<?php
/**
 * @file
 * ApnsPHP_Message_Custom class definition.
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://code.google.com/p/apns-php/wiki/License
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to aldo.armiento@gmail.com so we can send you a copy immediately.
 *
 * @author (C) 2010 Aldo Armiento (aldo.armiento@gmail.com)
 * @version $Id$
 */

/**
 * The Push Notification Custom Message.
 *
 * The class represents a custom message to be delivered to an end user device.
 * Please refer to Table 3-2 for more information.
 *
 * @ingroup ApnsPHP_Message
 * @see http://tinyurl.com/ApplePushNotificationPayload
 */
class ApnsPHP_Message_Custom extends ApnsPHP_Message
{
	protected $_sActionLocKey; /**< @type string The "View" button title. */
	protected $_sLocKey; /**< @type string A key to an alert-message string in a Localizable.strings file */
	protected $_aLocArgs; /**< @type array Variable string values to appear in place of the format specifiers in loc-key. */
	protected $_sLaunchImage; /**< @type string The filename of an image file in the application bundle. */
	protected $_sTitle; /**< @type string The title of an short looknotification displayed on Apple Watch. */
    protected $_sSubTitle; /**< @type string The subtitle of a secondary description */

	/**
	 * Set the "View" button title.
	 *
	 * If a string is specified, displays an alert with two buttons.
	 * iOS uses the string as a key to get a localized string in the current localization
	 * to use for the right button’s title instead of "View". If the value is an
	 * empty string, the system displays an alert with a single OK button that simply
	 * dismisses the alert when tapped.
	 *
	 * @param  $sActionLocKey @type string @optional The "View" button title, default
	 *         empty string.
	 */
	public function setActionLocKey($sActionLocKey = '')
	{
		$this->_sActionLocKey = $sActionLocKey;
	}

	/**
	 * Get the "View" button title.
	 *
	 * @return @type string The "View" button title.
	 */
	public function getActionLocKey()
	{
		return $this->_sActionLocKey;
	}

	/**
	 * Set the alert-message string in Localizable.strings file for the current
	 * localization (which is set by the user’s language preference).
	 *
	 * The key string can be formatted with %@ and %n$@ specifiers to take the variables
	 * specified in loc-args.
	 *
	 * @param  $sLocKey @type string The alert-message string.
	 */
	public function setLocKey($sLocKey)
	{
		$this->_sLocKey = $sLocKey;
	}

	/**
	 * Get the alert-message string in Localizable.strings file.
	 *
	 * @return @type string The alert-message string.
	 */
	public function getLocKey()
	{
		return $this->_sLocKey;
	}

	/**
	 * Set the variable string values to appear in place of the format specifiers
	 * in loc-key.
	 *
	 * @param  $aLocArgs @type array The variable string values.
	 */
	public function setLocArgs($aLocArgs)
	{
		$this->_aLocArgs = $aLocArgs;
	}

	/**
	 * Get the variable string values to appear in place of the format specifiers
	 * in loc-key.
	 *
	 * @return @type string The variable string values.
	 */
	public function getLocArgs()
	{
		return $this->_aLocArgs;
	}

	/**
	 * Set the filename of an image file in the application bundle; it may include
	 * the extension or omit it.
	 *
	 * The image is used as the launch image when users tap the action button or
	 * move the action slider. If this property is not specified, the system either
	 * uses the previous snapshot, uses the image identified by the UILaunchImageFile
	 * key in the application’s Info.plist file, or falls back to Default.png.
	 * This property was added in iOS 4.0.
	 *
	 * @param  $sLaunchImage @type string The filename of an image file.
	 */
	public function setLaunchImage($sLaunchImage)
	{
		$this->_sLaunchImage = $sLaunchImage;
	}

	/**
	 * Get the filename of an image file in the application bundle.
	 *
	 * @return @type string The filename of an image file.
	 */
	public function getLaunchImage()
	{
		return $this->_sLaunchImage;
	}

    /**
	 * Set the title of a short look Apple Watch notification.
	 *
	 * Currently only used when displaying notifications on Apple Watch.
	 * See https://developer.apple.com/library/ios/documentation/General/Conceptual/WatchKitProgrammingGuide/BasicSupport.html#//apple_ref/doc/uid/TP40014969-CH18-SW2
	 *
	 * @param  $sTitle @type string The title displayed in the short look notification
	 */
	public function setTitle($sTitle)
	{
		$this->_sTitle = $sTitle;
	}

	/**
	 * Get the title of a short look Apple Watch notification.
	 *
	 * @return @type string The title displayed in the short look notification
	 */
	public function getTitle()
	{
		return $this->_sTitle;
	}

        /**
	 * Set the subtitle of a secondary description on iOS 10.0+ and watchOS 3.0+
	 * See https://developer.apple.com/reference/usernotifications/unmutablenotificationcontent/1649873-subtitle
	 *
	 * @param  $sSubTitle @type string the subtitle of a secondary description
	 */
	public function setSubTitle($sSubTitle)
	{
		$this->_sSubTitle = $sSubTitle;
	}

	/**
	 * Get the subtitle of a secondary description on iOS 10.0+ and watchOS 3.0+
	 *
	 * @return @type string the subtitle of a secondary description on 
	 */
	public function getSubTitle()
	{
		return $this->_sSubTitle;
	}
	/**
	 * Get the payload dictionary.
	 *
	 * @return @type array The payload dictionary.
	 */
	protected function _getPayload()
	{
		$aPayload = parent::_getPayload();

		$aPayload['aps']['alert'] = array();

		if (isset($this->_sText) && !isset($this->_sLocKey)) {
			$aPayload['aps']['alert']['body'] = (string)$this->_sText;
		}

		if (isset($this->_sActionLocKey)) {
			$aPayload['aps']['alert']['action-loc-key'] = $this->_sActionLocKey == '' ?
				null : (string)$this->_sActionLocKey;
		}

		if (isset($this->_sLocKey)) {
			$aPayload['aps']['alert']['loc-key'] = (string)$this->_sLocKey;
		}

		if (isset($this->_aLocArgs)) {
			$aPayload['aps']['alert']['loc-args'] = $this->_aLocArgs;
		}

		if (isset($this->_sLaunchImage)) {
			$aPayload['aps']['alert']['launch-image'] = (string)$this->_sLaunchImage;
		}

		if (isset($this->_sTitle)) {
			$aPayload['aps']['alert']['title'] = (string)$this->_sTitle;
		}
		
		if (isset($this->_sSubTitle)) {
			$aPayload['aps']['alert']['subtitle'] = (string)$this->_sSubTitle;
		}
		return $aPayload;
	}
}