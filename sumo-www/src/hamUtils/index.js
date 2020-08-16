import {ethers} from 'ethers'

import BigNumber from 'bignumber.js'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
});

export const getPoolStartTime = async (poolContract) => {
  return await poolContract.methods.starttime().call()
}

export const stake = async (poolContract, amount, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .stake((new BigNumber(amount).times(new BigNumber(10).pow(18))).toString())
      .send({ from: account, gas: 200000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const unstake = async (poolContract, amount, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .withdraw((new BigNumber(amount).times(new BigNumber(10).pow(18))).toString())
      .send({ from: account, gas: 200000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const harvest = async (poolContract, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .getReward()
      .send({ from: account, gas: 200000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const redeem = async (poolContract, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .exit()
      .send({ from: account, gas: 400000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const approve = async (tokenContract, poolContract, account) => {
  return tokenContract.methods
    .approve(poolContract.options.address, ethers.constants.MaxUint256)
    .send({ from: account, gas: 80000 })
}

export const getPoolContracts = async (sumo) => {
  const pools = Object.keys(sumo.contracts)
    .filter(c => c.indexOf('_pool') !== -1)
    .reduce((acc, cur) => {
      const newAcc = { ...acc }
      newAcc[cur] = sumo.contracts[cur]
      return newAcc
    }, {})
  return pools
}

export const getEarned = async (sumo, pool, account) => {
  const scalingFactor = new BigNumber(await sumo.contracts.sumo.methods.sumosScalingFactor().call())
  const earned = new BigNumber(await pool.methods.earned(account).call())
  return earned.multipliedBy(scalingFactor.dividedBy(new BigNumber(10).pow(18)))
}

export const getStaked = async (sumo, pool, account) => {
  return sumo.toBigN(await pool.methods.balanceOf(account).call())
}

export const getCurrentPrice = async (sumo) => {
  // FORBROCK: get current SUMO price
  return sumo.toBigN(await sumo.contracts.rebaser.methods.getCurrentTWAP().call())
}

export const getTargetPrice = async (sumo) => {
  return sumo.toBigN(1).toFixed(2);
}

export const getCirculatingSupply = async (sumo) => {
  let now = await sumo.web3.eth.getBlock('latest');
  let scalingFactor = sumo.toBigN(await sumo.contracts.sumo.methods.sumosScalingFactor().call());
  let starttime = sumo.toBigN(await sumo.contracts.eth_pool.methods.starttime().call()).toNumber();
  let timePassed = now["timestamp"] - starttime;
  if (timePassed < 0) {
    return 0;
  }
  let sumosDistributed = sumo.toBigN(8 * timePassed * 250000 / 625000); //sumos from first 8 pools
  let starttimePool2 = sumo.toBigN(await sumo.contracts.ycrv_pool.methods.starttime().call()).toNumber();
  timePassed = now["timestamp"] - starttime;
  let pool2Sumos = sumo.toBigN(timePassed * 1500000 / 625000); // sumos from second pool. note: just accounts for first week
  let circulating = pool2Sumos.plus(sumosDistributed).times(scalingFactor).div(10**36).toFixed(2)
  return circulating
}

export const getNextRebaseTimestamp = async (sumo) => {
  try {
    let now = await sumo.web3.eth.getBlock('latest').then(res => res.timestamp);
    let interval = 43200; // 12 hours
    let offset = 28800; // 8am/8pm utc
    let secondsToRebase = 0;
    if (await sumo.contracts.rebaser.methods.rebasingActive().call()) {
      if (now % interval > offset) {
          secondsToRebase = (interval - (now % interval)) + offset;
       } else {
          secondsToRebase = offset - (now % interval);
      }
    } else {
      let twap_init = sumo.toBigN(await sumo.contracts.rebaser.methods.timeOfTWAPInit().call()).toNumber();
      if (twap_init > 0) {
        let delay = sumo.toBigN(await sumo.contracts.rebaser.methods.rebaseDelay().call()).toNumber();
        let endTime = twap_init + delay;
        if (endTime % interval > offset) {
            secondsToRebase = (interval - (endTime % interval)) + offset;
         } else {
            secondsToRebase = offset - (endTime % interval);
        }
        return endTime + secondsToRebase;
      } else {
        return now + 13*60*60; // just know that its greater than 12 hours away
      }
    }
    return secondsToRebase
  } catch (e) {
    console.log(e)
  }
}

export const getTotalSupply = async (sumo) => {
  return await sumo.contracts.sumo.methods.totalSupply().call();
}

export const getStats = async (sumo) => {
  const curPrice = await getCurrentPrice(sumo)
  const circSupply = await getCirculatingSupply(sumo)
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

export const vote = async (sumo, account) => {
  return sumo.contracts.gov.methods.castVote(0, true).send({ from: account })
}

export const delegate = async (sumo, account) => {
  return sumo.contracts.sumo.methods.delegate("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: account, gas: 320000 })
}

export const didDelegate = async (sumo, account) => {
  return await sumo.contracts.sumo.methods.delegates(account).call() === '0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84'
}

export const getVotes = async (sumo) => {
  const votesRaw = new BigNumber(await sumo.contracts.sumo.methods.getCurrentVotes("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").call()).div(10**24)
  return votesRaw
}

export const getScalingFactor = async (sumo) => {
  return new BigNumber(await sumo.contracts.sumo.methods.sumosScalingFactor().call()).dividedBy(new BigNumber(10).pow(18))
}

export const getDelegatedBalance = async (sumo, account) => {
  return new BigNumber(await sumo.contracts.sumo.methods.balanceOfUnderlying(account).call()).div(10**24)
}
