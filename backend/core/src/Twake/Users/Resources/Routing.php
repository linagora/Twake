<?php

namespace Twake\Users\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
        "login" => ["handler" => "UsersConnections:login", "methods" => ["POST"]],
        "autoLogin" => ["handler" => "UsersConnections:autoLogin", "methods" => ["POST"]],
        "logout" => ["handler" => "UsersConnections:logout", "methods" => ["POST"]],
        "current/isLogged" => ["handler" => "UsersConnections:isLogged", "methods" => ["POST"]],
        "current/get" => ["handler" => "UsersConnections:currentUser", "methods" => ["POST"]],
        "mobile_redirect" => ["handler" => "UsersConnections:mobileRedirect", "methods" => ["GET"]],
        "alive" => ["handler" => "UsersConnections:alive", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "set/isNew" => ["handler" => "UsersConnections:setIsNew", "methods" => ["POST"], "security" => ["user_connected_security"]],
        // Account
        "account/identity" => ["handler" => "UsersAccount:setIdentity", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/username" => ["handler" => "UsersAccount:setUsername", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/password" => ["handler" => "UsersAccount:setPassword", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/mainmail" => ["handler" => "UsersAccount:setMainMail", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/removemail" => ["handler" => "UsersAccount:removeMail", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/addmail" => ["handler" => "UsersAccount:addMail", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/mails" => ["handler" => "UsersAccount:getMails", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/addmailverify" => ["handler" => "UsersAccount:addMailVerify", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/language" => ["handler" => "UsersAccount:setLanguage", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/get_notifications" => ["handler" => "UsersAccount:getNotificationPreferences", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/set_notifications" => ["handler" => "UsersAccount:setNotificationPreferences", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/set_workspaces_preference" => ["handler" => "UsersAccount:setWorkspacesPreferences", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/update_notifications" => ["handler" => "UsersAccount:updateNotificationPreferenceByWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/set_tutorial_status" => ["handler" => "UsersAccount:setTutorialStatus", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "account/update_status" => ["handler" => "UsersAccount:updateStatus", "methods" => ["POST"], "security" => ["user_connected_security"]],
        // Subscribe
        "subscribe/mail" => ["handler" => "UsersSubscribe:mail", "methods" => ["POST"]],
        "subscribe/doverifymail" => ["handler" => "UsersSubscribe:doVerifyMail", "methods" => ["POST"]],
        "subscribe/identity" => ["handler" => "UsersSubscribe:subscribe", "methods" => ["POST"]],
        // New Subscribe
        "subscribe/subscribe" => ["handler" => "UsersSubscribe:subscribeTotaly", "methods" => ["POST"]],
        "subscribe/availability" => ["handler" => "UsersSubscribe:getAvaible", "methods" => ["POST"]],
        "subscribe/company_subscribe" => ["handler" => "UsersSubscribe:createCompanyUser", "methods" => ["POST"]],
        // Recover
        "recover/mail" => ["handler" => "UsersRecover:mail", "methods" => ["POST"]],
        "recover/verify" => ["handler" => "UsersRecover:codeVerification", "methods" => ["POST"]],
        "recover/password" => ["handler" => "UsersRecover:newPassword", "methods" => ["POST"]],
        // Get and search
        "all/get" => ["handler" => "Users:getById", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "all/search" => ["handler" => "Users:search", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "all/search/username" => ["handler" => "Users:searchUsersByUsername", "methods" => ["POST"], "security" => ["user_connected_security"]],
        // CAS
        "cas/login" => ["handler" => "ConnectionsUsingCAS:login", "methods" => ["GET"]],
        "cas/verify" => ["handler" => "ConnectionsUsingCAS:verify", "methods" => ["GET"]],
        "cas/logout" => ["handler" => "ConnectionsUsingCAS:logout", "methods" => ["GET"]],
        "openid/{method?}" => ["handler" => "OpenID:index", "methods" => ["GET", "POST"]],
    ];

}