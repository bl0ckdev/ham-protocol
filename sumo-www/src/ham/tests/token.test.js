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

describe("token_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  beforeAll(async () => {
    const accounts = await sumo.web3.eth.getAccounts();
    sumo.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await sumo.testing.snapshot();
  });

  beforeEach(async () => {
    await sumo.testing.resetEVM("0x2");
  });

  describe("expected fail transfers", () => {
    test("cant transfer from a 0 balance", async () => {
      await sumo.testing.expectThrow(sumo.contracts.sumo.methods.transfer(user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
    });
    test("cant transferFrom without allowance", async () => {
      await sumo.testing.expectThrow(sumo.contracts.sumo.methods.transferFrom(user, new_user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
    });

  });

  describe("non-failing transfers", () => {
    test("transfer to self doesnt inflate", async () => {
      let bal0 = await sumo.contracts.sumo.methods.balanceOf(user).call();
      await sumo.contracts.sumo.methods.transfer(user, "100").send({from: user});
      let bal1 = await sumo.contracts.sumo.methods.balanceOf(user).call();
      expect(bal0).toBe(bal1);
    });
    test("transferFrom works", async () => {
      let bal00 = await sumo.contracts.sumo.methods.balanceOf(user).call();
      let bal01 = await sumo.contracts.sumo.methods.balanceOf(new_user).call();
      await sumo.contracts.sumo.methods.approve(new_user, "100").send({from: user});
      await sumo.contracts.sumo.methods.transferFrom(user, new_user, "100").send({from: new_user});
      let bal10 = await sumo.contracts.sumo.methods.balanceOf(user).call();
      let bal11 = await sumo.contracts.sumo.methods.balanceOf(new_user).call();
      expect((sumo.toBigN(bal01).plus(sumo.toBigN(100))).toString()).toBe(bal11);
      expect((sumo.toBigN(bal00).minus(sumo.toBigN(100))).toString()).toBe(bal10);
    });
    test("approve", async () => {
      await sumo.contracts.sumo.methods.approve(new_user, "100").send({from: user});
      let allowance = await sumo.contracts.sumo.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("increaseAllowance", async () => {
      await sumo.contracts.sumo.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await sumo.contracts.sumo.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("decreaseAllowance", async () => {
      await sumo.contracts.sumo.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await sumo.contracts.sumo.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
      await sumo.contracts.sumo.methods.decreaseAllowance(new_user, "100").send({from: user});
      allowance = await sumo.contracts.sumo.methods.allowance(user, new_user).call();
      expect(allowance).toBe("0")
    });
    test("decreaseAllowance from 0", async () => {
      await sumo.contracts.sumo.methods.decreaseAllowance(new_user, "100").send({from: user});
      let allowance = await sumo.contracts.sumo.methods.allowance(user, new_user).call();
      expect(allowance).toBe("0")
    });
  })

})
