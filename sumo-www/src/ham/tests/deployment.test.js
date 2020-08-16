import {
  Sumo
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const sumo = new Sumo(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
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
const oneEther = 10 ** 18;

describe("post-deployment", () => {
  let snapshotId;
  let user;

  beforeAll(async () => {
    const accounts = await sumo.web3.eth.getAccounts();
    sumo.addAccount(accounts[0]);
    user = accounts[0];
    snapshotId = await sumo.testing.snapshot();
  });

  beforeEach(async () => {
    await sumo.testing.resetEVM("0x2");
  });

  describe("supply ownership", () => {

    test("owner balance", async () => {
      let balance = await sumo.contracts.sumo.methods.balanceOf(user).call();
      expect(balance).toBe(sumo.toBigN(7000000).times(sumo.toBigN(10**18)).toString())
    });

    test("pool balances", async () => {
      let ycrv_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.ycrv_pool.options.address).call();

      expect(ycrv_balance).toBe(sumo.toBigN(1500000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let yfi_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.yfi_pool.options.address).call();

      expect(yfi_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let ampl_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.ampl_pool.options.address).call();

      expect(ampl_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let eth_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.eth_pool.options.address).call();

      expect(eth_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let snx_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.snx_pool.options.address).call();

      expect(snx_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let comp_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.comp_pool.options.address).call();

      expect(comp_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let lend_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.lend_pool.options.address).call();

      expect(lend_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let link_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.link_pool.options.address).call();

      expect(link_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

      let mkr_balance = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.mkr_pool.options.address).call();

      expect(mkr_balance).toBe(sumo.toBigN(250000).times(sumo.toBigN(10**18)).times(sumo.toBigN(1)).toString())

    });

    test("total supply", async () => {
      let ts = await sumo.contracts.sumo.methods.totalSupply().call();
      expect(ts).toBe("10500000000000000000000000")
    });

    test("init supply", async () => {
      let init_s = await sumo.contracts.sumo.methods.initSupply().call();
      expect(init_s).toBe("10500000000000000000000000000000")
    });
  });

  describe("contract ownership", () => {

    test("sumo gov", async () => {
      let gov = await sumo.contracts.sumo.methods.gov().call();
      expect(gov).toBe(sumo.contracts.timelock.options.address)
    });

    test("rebaser gov", async () => {
      let gov = await sumo.contracts.rebaser.methods.gov().call();
      expect(gov).toBe(sumo.contracts.timelock.options.address)
    });

    test("reserves gov", async () => {
      let gov = await sumo.contracts.reserves.methods.gov().call();
      expect(gov).toBe(sumo.contracts.timelock.options.address)
    });

    test("timelock admin", async () => {
      let gov = await sumo.contracts.timelock.methods.admin().call();
      expect(gov).toBe(sumo.contracts.gov.options.address)
    });

    test("gov timelock", async () => {
      let tl = await sumo.contracts.gov.methods.timelock().call();
      expect(tl).toBe(sumo.contracts.timelock.options.address)
    });

    test("gov guardian", async () => {
      let grd = await sumo.contracts.gov.methods.guardian().call();
      expect(grd).toBe("0x0000000000000000000000000000000000000000")
    });

    test("pool owner", async () => {
      let owner = await sumo.contracts.eth_pool.methods.owner().call();
      expect(owner).toBe(sumo.contracts.timelock.options.address)
    });

    test("incentives owner", async () => {
      let owner = await sumo.contracts.ycrv_pool.methods.owner().call();
      expect(owner).toBe(sumo.contracts.timelock.options.address)
    });

    test("pool rewarder", async () => {
      let rewarder = await sumo.contracts.eth_pool.methods.rewardDistribution().call();
      expect(rewarder).toBe(sumo.contracts.timelock.options.address)
    });
  });

  describe("timelock delay initiated", () => {
    test("timelock delay initiated", async () => {
      let inited = await sumo.contracts.timelock.methods.admin_initialized().call();
      expect(inited).toBe(true);
    })
  })
})
