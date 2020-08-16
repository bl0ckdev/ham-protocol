// ============ Contracts ============

// Token
// deployed first
const SUMOImplementation = artifacts.require("SUMODelegate");
const SUMOProxy = artifacts.require("SUMODelegator");

// Rs
// deployed second
const SUMOReserves = artifacts.require("SUMOReserves");
const SUMORebaser = artifacts.require("SUMORebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(SUMOReserves, reserveToken, SUMOProxy.address);
  await deployer.deploy(SUMORebaser,
      SUMOProxy.address,
      reserveToken,
      uniswap_factory,
      SUMOReserves.address
  );
  let rebase = new web3.eth.Contract(SUMORebaser.abi, SUMORebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log(pair)
  let sumo = await SUMOProxy.deployed();
  await sumo._setRebaser(SUMORebaser.address);
  let reserves = await SUMOReserves.deployed();
  await reserves._setRebaser(SUMORebaser.address)
}
