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
    ],
  },
  head: [],
};
