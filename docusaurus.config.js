const config = {
    title: 'OMA3 Developer Docs',
    tagline: 'Documentation for OMA3 Developers',
    url: 'https://docs.oma3.org',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'oma3', // Usually your GitHub org/user name.
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
        title: 'OMA3 Developer Docs',
        logo: {
          alt: 'OMA3 Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            href: 'https://github.com/oma3/developer-docs',
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