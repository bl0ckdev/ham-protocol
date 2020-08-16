import { Sumo } from '../../sumo'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
} from '../../sumoUtils'

const getCurrentPrice = async (sumo: typeof Sumo): Promise<number> => {
  // FORBROCK: get current SUMO price
  return gCP(sumo)
}

const getTargetPrice = async (sumo: typeof Sumo): Promise<number> => {
  // FORBROCK: get target SUMO price
  return gTP(sumo)
}

const getCirculatingSupply = async (sumo: typeof Sumo): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(sumo)
}

const getNextRebaseTimestamp = async (sumo: typeof Sumo): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(sumo) as number
  return nextRebase * 1000
}

const getTotalSupply = async (sumo: typeof Sumo): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(sumo)
}

export const getStats = async (sumo: typeof Sumo) => {
  const curPrice = await getCurrentPrice(sumo)
  const circSupply = '' // await getCirculatingSupply(sumo)
  const nextRebase = await getNextRebaseTimestamp(sumo)
  const targetPrice = await getTargetPrice(sumo)
  const totalSupply = await getTotalSupply(sumo)
  return {
    circSupply,
    curPrice,
    nextRebase,
    targetPrice,
    totalSupply
  }
}
