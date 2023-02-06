export default {
  base: "/Twake/",
  title: "Documentation",
  description: "Public API documentation",
  themeConfig: {
    logo: "https://twake.app/images/logo-twake.svg",
    sidebar: [
      {
        text: "Getting started",
        items: [
          {
            text: "☀️ Welcome to Twake",
            link: "index",
          },
          {
            text: "⬇️ Desktop and mobile apps",
            link: "download",
          },
        ],
      },
      {
        text: "On-premise",
        items: [
          {
            text: "🏗 Run On-Premise",
            link: "/onprem/installation",
          },
          {
            text: "⚙️ Server configuration",
            link: "/onprem/configuration/README.md",
          },
        ],
      },
      {
        text: "How to use Twake",
        items: [
          {
            text: "👋 Welcome to Twake !",
            link: "/how-to-use-it/welcome",
          },
          {
            text: "🖥 Desktop and mobile app",
            link: "/how-to-use-it/desktop-and-mobile-app",
          },
          {
            text: "🔒 Privacy and security",
            link: "/how-to-use-it/privacy-security",
          },
          {
            text: "Console",
            link: "/how-to-use-it/console/README.md",
            items: [
              {
                text: "Users",
                link: "/how-to-use-it/console/users",
              },
            ],
          },
          {
            text: "Company & workspace",
            link: "/how-to-use-it/company-and-workspace/README.md",
            items: [
              {
                text: "Invite user",
                link: "/how-to-use-it/company-and-workspace/invite-user-from-chat",
              },
              {
                text: "Rights",
                link: "/how-to-use-it/company-and-workspace/rights",
              },
            ],
          },
          {
            text: "Chat",
            link: "/how-to-use-it/applications/how-to-use-chat/README.md",
            items: [
              {
                text: "Channels",
                link: "/how-to-use-it/applications/how-to-use-chat/channels",
              },
              {
                text: "Message",
                link: "/how-to-use-it/applications/how-to-use-chat/message",
              },
            ],
          },
          {
            text: "Drive",
            link: "/how-to-use-it/applications/drive/README.md",
            items: [
              {
                text: "File and folder",
                link: "/how-to-use-it/applications/drive/file-and-folder",
              },
              {
                text: "Share file with public link",
                link: "/how-to-use-it/applications/drive/share-file-with-public-link",
              },
            ],
          },
          {
            text: "Connectors",
            link: "/how-to-use-it/applications/connectors/README.md",
            items: [
              {
                text: "n8n",
                link: "/how-to-use-it/applications/connectors/n8n",
              },
            ],
          },
        ],
      },
      {
        text: "Internal documentation",
        items: [
          {
            text: "Our stack",
            link: "/internal-documentation/our-stack",
          },
          {
            text: "Translation",
            link: "/internal-documentation/translation",
          },
          {
            text: "Backend services",
            items: [
              {
                text: "Get started",
                link: "/internal-documentation/backend-services/intro/README.md",
              },
              {
                text: "Applications",
                link: "/internal-documentation/backend-services/applications/README.md",
              },
              {
                text: "Channels",
                link: "/internal-documentation/backend-services/channels/README.md",
              },
              {
                text: "Documents",
                link: "/internal-documentation/backend-services/documents/README.md",
              },
              {
                text: "Files",
                link: "/internal-documentation/backend-services/files/README.md",
              },
              {
                text: "Tags",
                link: "/internal-documentation/backend-services/tags/README.md",
              },
              {
                text: "Knowledge graph",
                link: "/internal-documentation/backend-services/knowledge-graph/README.md",
              },
              {
                text: "Notifications",
                link: "/internal-documentation/backend-services/notifications/README.md",
              },
            ],
          },

          {
            text: "Frontend components",
            items: [
              {
                text: "Get started",
                link: "/internal-documentation/frontend-components/intro/README.md",
              },
            ],
          },
        ],
      },
    ],
  },
  head: [],
};
