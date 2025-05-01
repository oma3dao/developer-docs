---
id: infrastructure
title: OMA3 Infrastructure
sidebar_position: 3
---

# OMA3 Registry Infrastructure

OMA3 provides core infrastructure pieces that enable this decentralized alternative to traditional app stores. This page details the technical architecture and components that power this infrastructure.

## Infrastructure Components

The OMA3 App Registry infrastructure consists of these primary components:

### 1. App Registry Smart Contract

An ERC-721 compliant smart contract that:
- Mints unique application tokens
- Stores core application metadata
- Manages the application lifecycle (active, deprecated, replaced)
- Ensures applications are "soulbound" (non-transferable) to their creators (note- in the future there will be transferrable application NFTs as well)
- Provides query APIs for app discovery

### 2. App Metadata Contract

A separate highly optional contract that:
- Holds extended metadata that developers don't want to host themselves
- Allows metadata updates by the original publisher

### 3. Registry Frontend

A web application that:
- Provides a user interface for application registration
- Allows developers to manage their published applications
- Serves as "sample code" for developers of web-based app stores or other ERC721 contracts

## Minting Interaction Flow

The following sequence outlines the typical interaction between system components:

1. A developer connects their wallet to the registry frontend
2. The developer submits information for the app registry contract including name, version, DID, and IWPS Portal URI
3. The developer signs a transaction and the frontend interacts with the App Registry smart contract to mint the application
4. Optionally, the developer also uses the front end to store other metadata on the App Metadata contract

## Reading Interaction Flow

The typical flow for interaction between stores, the app registry, and metadata contracts is:

1. **Discovery**: Store queries the registry contract for available applications
2. **Diplay**: Store queries the dataUrl of an application to retrieve more information (in the future the store will also retrieve reputation information to display to the user)
3. **Selection**: User selects an application to launch
4. **Launch**: Application is launched using the IWPS Protocol URI to kick off the IWPS protocol
5. **Experience**: User interacts with the launched application
