<?php


namespace Twake\Market\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Workspaces\Entity\Workspace;
use Twake\Core\Entity\SearchableObject;

/**
 * Application
 *
 * @ORM\Table(name="application",options={"engine":"MyISAM", "scylladb_keys": {{"group_id": "ASC", "app_group_name": "ASC", "id": "ASC"}, {"id": "ASC"}, {"simple_name": "ASC"}, {"is_default": "ASC"}}})
 * @ORM\Entity()
 */
class Application extends SearchableObject
{

    protected $es_type = "applications";

    // General

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;

    /**
     * @ORM\Column(name="group_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $group_id;

    /**
     * @ORM\Column(name="is_default", type="twake_boolean")
     */
    protected $is_default;

    /**
     * @ORM\Column(name="app_group_name", type="twake_no_salt_text")
     * @ORM\Id
     */
    protected $app_group_name;

    /**
     * @ORM\Column(name="name", type="twake_text")
     */
    protected $name;

    /**
     * @ORM\Column(name="simple_name", type="twake_no_salt_text")
     */
    protected $simple_name;

    /**
     * @ORM\Column(name="description", type="twake_text")
     */
    protected $description;

    /**
     * @ORM\Column(name="website", type="twake_text")
     */
    protected $website;

    /**
     * @ORM\Column(name="categories", type="twake_text")
     */
    protected $categories;

    /**
     * @ORM\Column(name="icon_url", type="twake_text")
     */
    protected $icon_url; //Doit finir par un format obligatoirement

    /**
     * @ORM\Column(name="public", type="twake_boolean")
     */
    protected $public;

    /**
     * @ORM\Column(name="twake_team_validation", type="twake_boolean")
     */
    protected $twake_team_validation;

    /**
     * @ORM\Column(name="is_available_to_public", type="twake_boolean")
     */
    protected $is_available_to_public; //Vrai si $public ET $twake_team_validation


    // Statistiques

    /**
     * @ORM\Column(name="install_count", type="integer")
     */
    protected $install_count = 0;

    /**
     * @ORM\Column(name="creation_date", type="twake_datetime")
     */
    protected $creation_date;


    // API configuration

    /**
     * @ORM\Column(name="api_events_url", type="twake_text")
     */
    protected $api_events_url;

    /**
     * @ORM\Column(name="api_allowed_ip", type="twake_text")
     */
    protected $api_allowed_ip;

    /**
     * @ORM\Column(name="api_private_key", type="twake_text")
     */
    protected $api_private_key;


    // Access configuration

    /**
     * @ORM\Column(name="privileges_capabilities_last_update", type="twake_datetime")
     */
    protected $privileges_capabilities_last_update;

    /**
     * @ORM\Column(name="privileges", type="twake_text")
     */
    protected $privileges = "[]";

    /**
     * @ORM\Column(name="capabilities", type="twake_text")
     */
    protected $capabilities = "[]";

    /**
     * @ORM\Column(name="hooks", type="twake_text")
     */
    protected $hooks = "[]";


    // Display configuration

    /**
     * @ORM\Column(name="display_configuration", type="twake_text")
     */
    protected $display_configuration = "{}";

    /**
     * Application constructor.
     * @param $group_id
     * @param $name
     */
    public function __construct($group_id, $name)
    {
        parent::__construct();
        $this->group_id = $group_id;
        $this->name = $name;
        $this->creation_date = new \DateTime();
    }


    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getGroupId()
    {
        return $this->group_id;
    }

    /**
     * @param mixed $group_id
     */
    public function setGroupId($group_id)
    {
        $this->group_id = $group_id;
    }

    /**
     * @return mixed
     */
    public function getDefault()
    {
        return $this->is_default;
    }

    /**
     * @param mixed $is_default
     */
    public function setDefault($is_default)
    {
        $this->is_default = $is_default;
    }

    /**
     * @return mixed
     */
    public function getApiPrivateKey()
    {
        return $this->api_private_key;
    }

    /**
     * @param mixed $api_private_key
     */
    public function setApiPrivateKey($api_private_key)
    {
        $this->api_private_key = $api_private_key;
    }

    /**
     * @return mixed
     */
    public function getAppGroupName()
    {
        return $this->app_group_name;
    }

