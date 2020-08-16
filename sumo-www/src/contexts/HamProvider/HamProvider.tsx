import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Sumo } from '../../sumo'

export interface SumoContext {
  sumo?: typeof Sumo
}

export const Context = createContext<SumoContext>({
  sumo: undefined,
})

declare global {
  interface Window {
    sumosauce: any
  }
}

const SumoProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [sumo, setSumo] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const sumoLib = new Sumo(
        ethereum,
        "1",
        false, {
          defaultAccount: "",
          defaultConfirmations: 1,
          autoGasMultiplier: 1.5,
          testing: false,
          defaultGas: "6000000",
          defaultGasPrice: "1000000000000",
          accounts: [],
          ethereumNodeTimeout: 10000
        }
      )
      setSumo(sumoLib)
      window.sumosauce = sumoLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ sumo }}>
      {children}
    </Context.Provider>
  )
}

export default SumoProvider
