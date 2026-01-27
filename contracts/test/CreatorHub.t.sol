// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract CreatorHubTest is Test {
    CreatorHub public hub;
    address public creator1 = address(0x1);
    address public creator2 = address(0x2);
    address public viewer = address(0x3);

    function setUp() public {
        hub = new CreatorHub();
        vm.deal(creator1, 100 ether);
        vm.deal(creator2, 100 ether);
        vm.deal(viewer, 100 ether);
    }

    function test_RegisterChannel() public {
        string memory channelName = "Test Channel";
        
        vm.startPrank(creator1);
        hub.registerChannel(channelName);
        
        string memory fetchedName = hub.getChannelName(creator1);
        assertEq(fetchedName, channelName);
        vm.stopPrank();
    }

    function test_RegisterChannel_RevertIfAlreadyRegistered() public {
        vm.startPrank(creator1);
        hub.registerChannel("Channel 1");
        
        vm.expectRevert("Already registered");
        hub.registerChannel("Channel 1 New");
        vm.stopPrank();
    }

    function test_UploadVideo() public {
        vm.startPrank(creator1);
        hub.registerChannel("Creator 1");
        
        hub.uploadVideo("My First Video", "QmVideo1", "QmThumb1");
        
        CreatorHub.Video[] memory videos = hub.getLatestVideos(10);
        assertEq(videos.length, 1);
        assertEq(videos[0].title, "My First Video");
        assertEq(videos[0].videoCID, "QmVideo1");
        assertEq(videos[0].uploader, creator1);
        vm.stopPrank();
    }

    function test_UploadVideo_RevertIfNotRegistered() public {
        vm.startPrank(creator1); // Not registered
        
        vm.expectRevert("Must register channel first");
        hub.uploadVideo("Fail Video", "QmFail", "QmThumbFail");
        vm.stopPrank();
    }

    function test_GetChannelName_Unknown() public view {
        string memory name = hub.getChannelName(address(0x999));
        assertEq(name, "Unknown Channel");
    }

    function test_GetLatestVideos_Limit() public {
        vm.startPrank(creator1);
        hub.registerChannel("C1");
        
        // Upload 3 videos
        hub.uploadVideo("V1", "C1", "T1");
        hub.uploadVideo("V2", "C2", "T2");
        hub.uploadVideo("V3", "C3", "T3");
        vm.stopPrank();

        // Fetch limit 2
        CreatorHub.Video[] memory videos = hub.getLatestVideos(2);
        assertEq(videos.length, 2);
        // Should be latest first (V3, then V2)
        assertEq(videos[0].title, "V3");
        assertEq(videos[1].title, "V2");
    }
}
