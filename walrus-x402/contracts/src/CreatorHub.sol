//SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

contract CreatorHub {
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
        uint256 subscriptionPrice; // Monthly price in WEI (native ETH for now)
        uint256 subscriberCount;
        uint256 totalEarnings;
    }

    // Mapping from wallet to Creator
    mapping(address => Creator) public cret;
    // Mapping from Subscriber -> Creator -> Expiry Timestamp
    mapping(address => mapping(address => uint256)) public subscriptions;
    
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
    event VideoUploaded(uint256 indexed videoId, address indexed uploader, string title);
    event ContentCreated(uint256 indexed contentId, address indexed creator, string metadataURI);
    event Subscribed(address indexed subscriber, address indexed creator, uint256 expiry);
    event SubscriptionPriceUpdated(address indexed creator, uint256 newPrice);

    address[] public allCreators;

    function registerChannel(string memory _name) external {
        require(bytes(_name).length > 0, "Name required");
        require(!cret[msg.sender].isRegistered, "Already registered");
        
        cret[msg.sender] = Creator({
            name: _name,
            wallet: msg.sender,
            isRegistered: true,
            subscriptionPrice: 0.001 ether, // Default price
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

    function subscribe(address _creator) external payable {
        require(cret[_creator].isRegistered, "Creator not registered");
        require(msg.value >= cret[_creator].subscriptionPrice, "Insufficient payment");

        uint256 currentExpiry = subscriptions[msg.sender][_creator];
        uint256 newExpiry;

        if (currentExpiry > block.timestamp) {
            newExpiry = currentExpiry + 30 days;
        } else {
            newExpiry = block.timestamp + 30 days;
        }

        subscriptions[msg.sender][_creator] = newExpiry;
        
        // Transfer funds to creator
        (bool sent, ) = payable(_creator).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        // Update Stats
        cret[_creator].subscriberCount++;
        cret[_creator].totalEarnings += msg.value;

        emit Subscribed(msg.sender, _creator, newExpiry);
    }

    function checkSubscription(address _subscriber, address _creator) external view returns (bool) {
        return subscriptions[_subscriber][_creator] > block.timestamp;
    }

    function getChannelName(address _wallet) external view returns (string memory) {
        if (cret[_wallet].isRegistered) {
            return cret[_wallet].name;
        }
        return "Unknown Channel";
    }

    function getAllCreators() external view returns (Creator[] memory) {
        uint256 total = allCreators.length;
        Creator[] memory creatorsList = new Creator[](total);
        
        for(uint256 i = 0; i < total; i++) {
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

    function getLatestVideos(uint256 _limit) external view returns (Video[] memory) {
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

    function getLatestContent(uint256 _limit) external view returns (Content[] memory) {
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
        require(cret[msg.sender].isRegistered, "Only registered creators can create content");
        require(bytes(metadataURI).length > 0, "Invalid metadataURI");
        
        if (isFree) {
            require(fullPrice == 0, "Free content fullPrice must be 0");
            require(rentedPrice == 0, "Free content rentedPrice must be 0");
        } else {
            require(paymentToken != address(0), "Payment token required");
            require(rentedPrice > 0, "rentedPrice must be > 0");
            require(fullPrice >= rentedPrice, "fullPrice must be >= rentedPrice");
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
        require(c.creatorAddress == msg.sender, "Only the content creator can update");
        
        if (isFree) {
            require(fullPrice == 0, "Free content fullPrice must be 0");
            require(rentedPrice == 0, "Free content rentedPrice must be 0");
        } else {
            require(paymentToken != address(0), "Payment token required");
            require(rentedPrice > 0, "rentedPrice must be > 0");
            require(fullPrice >= rentedPrice, "fullPrice must be >= rentedPrice");
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
        require(c.creatorAddress == msg.sender, "Only the content creator can update its status");

        c.active = status;
    }
}
