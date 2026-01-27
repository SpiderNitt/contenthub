// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract DeployHub is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        CreatorHub hub = new CreatorHub();
        console.log("CreatorHub deployed to:", address(hub));

        vm.stopBroadcast();
    }
}
