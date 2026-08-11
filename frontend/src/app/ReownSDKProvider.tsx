"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";
import React, { useEffect } from "react";

// Flare Coston2 Testnet
const coston2 = defineChain({
  id: 114,
  caipNetworkId: "eip155:114",
  chainNamespace: "eip155",
  name: "Flare Coston2",
  nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://coston2-api.flare.network/ext/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Coston2 Explorer",
      url: "https://coston2-explorer.flare.network",
    },
  },
});

// Real Reown Cloud Project ID
const projectId = "67f34381083587b27e807ef27b042a51";

let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function getAppKit() {
  if (typeof window === "undefined") return null;

  if (!appKitInstance) {
    const ethersAdapter = new EthersAdapter();

    appKitInstance = createAppKit({
      adapters: [ethersAdapter],
      networks: [coston2],
      projectId,
      metadata: {
        name: "Sentriq Protocol",
        description: "Confidential TEE Security Shield on Flare Network",
        url: window.location.origin,
        icons: [window.location.origin + "/FLR-icon200x200.png"],
      },
      themeMode: "dark" as const,
      themeVariables: {
        "--w3m-accent": "#ea580c",
      },
      enableInjected: true,
      enableEIP6963: true,
    });
  }

  return appKitInstance;
}

export function initOfficialReownAppKit() {
  getAppKit();
}

export function openOfficialReownModal() {
  const kit = getAppKit();
  if (kit) {
    kit.open();
  }
}

export default function ReownSDKInitializer() {
  useEffect(() => {
    getAppKit();
  }, []);

  return null;
}
