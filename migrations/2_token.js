// ============ Contracts ============

// Token
// deployed first
const SUMOImplementation = artifacts.require("SUMODelegate");
const SUMOProxy = artifacts.require("SUMODelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(SUMOImplementation);
  if (network != "mainnet") {
    await deployer.deploy(SUMOProxy,
      "SUMO",
      "SUMO",
      18,
      "9000000000000000000000000", // print extra few mil for user
      SUMOImplementation.address,
      "0x"
    );
  } else {
    await deployer.deploy(SUMOProxy,
      "SUMO",
      "SUMO",
      18,
      "2000000000000000000000000",
      SUMOImplementation.address,
      "0x"
    );
  }

}
