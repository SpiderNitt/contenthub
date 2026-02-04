//SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;
import "contracts/lib/forge-std/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/lib/forge-std/openzeppelin-contracts/contracts/interfaces/IERC20.sol";

contract CreatorHub {
    using SafeERC20 for IERC20;
    /*
     * Video Showcase & Creator Registry Logic
     */

    struct Video {
        string title;
        string videoCID;
        string thumbnailCID;
        address uploader;
        uint256 timestamp;
    }

    struct Creator {
        string name;
        address wallet;
        bool isRegistered;
        uint256 subscriptionPrice; // price in USDC (6 decimals)
        uint256 subscriberCount;
        uint256 totalEarnings;
    }
    //USDC token address- set in constructor
    IERC20 public immutable USDC;

    // Mapping from wallet to Creator
    mapping(address => Creator) public cret;
    // Mapping from Subscriber -> Creator -> Expiry Timestamp
    mapping(address => mapping(address => uint256)) public subscriptions;
    // Mapping from User -> ContentId -> Expiry Timestamp (Rentals)
    mapping(address => mapping(uint256 => uint256)) public rentals;

    // Array of all videos for showcase
    Video[] public allVideos;
    // Original CreatorHub Logic for Content management (simplified/integrated)
    enum ContentType {
        VIDEO,
        ARTICLE,
        PODCAST,
        AUDIO,
        NEWSLETTER,
        OTHER
    }

    struct Content {
        uint256 id;
        address creatorAddress;
        ContentType cType;
        string metadataURI;
        bool isFree;
        uint256 fullPrice;
        uint256 rentedPrice;
        address paymentToken;
        bool active;
    }

    uint256 public nextContentId;
    mapping(uint256 => Content) public contents;
    uint256[] public allContentIds;

    event ChannelRegistered(address indexed wallet, string name);
    event VideoUploaded(
        uint256 indexed videoId,
        address indexed uploader,
        string title
    );
    event ContentCreated(
        uint256 indexed contentId,
        address indexed creator,
        string metadataURI
    );
    event Subscribed(
        address indexed subscriber,
        address indexed creator,
        uint256 expiry
    );
    event ContentRented(
        address indexed renter,
        uint256 indexed contentId,
        uint256 expiry
    );
    event SubscriptionPriceUpdated(address indexed creator, uint256 newPrice);

    address[] public allCreators;

    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        USDC = IERC20(_usdc);
    }

    function registerChannel(string memory _name) external {
        require(bytes(_name).length > 0, "Name required");
        require(!cret[msg.sender].isRegistered, "Already registered");

        cret[msg.sender] = Creator({
            name: _name,
            wallet: msg.sender,
            isRegistered: true,
            subscriptionPrice: 5e6, // Default price 5 USDC
            subscriberCount: 0,
            totalEarnings: 0
        });

        allCreators.push(msg.sender);

        emit ChannelRegistered(msg.sender, _name);
    }

    function setSubscriptionPrice(uint256 _price) external {
        require(cret[msg.sender].isRegistered, "Not registered");
        cret[msg.sender].subscriptionPrice = _price;
        emit SubscriptionPriceUpdated(msg.sender, _price);
    }

    function subscribe(address _creator) external {
        require(cret[_creator].isRegistered, "Creator not registered");
        uint256 price = (cret[_creator].subscriptionPrice);
        require(price > 0, "subsription price must be Set");
        uint256 currentExpiry = subscriptions[msg.sender][_creator];
        uint256 newExpiry;

        if (currentExpiry > block.timestamp) {
            newExpiry = currentExpiry + 30 days;
        } else {
            newExpiry = block.timestamp + 30 days;
        }

        subscriptions[msg.sender][_creator] = newExpiry;

        // Transfer USDC FROM SUBSCRIBER TO CREATOR
        USDC.safeTransferFrom(msg.sender, _creator, price);

        // Update Stats
        cret[_creator].subscriberCount++;
        cret[_creator].totalEarnings += price;

        emit Subscribed(msg.sender, _creator, newExpiry);
    }

    function rentContent(uint256 _contentId) external {
        Content memory c = contents[_contentId];
        require(c.active, "Content not active");
        require(c.rentedPrice > 0, "Content not for rent");
        require(c.paymentToken== address(USDC),"ONLY USDC payments are accepted");

        uint256 newExpiry = block.timestamp + 24 hours;
        rentals[msg.sender][_contentId] = newExpiry;

        // Transfer funds from renter to the creator
        USDC.safeTransferFrom(msg.sender,c.creatorAddress,c.rentedPrice);

        // Update Stats (Optional: add content specific earnings later)
        cret[c.creatorAddress].totalEarnings += c.rentedPrice;

        emit ContentRented(msg.sender, _contentId, newExpiry);
    }

    function checkRental(
        address _user,
        uint256 _contentId
    ) external view returns (bool) {
        return rentals[_user][_contentId] > block.timestamp;
    }

    function checkSubscription(
        address _subscriber,
        address _creator
    ) external view returns (bool) {
        return subscriptions[_subscriber][_creator] > block.timestamp;
    }

    function getChannelName(
        address _wallet
    ) external view returns (string memory) {
        if (cret[_wallet].isRegistered) {
            return cret[_wallet].name;
        }
        return "Unknown Channel";
    }

    function getAllCreators() external view returns (Creator[] memory) {
        uint256 total = allCreators.length;
        Creator[] memory creatorsList = new Creator[](total);

        for (uint256 i = 0; i < total; i++) {
            creatorsList[i] = cret[allCreators[i]];
        }
        return creatorsList;
    }

    function uploadVideo(
        string memory _title,
        string memory _videoCID,
        string memory _thumbnailCID
    ) external {
        require(cret[msg.sender].isRegistered, "Must register channel first");

        Video memory newVideo = Video({
            title: _title,
            videoCID: _videoCID,
            thumbnailCID: _thumbnailCID,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        allVideos.push(newVideo);
        emit VideoUploaded(allVideos.length - 1, msg.sender, _title);
    }

    function getLatestVideos(
        uint256 _limit
    ) external view returns (Video[] memory) {
        uint256 totalVideos = allVideos.length;
        if (totalVideos == 0) {
            return new Video[](0);
        }

        uint256 count = _limit;
        if (count > totalVideos) {
            count = totalVideos;
        }

        Video[] memory recentVideos = new Video[](count);
        for (uint256 i = 0; i < count; i++) {
            recentVideos[i] = allVideos[totalVideos - 1 - i];
        }
        return recentVideos;
    }

    function getLatestContent(
        uint256 _limit
    ) external view returns (Content[] memory) {
        uint256 totalContent = allContentIds.length;
        if (totalContent == 0) {
            return new Content[](0);
        }

        uint256 count = _limit;
        if (count > totalContent) {
            count = totalContent;
        }

        Content[] memory recentContent = new Content[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 contentId = allContentIds[totalContent - 1 - i];
            recentContent[i] = contents[contentId];
        }
        return recentContent;
    }

    // Original Content Link Functionality
    function createContent(
        ContentType cType,
        string memory metadataURI,
        bool isFree,
        uint256 fullPrice,
        uint256 rentedPrice,
        address paymentToken
    ) external returns (uint256) {
        require(
            cret[msg.sender].isRegistered,
            "Only registered creators can create content"
        );
        require(bytes(metadataURI).length > 0, "Invalid metadataURI");

        if (isFree) {
            require(fullPrice == 0, "Free content fullPrice must be 0");
            require(rentedPrice == 0, "Free content rentedPrice must be 0");
        } else {
            require(paymentToken == address(USDC), "ONLY USDC payments accepted");
            require(rentedPrice > 0, "rentedPrice must be > 0");
            require(
                fullPrice >= rentedPrice,
                "fullPrice must be >= rentedPrice"
            );
        }

        uint256 contentId = nextContentId++;
        allContentIds.push(contentId);

        contents[contentId] = Content({
            id: contentId,
            creatorAddress: msg.sender,
            cType: cType,
            metadataURI: metadataURI,
            isFree: isFree,
            fullPrice: fullPrice,
            rentedPrice: rentedPrice,
            paymentToken: paymentToken,
            active: true
        });

        emit ContentCreated(contentId, msg.sender, metadataURI);
        return contentId;
    }

    function updateContent(
        uint256 contentId,
        ContentType cType,
        string memory metadataURI,
        uint256 fullPrice,
        uint256 rentedPrice,
        address paymentToken,
        bool isFree
    ) external {
        Content storage c = contents[contentId];
        require(c.creatorAddress != address(0), "Content does not exist");
        require(
            c.creatorAddress == msg.sender,
            "Only the content creator can update"
        );

        if (isFree) {
            require(fullPrice == 0, "Free content fullPrice must be 0");
            require(rentedPrice == 0, "Free content rentedPrice must be 0");
        } else {
            require(paymentToken == address(USDC), "only USDC Payments token required");
            require(rentedPrice > 0, "rentedPrice must be > 0");
            require(
                fullPrice >= rentedPrice,
                "fullPrice must be >= rentedPrice"
            );
        }
        c.cType = cType;
        c.metadataURI = metadataURI;
        c.isFree = isFree;
        c.fullPrice = fullPrice;
        c.rentedPrice = rentedPrice;
        c.paymentToken = paymentToken;
    }

    function setContentActive(uint256 contentId, bool status) external {
        Content storage c = contents[contentId];
        require(c.creatorAddress != address(0), "Content does not exist");
        require(
            c.creatorAddress == msg.sender,
            "Only the content creator can update its status"
        );

        c.active = status;
    }
}
