// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");
        require(balanceOf[from] >= amount, "insufficient balance");

        allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract CreatorHubTest is Test {
    CreatorHub public hub;
    MockUSDC public usdc;
    address public creator1 = address(0x1);
    address public creator2 = address(0x2);
    address public viewer = address(0x3);
    uint256 internal constant SUB_PRICE = 1_000_000;
    uint256 internal constant FULL_PRICE = 5_000_000;
    uint256 internal constant RENT_PRICE = 1_000_000;

    function setUp() public {
        usdc = new MockUSDC();
        hub = new CreatorHub(address(usdc));

        usdc.mint(creator1, 1_000_000_000);
        usdc.mint(creator2, 1_000_000_000);
        usdc.mint(viewer, 1_000_000_000);

        vm.prank(viewer);
        usdc.approve(address(hub), type(uint256).max);
        vm.prank(creator1);
        usdc.approve(address(hub), type(uint256).max);
        vm.prank(creator2);
        usdc.approve(address(hub), type(uint256).max);
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

    function test_Subscribe_SuccessWithCorrectPayment() public {
        _registerCreator(creator1, "Creator 1");

        uint256 creatorBalanceBefore = usdc.balanceOf(creator1);
        vm.prank(viewer);
        hub.subscribe(creator1);

        assertTrue(hub.checkSubscription(viewer, creator1));
        (, , , , uint256 subscriberCount, uint256 totalEarnings) = hub.creators(creator1);
        assertEq(subscriberCount, 1);
        assertEq(totalEarnings, SUB_PRICE);
        assertEq(usdc.balanceOf(creator1), creatorBalanceBefore + SUB_PRICE);
    }

    function test_Subscribe_RevertIfInsufficientPayment() public {
        _registerCreator(creator1, "Creator 1");

        vm.startPrank(viewer);
        usdc.approve(address(hub), SUB_PRICE - 1);
        vm.expectRevert("insufficient allowance");
        hub.subscribe(creator1);
        vm.stopPrank();

        vm.prank(viewer);
        usdc.approve(address(hub), type(uint256).max);
    }

    function test_Subscribe_RenewalExtendsExpiryBy30Days() public {
        _registerCreator(creator1, "Creator 1");

        vm.prank(viewer);
        hub.subscribe(creator1);
        uint256 firstExpiry = hub.subscriptions(viewer, creator1);

        vm.warp(block.timestamp + 1 days);
        vm.prank(viewer);
        hub.subscribe(creator1);
        uint256 secondExpiry = hub.subscriptions(viewer, creator1);

        assertEq(secondExpiry, firstExpiry + 30 days);
    }

    function test_Subscribe_RenewalDoesNotIncrementSubscriberCount() public {
        _registerCreator(creator1, "Creator 1");

        vm.prank(viewer);
        hub.subscribe(creator1);
        (, , , , uint256 subscriberCountAfterFirst, ) = hub.creators(creator1);
        assertEq(subscriberCountAfterFirst, 1);

        vm.warp(block.timestamp + 1 days);
        vm.prank(viewer);
        hub.subscribe(creator1);

        (, , , , uint256 subscriberCountAfterRenewal, uint256 totalEarnings) = hub.creators(creator1);
        assertEq(subscriberCountAfterRenewal, 1);
        assertEq(totalEarnings, SUB_PRICE * 2);
    }

    function test_RentContent_Success() public {
        uint256 contentId = _createPaidContent(creator1);

        uint256 creatorBalanceBefore = usdc.balanceOf(creator1);
        vm.prank(viewer);
        hub.rentContent(contentId);

        assertTrue(hub.checkRental(viewer, contentId));
        uint256 expiry = hub.rentals(viewer, contentId);
        assertEq(expiry, block.timestamp + 24 hours);

        (, , , , , uint256 totalEarnings) = hub.creators(creator1);
        assertEq(totalEarnings, RENT_PRICE);
        assertEq(usdc.balanceOf(creator1), creatorBalanceBefore + RENT_PRICE);
    }

    function test_RentContent_RevertIfInactive() public {
        uint256 contentId = _createPaidContent(creator1);

        vm.prank(creator1);
        hub.setContentActive(contentId, false);

        vm.prank(viewer);
        vm.expectRevert("Content not active");
        hub.rentContent(contentId);
    }

    function test_BuyContent_Success() public {
        uint256 contentId = _createPaidContent(creator1);

        uint256 creatorBalanceBefore = usdc.balanceOf(creator1);
        vm.prank(viewer);
        hub.buyContent(contentId);

        assertTrue(hub.purchases(viewer, contentId));
        assertTrue(hub.checkPurchase(viewer, contentId));

        (, , , , , uint256 totalEarnings) = hub.creators(creator1);
        assertEq(totalEarnings, FULL_PRICE);
        assertEq(usdc.balanceOf(creator1), creatorBalanceBefore + FULL_PRICE);
    }

    function test_BuyContent_RevertIfAlreadyPurchased() public {
        uint256 contentId = _createPaidContent(creator1);

        vm.prank(viewer);
        hub.buyContent(contentId);

        vm.prank(viewer);
        vm.expectRevert("Already purchased");
        hub.buyContent(contentId);
    }

    function test_BuyContent_RevertIfInsufficientPayment() public {
        uint256 contentId = _createPaidContent(creator1);

        vm.prank(viewer);
        usdc.approve(address(hub), FULL_PRICE - 1);
        vm.prank(viewer);
        vm.expectRevert("insufficient allowance");
        hub.buyContent(contentId);

        vm.prank(viewer);
        usdc.approve(address(hub), type(uint256).max);
    }

    function test_BuyContent_RevertIfInactive() public {
        uint256 contentId = _createPaidContent(creator1);

        vm.prank(creator1);
        hub.setContentActive(contentId, false);

        vm.prank(viewer);
        vm.expectRevert("Content not active");
        hub.buyContent(contentId);
    }

    function test_CreateContent_RevertIfNonZeroPaymentTokenForPaidContent() public {
        _registerCreator(creator1, "Creator 1");

        vm.prank(creator1);
        vm.expectRevert("Unsupported payment token");
        hub.createContent(
            CreatorHub.ContentType.VIDEO,
            "ipfs://paid-content",
            false,
            FULL_PRICE,
            RENT_PRICE,
            address(0xBEEF)
        );
    }

    function test_CheckPurchase_ReturnsTrueAfterBuy() public {
        uint256 contentId = _createPaidContent(creator1);

        assertFalse(hub.checkPurchase(viewer, contentId));

        vm.prank(viewer);
        hub.buyContent(contentId);

        assertTrue(hub.checkPurchase(viewer, contentId));
    }

    function _registerCreator(address creator, string memory name) internal {
        vm.prank(creator);
        hub.registerChannel(name);
    }

    function _createPaidContent(address creator) internal returns (uint256) {
        _registerCreator(creator, "Paid Creator");

        vm.prank(creator);
        return hub.createContent(
            CreatorHub.ContentType.VIDEO,
            "ipfs://paid-content",
            false,
            FULL_PRICE,
            RENT_PRICE,
            address(usdc)
        );
    }
}
