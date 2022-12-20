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
        ],
      },
    ],
  },
  head: [],
};
