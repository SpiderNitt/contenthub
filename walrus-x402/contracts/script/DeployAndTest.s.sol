// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract DeployAndTest is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying with address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy
        CreatorHub hub = new CreatorHub();
        console.log("CreatorHub deployed at:", address(hub));

        // 2. Register a test channel (so the array is not empty)
        hub.registerChannel("Genesis Creator");
        console.log("Registered 'Genesis Creator'");

        vm.stopBroadcast();
    }
}
