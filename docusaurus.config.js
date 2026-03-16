const config = {
    title: 'OMATrust Developer Docs',
    tagline: 'Documentation for OMATrust Developers',
    url: 'https://docs.omatrust.org',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'oma3dao', // Usually your GitHub org/user name.
    projectName: 'developer-docs', // Usually your repo name.
  
    presets: [
      [
        'classic',
        {
          docs: {
            sidebarPath: require.resolve('./sidebars.js'),
            routeBasePath: '/',
          },
          theme: {
            customCss: require.resolve('./src/css/custom.css'),
          },
        },
      ],
    ],
  
    themeConfig: {
      navbar: {
        title: 'OMATrust Developer Docs',
        logo: {
          alt: 'OMA3 Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            href: 'https://github.com/oma3dao/developer-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} OMA3. Built with Docusaurus.`,
      },
    },
  };
  
  module.exports = config;