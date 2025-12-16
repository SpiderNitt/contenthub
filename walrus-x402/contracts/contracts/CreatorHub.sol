// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CreatorHub {
    struct Content {
        bytes32 contentId;
        address creator;
        string walrusUri;
        uint8 minTier;
    }

    struct Plan {
        uint8 tierId;
        uint256 price;
        uint32 period;
        bool active;
    }

    event ContentRegistered(bytes32 indexed contentId, address indexed creator, uint8 minTier);
    event PlanUpdated(address indexed creator, uint8 tierId, uint256 price, uint32 period);

    // Mappings
    // creator -> tierId -> Plan
    mapping(address => mapping(uint8 => Plan)) public plans;
    // contentId -> Content
    mapping(bytes32 => Content) public contentRegistry;

    // Register content with a Walrus BlobStore ID (URI) and minimum subscription tier required
    function registerContent(string memory _walrusUri, uint8 _minTier) external {
        bytes32 contentId = keccak256(abi.encodePacked(msg.sender, _walrusUri, block.timestamp));
        
        contentRegistry[contentId] = Content({
            contentId: contentId,
            creator: msg.sender,
            walrusUri: _walrusUri,
            minTier: _minTier
        });

        emit ContentRegistered(contentId, msg.sender, _minTier);
    }

    // Set or update a subscription plan
    // Tier IDs: 1=Basic, 2=Premium (0 is usually free/public)
    function setPlan(uint8 _tierId, uint256 _price, uint32 _period) external {
        require(_tierId > 0, "Tier 0 is free");
        plans[msg.sender][_tierId] = Plan({
            tierId: _tierId,
            price: _price,
            period: _period,
            active: true
        });

        emit PlanUpdated(msg.sender, _tierId, _price, _period);
    }

    function getPrice(address _creator, uint8 _tierId) external view returns (uint256) {
        return plans[_creator][_tierId].price;
    }

    // Explicitly expose plan details if needed
    function getPlan(address _creator, uint8 _tierId) external view returns (Plan memory) {
        return plans[_creator][_tierId];
    }
}
