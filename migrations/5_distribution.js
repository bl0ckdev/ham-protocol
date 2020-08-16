var fs = require('fs')

// ============ Contracts ============


// Protocol
// deployed second
const SUMOImplementation = artifacts.require("SUMODelegate");
const SUMOProxy = artifacts.require("SUMODelegator");

// deployed third
const SUMOReserves = artifacts.require("SUMOReserves");
const SUMORebaser = artifacts.require("SUMORebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const SUMO_ETHPool = artifacts.require("SUMOETHPool");
const SUMO_uAMPLPool = artifacts.require("SUMOAMPLPool");
const SUMO_YFIPool = artifacts.require("SUMOYFIPool");
const SUMO_LINKPool = artifacts.require("SUMOLINKPool");
const SUMO_MKRPool = artifacts.require("SUMOMKRPool");
const SUMO_LENDPool = artifacts.require("SUMOLENDPool");
const SUMO_COMPPool = artifacts.require("SUMOCOMPPool");
const SUMO_SNXPool = artifacts.require("SUMOSNXPool");


// deployed fifth
const SUMOIncentivizer = artifacts.require("SUMOIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let sumo = await SUMOProxy.deployed();
  let yReserves = await SUMOReserves.deployed()
  let yRebaser = await SUMORebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {
    await deployer.deploy(SUMO_ETHPool);
    await deployer.deploy(SUMO_uAMPLPool);
    await deployer.deploy(SUMO_YFIPool);
    await deployer.deploy(SUMOIncentivizer);
    await deployer.deploy(SUMO_LINKPool);
    await deployer.deploy(SUMO_MKRPool);
    await deployer.deploy(SUMO_LENDPool);
    await deployer.deploy(SUMO_COMPPool);
    await deployer.deploy(SUMO_SNXPool);

    let eth_pool = new web3.eth.Contract(SUMO_ETHPool.abi, SUMO_ETHPool.address);
    let ampl_pool = new web3.eth.Contract(SUMO_uAMPLPool.abi, SUMO_uAMPLPool.address);
    let yfi_pool = new web3.eth.Contract(SUMO_YFIPool.abi, SUMO_YFIPool.address);
    let lend_pool = new web3.eth.Contract(SUMO_LENDPool.abi, SUMO_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(SUMO_MKRPool.abi, SUMO_MKRPool.address);
    let snx_pool = new web3.eth.Contract(SUMO_SNXPool.abi, SUMO_SNXPool.address);
    let comp_pool = new web3.eth.Contract(SUMO_COMPPool.abi, SUMO_COMPPool.address);
    let link_pool = new web3.eth.Contract(SUMO_LINKPool.abi, SUMO_LINKPool.address);
    let ycrv_pool = new web3.eth.Contract(SUMOIncentivizer.abi, SUMOIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        eth_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ampl_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        yfi_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        lend_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        mkr_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        snx_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        comp_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        link_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
      ]);

    let two_fifty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(250));
    let one_five = two_fifty.mul(web3.utils.toBN(6));

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      sumo.transfer(SUMO_ETHPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_uAMPLPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_YFIPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_LENDPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_MKRPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_SNXPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_COMPPool.address, two_fifty.toString()),
      sumo.transfer(SUMO_LINKPool.address, two_fifty.toString()),
      sumo._setIncentivizer(SUMOIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      ampl_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      yfi_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      lend_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      mkr_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      snx_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      comp_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      link_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      
      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: accounts[0], gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
  }

  await Promise.all([
    sumo._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        SUMOProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        SUMOReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        SUMORebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
