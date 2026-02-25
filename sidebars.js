const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Start Here',
      items: [
        'start-here/overview',
        'start-here/definitions',
        'start-here/quickstart-publish',
        'start-here/quickstart-verify',
      ],
    },
    {
      type: 'category',
      label: 'Reputation',
      items: [
        'reputation/reputation-model',
        {
          type: 'doc',
          id: 'reputation/attestation-types',
          label: 'Attestation Types',
        },
        'reputation/verification-flow',
        'reputation/trust-scoring',
        {
          type: 'doc',
          id: 'reputation/issuer-workflow',
          label: 'Issuer Workflow',
        },
        {
          type: 'doc',
          id: 'reputation/consumer-workflow',
          label: 'Consumer Workflow',
        },
      ],
    },
    {
      type: 'category',
      label: 'SDKs & APIs',
      items: [
        'sdk/getting-started',
        {
          type: 'doc',
          id: 'sdk/guides',
          label: 'Guides',
        },
        {
          type: 'category',
          label: 'TypeScript SDK',
          items: [
            {
              type: 'doc',
              id: 'sdk/api-reference/reputation-sdk',
              label: 'Reputation SDK Reference',
            },
            {
              type: 'doc',
              id: 'sdk/api-reference/identity-sdk',
              label: 'Identity SDK Reference',
            },
          ],
        },
        {
          type: 'category',
          label: 'HTTP APIs',
          items: [
            'api/delegated-attestation',
            'api/controller-witness',
          ],
        },
        {
          type: 'category',
          label: 'Schemas',
          items: [
            {
              type: 'doc',
              id: 'sdk/schemas/json-schemas',
              label: 'JSON Schemas (Canonical)',
            },
            {
              type: 'doc',
              id: 'sdk/schemas/eas-schema-definitions',
              label: 'EAS Schema Definitions',
            },
          ],
        },
        // 'sdk/data-model-overview', // Hidden — see GitHub issue
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/x402-integration',
        'integrations/erc8004-integration',
      ],
    },

    // App Registry — hidden, see GitHub issue #XX: Refine App Registry docs and re-publish
    // {
    //   type: 'category',
    //   label: 'App Registry (Preview)',
    //   items: [
    //     'app-registry/overview',
    //     'app-registry/status',
    //     {
    //       type: 'doc',
    //       id: 'app-registry/erc8004-compatibility',
    //       label: 'ERC-8004 compatibility and extensions',
    //     },
    //     {
    //       type: 'doc',
    //       id: 'app-registry/registry-concepts',
    //       label: 'Registry Concepts',
    //     },
    //     'app-registry/deduplication-model',
    //     'app-registry/migration-path',
    //     'app-registry/registration-guide',
    //     {
    //       type: 'category',
    //       label: 'Cookbooks',
    //       items: [
    //         'app-registry/cookbooks/register-website',
    //         'app-registry/cookbooks/register-api',
    //         'app-registry/cookbooks/register-mcp-server',
    //         'app-registry/cookbooks/register-a2a-agent',
    //         'app-registry/cookbooks/register-smart-contract',
    //       ],
    //     },
    //     {
    //       type: 'doc',
    //       id: 'app-registry/integration-examples',
    //       label: 'Integration Code Examples',
    //     },
    //     {
    //       type: 'doc',
    //       id: 'app-registry/registry-sdk-reference',
    //       label: 'Registry SDK Reference',
    //     },
    //     'app-registry/cloudinary-guide',
    //   ],
    // },
    // Chain Architecture — hidden, see GitHub issue
    // {
    //   type: 'category',
    //   label: 'Chain Architecture',
    //   items: [
    //     'chain-architecture/omachain',
    //     'chain-architecture/other-chains',
    //   ],
    // },
    // Operations — hidden, see GitHub issue
    // {
    //   type: 'category',
    //   label: 'Operations',
    //   items: [
    //     'operations/running-an-issuer',
    //     'operations/governance-schema-control',
    //     'operations/versioning-policy',
    //     'operations/changelog',
    //   ],
    // },
    // FAQ — hidden, see GitHub issue
    // {
    //   type: 'doc',
    //   id: 'faq',
    //   label: 'FAQ',
    // },
  ],
};

module.exports = sidebars;