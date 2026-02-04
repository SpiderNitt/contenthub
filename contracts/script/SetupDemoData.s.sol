// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract SetupDemoData is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hubAddress = 0x422B25C12aEcDBDaf94Cb16836B9C3fc0519eB40; // Deployed address

        vm.startBroadcast(deployerPrivateKey);

        CreatorHub hub = CreatorHub(hubAddress);

        // 1. Register Channel (if not already)
        try hub.registerChannel("Demo Channel") {
            console.log("Channel 'Demo Channel' registered");
        } catch {
            console.log("Channel might already be registered");
        }

        // 2. Upload Sample Videos with REAL IPFS content
        // Using publicly available IPFS videos for demo
        // Video 1: Big Buck Bunny trailer
        hub.uploadVideo(
            "Big Buck Bunny - Open Movie",
            "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // Real video CID
            "QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq" // Real thumbnail CID
        );
        console.log("Uploaded Video 1");

        // Video 2: Sintel trailer
        hub.uploadVideo(
            "Sintel - Open Movie Trailer",
            "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE", // Real video CID
            "Qmd286K6pohQcTKYqnS1YhWMscYjDyr712CGXDnUxAwzjg" // Real thumbnail CID
        );
        console.log("Uploaded Video 2");

        vm.stopBroadcast();
    }
}
