# OMATrust Developer Documentation

**The Trust Layer for the Open Internet**

This repository contains the complete developer documentation for OMATrust, built with [Docusaurus 2](https://docusaurus.io/).

## 🚀 Quick Start

### View Documentation Locally

```bash
npm install
npm start
```

Opens browser at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run serve
```

## 📚 Documentation Structure

### Getting Started (3 pages)
- **Overview** - Vision, problem/solution, architecture at a glance
- **Tokenized Services** - Data model, interfaces, versioning
- **Architecture** - Technical deep dive, contracts, storage strategy

### Core Concepts (2 pages)
- **Attestations** - Trust framework, verification types, trust levels
- **Infrastructure** - Deployment, monitoring, scaling

### Registration (6 pages)
- **Registration Guide** - General walkthrough
- **Cookbooks:**
  - Register Website - Domain verification, trust badges
  - Register API - REST/GraphQL/JSON-RPC services
  - Register MCP Server - AI agent integration
  - Register A2A Agent - Agent-to-agent protocol
  - Register Smart Contract - On-chain applications

### Integration (3 pages)
- **Client Guide** - Query registry, verify services
- **Auditor Guide** - Issue attestations, oracle patterns
- **Integration Examples** - Complete code (TypeScript, Python, Solidity)

### Reference (1 page)
- **FAQ** - Troubleshooting, common questions

**Total: 15 comprehensive pages**

## 🎯 Key Features

### Multi-Interface Support

Documents three interface types:
- **Human (1)** - Websites, apps, downloadable binaries
- **API (2)** - REST, GraphQL, JSON-RPC, MCP, A2A
- **Smart Contract (4)** - DeFi, NFTs, on-chain apps

### Complete Code Examples

- ✅ TypeScript/JavaScript (Thirdweb SDK)
- ✅ Python (Web3.py for AI agents)
- ✅ Solidity (On-chain verification)
- ✅ CLI tools
- ✅ React components

### Practical Cookbooks

Step-by-step guides for real-world scenarios:
- E-commerce website with trust badges
- GraphQL API with schema verification
- MCP server for AI agents
- A2A agent registration
- DeFi protocol with audit integration

### Multiple Perspectives

- **Developers** - How to register and manage services
- **Auditors** - How to issue attestations
- **Clients** - How to query and verify services
- **AI Agents** - How to discover and trust services

## 🔧 Local Development

### Installation

```bash
npm install
```

### Start Dev Server

```bash
npm start
```

Hot reload enabled - edit docs and see changes instantly.

### Build

```bash
npm run build
```

Generates static site in `build/` directory.

### Deployment

```bash
npm run deploy
```

Or deploy via CI/CD to your hosting provider.

## 📝 Writing Documentation

### Add a New Page

1. Create file in `docs/`:
```markdown
---
id: my-page
title: My Page Title
sidebar_position: 5
---

# My Page Title

Content here...
```

2. Add to `sidebars.js`:
```javascript
{
  type: 'doc',
  id: 'my-page',
  label: 'My Page',
}
```

### Code Blocks

Use syntax highlighting:

````markdown
```typescript
const example = "code here";
```
````

Supported languages: typescript, javascript, python, solidity, bash, json, etc.

### Callouts

```markdown
:::note
This is a note
:::

:::tip
Helpful tip here
:::

:::warning
Warning message
:::

:::danger
Critical warning
:::
```

## 📊 Documentation Coverage

### By Topic

- ✅ **Registration** - Complete for all interface types
- ✅ **Verification** - DID ownership, dataHash, attestations
- ✅ **Client Integration** - TypeScript, Python, Solidity
- ✅ **Auditor Workflow** - Issuing attestations, economics
- ✅ **Architecture** - Contracts, storage, deployment
- ⚠️ **Images** - Need to update diagrams
- ⏳ **Videos** - Not yet created

### By Audience

- ✅ **Service Publishers** - How to register
- ✅ **Developers** - How to integrate
- ✅ **Auditors** - How to issue attestations
- ✅ **Users** - How to verify services
- ✅ **AI Agents** - How to discover and use services

### By Interface Type

- ✅ **Human** - Websites, downloadable apps
- ✅ **API** - REST, GraphQL, JSON-RPC
- ✅ **MCP** - Model Context Protocol for AI
- ✅ **A2A** - Agent-to-Agent protocol
- ✅ **Smart Contracts** - On-chain applications

## 🎨 Style Guide

### Tone

- **Clear and direct** - No fluff
- **Practical** - Focus on "how to"
- **Code-first** - Show, don't just tell
- **Accessible** - Explain blockchain concepts simply

### Structure

- **Start with problem** - Why does this matter?
- **Show solution** - Here's how to do it
- **Provide examples** - Complete, working code
- **Link next steps** - Where to go from here

### Code Examples

- Must be **complete and working**
- Include **error handling**
- Show **best practices**
- Provide **context** (when to use this pattern)

## 🔗 External Links

- **Registry UI:** https://registry.omatrust.org
- **Reputation UI:** https://reputation.oma3.org
- **Specification:** https://github.com/oma3dao/omatrust-docs
- **Smart Contracts:** https://github.com/oma3dao/app-registry-evm-solidity
- **Frontend:** https://github.com/oma3dao/app-registry-frontend

## 📜 License

- **Code Examples:** MIT License
- **Documentation:** Creative Commons Attribution 4.0 International (CC BY 4.0)

See LICENSE and LICENSE-DOCS for full details.

## 🤝 Contributing

Contributions welcome!

**How to contribute:**
1. Fork the repository
2. Create a branch (`git checkout -b improve-docs`)
3. Make your changes
4. Test locally (`npm start`)
5. Submit a pull request

**Types of contributions:**
- Fix typos or unclear explanations
- Add code examples
- Create new cookbooks for specific use cases
- Translate to other languages
- Improve diagrams

## 🆘 Support

**Issues with documentation:**
- GitHub Issues: https://github.com/oma3dao/developer-docs/issues

**Security issues:**
- Email: security@oma3.org (responsible disclosure)

---

**Built with ❤️ by the OMA3 community**
