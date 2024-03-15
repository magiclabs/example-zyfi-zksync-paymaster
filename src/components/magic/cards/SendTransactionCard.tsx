import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import { getFaucetUrl, getNetworkToken } from '@/utils/network';
import showToast from '@/utils/showToast';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import Image from 'next/image';
import Link from 'public/link.svg';
import { zkSyncSepoliaTestnet } from "viem/chains"

const SendTransaction = () => {
  const { web3, walletClient } = useMagic();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [disabled, setDisabled] = useState(!toAddress || !amount);
  const [hash, setHash] = useState('');
  const [toAddressError, setToAddressError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const publicAddress = localStorage.getItem('user');

  useEffect(() => {
    setDisabled(!toAddress || !amount);
    setAmountError(false);
    setToAddressError(false);
  }, [amount, toAddress]);

  const sendTransaction = useCallback(async () => {
    if (!web3?.utils.isAddress(toAddress)) {
      return setToAddressError(true);
    }
    if (isNaN(Number(amount))) {
      return setAmountError(true);
    }
    setDisabled(true);

    const res = await fetch('https://api.zyfi.org/api/erc20_paymaster/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "feeTokenAddress": "0xFD1fBFf2E1bAa053C927dc513579a8B2727233D8",
        "isTestnet": true,
        "txData": {
          "from": publicAddress,
          "to": toAddress,
          "value": web3.utils.toWei(amount, 'ether'),
          "data": "0x"
        }
      })
    })

    const { txData: apiTxData } = await res.json();

    const paymasterTxData = {
      account: publicAddress as `0x${string}`,
      to: apiTxData.to,
      value: BigInt(apiTxData.value),
      chain: zkSyncSepoliaTestnet,
      gas: BigInt(apiTxData.gasLimit),
      gasPerPubdata: BigInt(apiTxData.customData.gasPerPubdata),
      maxFeePerGas: BigInt(apiTxData.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(0),
      data: apiTxData.data,
      paymaster: apiTxData.customData.paymasterParams.paymaster,
      paymasterInput: apiTxData.customData.paymasterParams.paymasterInput,
    };

    try {
      const hash = await walletClient?.sendTransaction(paymasterTxData);
      setHash(hash)
    } catch (err) {
      console.log("Something went wrong: ", err)
    }

  }, [web3, amount, publicAddress, toAddress]);

  return (
    <Card>
      <CardHeader id="send-transaction">Send Transaction</CardHeader>
      {getFaucetUrl() && (
        <div>
          <a href={getFaucetUrl()} target="_blank" rel="noreferrer">
            <FormButton onClick={() => null} disabled={false}>
              Get Test {getNetworkToken()}
              <Image src={Link} alt="link-icon" className="ml-[3px]" />
            </FormButton>
          </a>
          <Divider />
        </div>
      )}

      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
      <FormInput
        value={amount}
        onChange={(e: any) => setAmount(e.target.value)}
        placeholder={`Amount (${getNetworkToken()})`}
      />
      {amountError ? <ErrorText className="error">Invalid amount</ErrorText> : null}
      <FormButton onClick={sendTransaction} disabled={!toAddress || !amount || disabled}>
        Send Transaction
      </FormButton>

      {hash ? (
        <>
          <Spacer size={20} />
          <TransactionHistory />
        </>
      ) : null}
    </Card>
  );
};

export default SendTransaction;
