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

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await sumo.web3.eth.getAccounts();
    sumo.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await sumo.testing.snapshot();
  });

  beforeEach(async () => {
    await sumo.testing.resetEVM("0x2");
    let a = await sumo.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await sumo.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await sumo.contracts.uni_fact.methods.createPair(
        sumo.contracts.ycrv.options.address,
        sumo.contracts.sumo.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();
      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();
      expect(sumo.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();
      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(1000);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await sumo.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(sumo.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(sumo.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();
      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(1000);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await sumo.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(sumo.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(sumo.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await sumo.testing.increaseTime(12 * 60 * 60);

      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await sumo.contracts.sumo.methods.balanceOf(
          sumo.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await sumo.testing.increaseTime(i);

      let r = await sumo.contracts.uni_pair.methods.getReserves().call();
      let q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let resSUMO = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      let resycrv = await sumo.contracts.ycrv.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      console.log("bal user, bal sumo res, bal res crv", bal1, resSUMO, resycrv);
      r = await sumo.contracts.uni_pair.methods.getReserves().call();
      q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(sumo.toBigN(bal).toNumber()).toBeLessThan(sumo.toBigN(bal1).toNumber());
      // used full sumo reserves
      expect(sumo.toBigN(resSUMO).toNumber()).toBe(0);
      // increases reserves
      expect(sumo.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(sumo.toBigN(q).toNumber()).toBeGreaterThan(sumo.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await sumo.testing.increaseTime(i);

      let r = await sumo.contracts.uni_pair.methods.getReserves().call();
      let q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let resSUMO = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      let resycrv = await sumo.contracts.ycrv.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      // balance decreases
      expect(sumo.toBigN(bal1).toNumber()).toBeLessThan(sumo.toBigN(bal).toNumber());
      // no increases to reserves
      expect(sumo.toBigN(resSUMO).toNumber()).toBe(0);
      expect(sumo.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await sumo.testing.increaseTime(i);

      let r = await sumo.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let resSUMO = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      let resycrv = await sumo.contracts.ycrv.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      // no change
      expect(sumo.toBigN(bal1).toNumber()).toBe(sumo.toBigN(bal).toNumber());
      // no increases to reserves
      expect(sumo.toBigN(resSUMO).toNumber()).toBe(0);
      expect(sumo.toBigN(resycrv).toNumber()).toBe(0);
      r = await sumo.contracts.uni_pair.methods.getReserves().call();
      q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with SUMO in reserves", async () => {
      await sumo.contracts.sumo.methods.transfer(sumo.contracts.reserves.options.address, sumo.toBigN(60000*10**18).toString()).send({from: user});
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await sumo.testing.increaseTime(i);


      let r = await sumo.contracts.uni_pair.methods.getReserves().call();
      let q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let resSUMO = await sumo.contracts.sumo.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      let resycrv = await sumo.contracts.ycrv.methods.balanceOf(sumo.contracts.reserves.options.address).call();

      console.log(bal, bal1, resSUMO, resycrv);
      expect(sumo.toBigN(bal).toNumber()).toBeLessThan(sumo.toBigN(bal1).toNumber());
      expect(sumo.toBigN(resSUMO).toNumber()).toBeGreaterThan(0);
      expect(sumo.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await sumo.contracts.uni_pair.methods.getReserves().call();
      q = await sumo.contracts.uni_router.methods.quote(sumo.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(sumo.toBigN(q).toNumber()).toBeGreaterThan(sumo.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await sumo.testing.expectThrow(sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await sumo.testing.expectThrow(sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await sumo.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await sumo.testing.increaseTime(i + sumo.toBigN(len).toNumber()+1);

      let b = await sumo.testing.expectThrow(sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await sumo.contracts.sumo.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await sumo.contracts.ycrv.methods.approve(
        sumo.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await sumo.contracts.uni_router.methods.addLiquidity(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await sumo.contracts.uni_fact.methods.getPair(
        sumo.contracts.sumo.options.address,
        sumo.contracts.ycrv.options.address
      ).call();

      sumo.contracts.uni_pair.options.address = pair;
      let bal = await sumo.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          sumo.contracts.sumo.options.address,
          sumo.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await sumo.testing.increaseTime(43200);

      await sumo.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await sumo.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await sumo.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await sumo.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          sumo.contracts.ycrv.options.address,
          sumo.contracts.sumo.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await sumo.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await sumo.contracts.sumo.methods.balanceOf(user).call();

      let a = await sumo.web3.eth.getBlock('latest');

      let offset = await sumo.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = sumo.toBigN(offset).toNumber();
      let interval = await sumo.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = sumo.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await sumo.testing.increaseTime(i - 1);



      let b = await sumo.testing.expectThrow(sumo.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