    /**
     * @param mixed $app_group_name
     */
    public function setAppGroupName($app_group_name)
    {
        $this->app_group_name = $app_group_name;
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return mixed
     */
    public function getSimpleName()
    {
        return $this->simple_name;
    }

    /**
     * @param mixed $simple_name
     */
    public function setSimpleName($simple_name)
    {
        $this->simple_name = $simple_name;
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return mixed
     */
    public function getWebsite()
    {
        return $this->website;
    }

    /**
     * @param mixed $website
     */
    public function setWebsite($website)
    {
        $this->website = $website;
    }

    /**
     * @return mixed
     */
    public function getIconUrl()
    {
        return $this->icon_url;
    }

    /**
     * @param mixed $icon_url
     */
    public function setIconUrl($icon_url)
    {
        $this->icon_url = $icon_url;
    }

    /**
     * @return mixed
     */
    public function getCategories()
    {
        return json_decode($this->categories, true);
    }

    /**
     * @param mixed $categories
     */
    public function setCategories($categories)
    {
        $this->categories = json_encode($categories);
    }

    /**
     * @return mixed
     */
    public function getPublic()
    {
        return $this->public;
    }

    /**
     * @param mixed $public
     */
    public function setPublic($public)
    {
        $this->public = $public;
    }

    /**
     * @return mixed
     */
    public function getTwakeTeamValidation()
    {
        return $this->twake_team_validation;
    }

    /**
     * @param mixed $twake_team_validation
     */
    public function setTwakeTeamValidation($twake_team_validation)
    {
        $this->twake_team_validation = $twake_team_validation;
    }

    /**
     * @return mixed
     */
    public function getisAvailableToPublic()
    {
        return $this->is_available_to_public;
    }

    /**
     * @param mixed $is_available_to_public
     */
    public function setIsAvailableToPublic($is_available_to_public)
    {
        $this->is_available_to_public = $is_available_to_public;
    }

    /**
     * @return mixed
     */
    public function getInstallCount()
    {
        return $this->install_count;
    }

    /**
     * @param mixed $install_count
     */
    public function setInstallCount($install_count)
    {
        $this->install_count = max(0, $install_count);
    }

    /**
     * @return mixed
     */
    public function getCreationDate()
    {
        return $this->creation_date;
    }

    /**
     * @param mixed $creation_date
     */
    public function setCreationDate($creation_date)
    {
        $this->creation_date = $creation_date;
    }

    /**
     * @return mixed
     */
    public function getApiEventsUrl()
    {
        return $this->api_events_url;
    }

    /**
     * @param mixed $api_events_url
     */
    public function setApiEventsUrl($api_events_url)
    {
        $this->api_events_url = $api_events_url;
    }

    /**
     * @return mixed
     */
    public function getApiAllowedIp()
    {
        return json_decode($this->api_allowed_ip, true);
    }

    /**
     * @param mixed $api_allowed_ip
     */
    public function setApiAllowedIp($api_allowed_ip)
    {
        $this->api_allowed_ip = json_encode($api_allowed_ip);
    }

    /**
     * @return mixed
     */
    public function getPrivilegesCapabilitiesLastUpdate()
    {
        return $this->privileges_capabilities_last_update;
    }

    /**
     * @param mixed $privileges_capabilities_last_update
     */
    public function setPrivilegesCapabilitiesLastUpdate($privileges_capabilities_last_update)
    {
        $this->privileges_capabilities_last_update = $privileges_capabilities_last_update;
    }

    /**
     * @return mixed
     */
    public function getPrivileges()
    {
        if (!$this->privileges) {
            return Array();
        }
        return json_decode($this->privileges, true);
    }

    /**
     * @param mixed $privileges
     */
    public function setPrivileges($privileges)
    {
        $this->privileges = json_encode($privileges);
    }

    /**
     * @return mixed
     */
    public function getCapabilities()
    {
        if (!$this->capabilities) {
            return Array();
        }
        return json_decode($this->capabilities, true);
    }

    /**
     * @param mixed $capabilities
     */
    public function setCapabilities($capabilities)
    {
        $this->capabilities = json_encode($capabilities);
    }

    /**
     * @return mixed
     */
    public function getHooks()
    {
        if (!$this->hooks) {
            return Array();
        }
        return json_decode($this->hooks, true);
    }

    /**
     * @param mixed $hooks
     */
    public function setHooks($hooks)
    {
        $this->hooks = json_encode($hooks);
    }

    /**
     * @return mixed
     */
    public function getDisplayConfiguration()
    {
        return json_decode($this->display_configuration, true);
    }

    /**
     * @param mixed $display_configuration
     */
    public function setDisplayConfiguration($display_configuration)
    {
        if (is_string($display_configuration)) {
            try {
                $_display_configuration = json_decode($display_configuration, true);
            } catch (\Exception $e) {
                $_display_configuration = $display_configuration;
            }
            $display_configuration = $_display_configuration;
        }
        $this->display_configuration = json_encode($display_configuration);
    }


    static public function generatePrivateApiKey()
    {
        $letters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return str_replace(Array("+", "/", "="), Array($letters[random_int(0, 61)], $letters[random_int(0, 61)], $letters[random_int(0, 61)]),
            base64_encode(random_bytes(100)));
    }

    public function getAsCredentialArray()
    {
      $return = [];
      $return["api_id"] = $this->getId();
      $return["api_key"] = $this->getApiPrivateKey();
      return $return;
    }

    public function getAsArrayForDevelopers()
    {
        $return = $this->getAsArray();

        $return["id"] = $this->getId();

        $return["api_id"] = $this->getId();
        $return["api_key"] = $this->getApiPrivateKey();
        $return["api_event_url"] = $this->getApiEventsUrl();
        $return["api_allowed_ips"] = $this->getApiAllowedIp();

        $return["privileges"] = $this->getPrivileges();
        $return["capabilities"] = $this->getCapabilities();

        $return["available_privileges"] = Array(
            "channels", //Lister les channels et leur configuration (tabulations etc)
            "workspace", //Information sur l’espace de travail
            "workspace_calendar", //Information sur le calendrier de l’espace de travail
            "workspace_tasks", //Information sur les taches de l’espace de travail
            "workspace_drive", //Information sur le drive de l’espace de travail
            "drive_list", //Lister documents dans le Drive
            "tasks_task_save",
            "tasks_task_remove",
            //"drive_tree", //Liste des fichiers, noms et autres metadatas
            //"drive_files_content", //Téléchargement des fichiers et preview des fichiers
            //"messages_history", //Récupérer ou rechercher des messages
            //"members", //Lister les membres d’un espace de travail
            //"group_members", //Lister les membres d’un groupe entier
            //"applications", //Liste des applications déployées sur l’espace de travail (sans le détail de leur configuration)
            //"group" //Information sur le groupe
        );
        $return["available_capabilities"] = Array(
            "display_modal", //Afficher une modal (comme une modal de configuration)
            "messages_save", //Envoyer des messages
            "messages_remove",
            "drive_save",
            "drive_remove",
            "calendar_event_save",
            "calendar_event_remove",
            "tasks_task_save",
            "tasks_task_remove",
            //"drive_add", //Ajouter un fichiers
            //"drive_remove", //Supprimer un fichier existant
            //"drive_modify", //Modifier un fichier existant
            //"drive_add_version", //Ajouter une version à un fichier existant
            //"messages_remove", //Supprimer des messages autre que ceux de l’application
            //"messages_modify", //Modifier des messages autre que ceux de l’application
            //"members_add", //Ajouter un membre
            //"members_remove", //Supprimer un membre
            //"workspace_add", //Ajouter un espace de travail
            //"workspace_remove" //Supprimer un espace de travail
        );
        $return["available_hooks"] = Array(
            "message", //Nouveau message hook dans un channel particulier (si écouté)
            "message_in_workspace", //Nouveau message hook dans tous le workspace
            "calendar",
            "event",
            "task",
            "file"
        );
        $return["available_categories"] = Array(
            "bots",
            "data_analysis",
            "communication",
            "customer_support",
            "graphism",
            "developers",
            "files",
            "events",
            "health",
            "human_resources",
            "corporate_culture",
            "marketing",
            "office",
            "finances",
            "productivity",
            "project_management",
            "sales",
            "security_compliance",
            "entertainment",
            "trip",
            "voice_video",
            "medias_news"
        );

        return $return;
    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "group_id" => $this->getGroupId(),
            "app_group_name" => $this->getAppGroupName(),
            "categories" => $this->getCategories(),
            "name" => $this->getName(),
            "simple_name" => $this->getSimpleName(),
            "description" => $this->getDescription(),
            "icon_url" => $this->getIconUrl(),
            "website" => $this->getWebsite(),
            "install_count" => $this->getInstallCount(),
            "creation_date" => $this->getCreationDate() ? $this->getCreationDate()->getTimestamp() : new \DateTime(),
            "privileges" => $this->getPrivileges(),
            "capabilities" => $this->getCapabilities(),
            "hooks" => $this->getHooks(),
            "display" => $this->getDisplayConfiguration(),
            "public" => $this->getPublic(),
            "is_available_to_public" => $this->getisAvailableToPublic()
        );
        return $return;
    }

    public function getIndexationArray()
    {
        $return = Array(
            "app_group_name" => $this->getAppGroupName(),
            "name" => $this->getName(),
            "simple_name" => $this->getSimpleName(),
            "description" => $this->getDescription(),
            "categories" => $this->getCategories(),
            "group_id" => $this->getGroupId(),
            "public" => $this->getisAvailableToPublic()
        );
        return $return;
    }

}
