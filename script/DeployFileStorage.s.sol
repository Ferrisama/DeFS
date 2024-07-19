// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Contract.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract DeployFileStorage is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation
        FileStorage fileStorage = new FileStorage();

        // Deploy ProxyAdmin with the deployer as the owner
        ProxyAdmin proxyAdmin = new ProxyAdmin(deployer);

        // Encode initialization call
        bytes memory data = abi.encodeWithSelector(FileStorage.initialize.selector, deployer);

        // Deploy TransparentUpgradeableProxy
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            address(fileStorage),
            address(proxyAdmin),
            data
        );

        vm.stopBroadcast();

        console.log("FileStorage implementation deployed to:", address(fileStorage));
        console.log("ProxyAdmin deployed to:", address(proxyAdmin));
        console.log("TransparentUpgradeableProxy deployed to:", address(proxy));
    }
}