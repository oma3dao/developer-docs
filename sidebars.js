const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'overview',
        'tokenized-app',
        'architecture',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'attestations',
        'infrastructure',
      ],
    },
    {
      type: 'category',
      label: 'Registration',
      items: [
        'registration-guide',
        {
          type: 'category',
          label: 'Cookbooks',
          items: [
            'cookbooks/register-website',
            'cookbooks/register-api',
            'cookbooks/register-mcp-server',
            'cookbooks/register-a2a-agent',
            'cookbooks/register-smart-contract',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Integration',
      items: [
        'client-guide',
        'auditor-guide',
        'integration-examples',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/controller-witness',
        'api/delegated-attestation',
      ],
    },
    {
      type: 'doc',
      id: 'faq',
      label: 'FAQ',
    },
  ],
};

module.exports = sidebars;
