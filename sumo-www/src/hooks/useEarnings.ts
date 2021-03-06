import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getEarned } from '../sumoUtils'
import useSumo from './useSumo'

const useEarnings = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const sumo = useSumo()

  const fetchBalance = useCallback(async () => {
    const balance = await getEarned(sumo, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, sumo])

  useEffect(() => {
    if (account && pool && sumo) {
      fetchBalance()
    }
  }, [account, pool, setBalance, sumo])

  return balance
}

export default useEarnings
