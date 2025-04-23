// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Product {
        uint id;
        uint weight;
        uint price;
        uint stage;
    }

    mapping(uint => Product) public products; // Stores product details
    mapping(address => uint[]) public purchasedProducts; // Tracks purchased products by each address
    uint[] public productIds; // Array to store product IDs for easy retrieval
    uint public productCount = 0;

    event ProductCreated(uint id, uint weight, uint price);
    event ProductUpdated(uint id, uint stage);
    event ProductPurchased(uint id, address buyer); // Event for product purchase

    // Function to create a new product
    function createProduct(uint _id, uint _weight, uint _price) public {
        require(products[_id].id == 0, "Product already exists");

        productCount++;
        products[_id] = Product(_id, _weight, _price, 0); // Default stage is 0 (manufactured)
        productIds.push(_id); // Add the ID to the array
        emit ProductCreated(_id, _weight, _price);
    }

    // Function to update the product stage (e.g., from manufactured to shipped)
    function updateProductStage(uint _id, uint _stage) public {
        require(products[_id].id != 0, "Product not found");
        require(_stage <= 5, "Invalid stage");
        products[_id].stage = _stage;
        emit ProductUpdated(_id, _stage);
    }

    // Function to purchase a product
    function purchaseProduct(uint _id) public payable {
        Product storage product = products[_id];

        // Check if the product exists and is available for purchase (stage must be less than 3)
        require(product.id != 0, "Product does not exist");
        require(product.stage < 3, "Product has already been purchased or is not available for purchase");
        require(msg.value == product.price, "Incorrect price sent");

        // Mark the product as purchased (stage = 3)
        product.stage = 3;

        // Store the product in the purchasedProducts mapping for the sender
        purchasedProducts[msg.sender].push(_id);

        // Emit an event to signal the purchase
        emit ProductPurchased(_id, msg.sender);
    }

    // Function to get all product IDs purchased by the sender
    function getPurchasedProductIds() public view returns (uint[] memory) {
        return purchasedProducts[msg.sender];
    }

    // Function to get all product IDs (for displaying all products)
    function getAllProductIds() public view returns (uint[] memory) {
        return productIds;
    }

    // Function to get product details
    function getProduct(uint _id) public view returns (uint, uint, uint, uint) {
        require(products[_id].id != 0, "Product not found");
        Product memory p = products[_id];
        return (p.id, p.weight, p.price, p.stage);
    }
    // Function to accept shipment (moves product to "Shipped" stage)
    function acceptShipment(uint _id) public {
        require(products[_id].id != 0, "Product not found");
        require(products[_id].stage == 3, "Product must be purchased first");

        products[_id].stage = 1; // Update to "Shipped"
        emit ProductUpdated(_id, 1);
    }

}