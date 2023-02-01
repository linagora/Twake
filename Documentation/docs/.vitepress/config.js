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
            link: "/onprem/configuration/index",
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
            text: "Knowledge graph",
            link: "/internal-documentation/knowledge-graph",
          },
          {
            text: "Backend services",
            items: [
              {
                text: "Get started with backend development",
                link: "/internal-documentation/backend-services/intro",
              },
              {
                text: "Applications",
                link: "/internal-documentation/backend-services/applications",
              },
              {
                text: "Channels",
                link: "/internal-documentation/backend-services/channels",
              },
              {
                text: "Documents",
                link: "/internal-documentation/backend-services/documents/README.md",
              },
              {
                text: "Files",
                link: "/internal-documentation/backend-services/files",
              },
              {
                text: "Knowledge graph",
                link: "/internal-documentation/backend-services/knowledge-graph",
              },
              {
                text: "Notifications",
                link: "/internal-documentation/backend-services/notifications",
              },
              {
                text: "Twake service Development",
                link: "/internal-documentation/backend-services/twake-service-development",
              },
            ],
          },

          {
            text: "Frontend components",
            items: [
              {
                text: "Get started with frontend development",
                link: "/internal-documentation/frontend-components/intro",
              },
            ],
          },
        ],
      },
    ],
  },
  head: [],
};
