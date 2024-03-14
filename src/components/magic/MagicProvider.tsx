import { getChainId, getNetworkUrl } from '@/utils/network';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic as MagicBase } from 'magic-sdk';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Client, createWalletClient, custom } from 'viem';
import { zkSyncSepoliaTestnet } from 'viem/chains';
import { eip712WalletActions } from "viem/zksync"
const { Web3 } = require('web3');

export type Magic = MagicBase<OAuthExtension[]>;

type MagicContextType = {
  magic: Magic | null;
  web3: typeof Web3 | null;
  walletClient: any | null;
};

const MagicContext = createContext<MagicContextType>({
  magic: null,
  web3: null,
  walletClient: null,
});

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [web3, setWeb3] = useState<typeof Web3 | null>(null);
  const [walletClient, setWalletClient] = useState<Client | null>(null);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAGIC_API_KEY) {
      const magic = new MagicBase(process.env.NEXT_PUBLIC_MAGIC_API_KEY as string, {
        network: {
          rpcUrl: getNetworkUrl(),
          chainId: getChainId(),
        },
        extensions: [new OAuthExtension()],
      });
      const initializeWalletClient = async () => {
        const provider = await magic?.wallet.getProvider() // Correctly await the provider

        const walletClient = createWalletClient({
          chain: zkSyncSepoliaTestnet,
          account: localStorage.getItem("user") as `0x${string}`,
          transport: custom(provider), // This now receives the awaited value
        }).extend(eip712WalletActions());
        setWalletClient(walletClient)
      }

      initializeWalletClient();
      setMagic(magic);
      setWeb3(new Web3((magic as any).rpcProvider));
    }
  }, []);

  const value = useMemo(() => {
    return {
      magic,
      web3,
      walletClient
    };
  }, [magic, web3, walletClient]);

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};

export default MagicProvider;
