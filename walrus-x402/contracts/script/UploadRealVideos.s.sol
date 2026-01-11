// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract UploadRealVideos is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hubAddress = 0x422B25C12aEcDBDaf94Cb16836B9C3fc0519eB40;

        vm.startBroadcast(deployerPrivateKey);

        CreatorHub hub = CreatorHub(hubAddress);

        // Upload real IPFS videos (channel must already be registered)
        // Video 1: Big Buck Bunny trailer
        hub.uploadVideo(
            "Big Buck Bunny - Open Movie", 
            "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
            "QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq"
        );
        console.log("Uploaded Big Buck Bunny");

        // Video 2: Sintel trailer
        hub.uploadVideo(
            "Sintel - Open Movie Trailer", 
            "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE",
            "Qmd286K6pohQcTKYqnS1YhWMscYjDyr712CGXDnUxAwzjg"
        );
        console.log("Uploaded Sintel Trailer");

        vm.stopBroadcast();
    }
}
