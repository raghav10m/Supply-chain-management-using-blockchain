const SupplyChain = artifacts.require("SupplyChain");

module.exports = function (deployer) {
  deployer.deploy(SupplyChain); // ✅ no parameters!
};
