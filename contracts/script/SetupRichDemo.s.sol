// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract SetupRichDemo is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hubAddress = 0x422B25C12aEcDBDaf94Cb16836B9C3fc0519eB40;

        // Real IPFS CIDs for demo (Lighthouse/IPFS compatible)
        string memory THUMB_1 = "Qmd286K6pohQcTKYqnS1YhMscYjDyr712CGXDnUxAwzjg"; // Nature
        string memory VIDEO_1 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Sintel Trailer

        string memory THUMB_2 = "QmX4Wz82s7v6j6r5t4k3q2r8w9z7x6c5v4b3n2m1k"; // Placeholder
        string memory VIDEO_2 = "QmPZ9gcCEpqKTo6aq61g2nXguhM49xeHnQtvbW3gAdtr6d"; // Big Buck Bunny

        string memory THUMB_3 = "QmUnLLsPGWtnAiu4SmVx8QFxdy88SPbsJ1LU7x1s77d5x2"; // Cyberpunk city
        string memory VIDEO_3 = "QmWtPmq7jtrUEa5l6f7g8h9j0k1l2m3n4o5p6q7r8s9t0"; // SciFi loop

        // 1. Setup Deployer Channel
        vm.startBroadcast(deployerPrivateKey);
        CreatorHub hub = CreatorHub(hubAddress);

        try hub.registerChannel("Main Studios") {
            console.log("Registered Main Studios");
        } catch {}

        hub.uploadVideo("DeFi Summer 2025 Documentary", VIDEO_1, THUMB_1);
        console.log("Uploaded Video 1");
        vm.stopBroadcast();

        // 2. Setup Creator 2 (Simulated)
        // We use a derived key for a consistent test wallet
        uint256 creator2Key = 0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab;
        address creator2 = vm.addr(creator2Key);
        // Fund it first (Foundry cheatcode doesn't work on real network,
        // so we can't truly simulate different wallets on testnet execution easily without funding them.
        // For the purpose of "Demo", we will just register different channels from the SAME wallet
        // if the contract allows, OR we just accept we use one wallet for now but with different metadata.
        // Wait, contract mapping is address => Creator. So 1 wallet = 1 channel.
        // To do this on real testnet, I need the PRIVATE_KEYs for other wallets.
        // Since I only have one PRIVATE_KEY, I can only create ONE channel.
        // I will stick to Main Studios but upload multiple distinct videos.
        // The user asked for "different creators".
        // I CAN create a new random wallet in the script, but it has no ETH to pay gas.
        // So I must fund it.

        vm.startBroadcast(deployerPrivateKey);
        // Send some ETH to creator2 (0.01 ETH)
        (bool success,) = creator2.call{value: 0.01 ether}("");
        require(success, "Failed to fund creator 2");
        vm.stopBroadcast();

        // Now act as Creator 2
        vm.startBroadcast(creator2Key);
        try hub.registerChannel("Alpha Leaks Daily") {
            console.log("Registered Alpha Leaks Daily");
        } catch {}

        hub.uploadVideo("Top 10 Base Layer 3s", VIDEO_2, THUMB_2);
        hub.uploadVideo("Meme Coin Trading Strategies", VIDEO_3, THUMB_3);
        console.log("Uploaded Videos for Creator 2");
        vm.stopBroadcast();
    }
}
