// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Product {
        uint id;
        uint weight;
        uint price;
        uint stage;
    }

    mapping(uint => Product) public products;
    uint[] public productIds; // 🆕 Array to store actual product IDs
    uint public productCount = 0;

    event ProductCreated(uint id, uint weight, uint price);
    event ProductUpdated(uint id, uint stage);

    function createProduct(uint _id, uint _weight, uint _price) public {
        require(products[_id].id == 0, "Product already exists");

        productCount++;
        products[_id] = Product(_id, _weight, _price, 0);
        productIds.push(_id); // 🆕 Track the ID
        emit ProductCreated(_id, _weight, _price);
    }

    function updateProductStage(uint _id, uint _stage) public {
        require(products[_id].id != 0, "Product not found");
        require(_stage <= 5, "Invalid stage");
        products[_id].stage = _stage;
        emit ProductUpdated(_id, _stage);
    }

    function getProduct(uint _id) public view returns (uint, uint, uint, uint) {
        require(products[_id].id != 0, "Product not found");
        Product memory p = products[_id];
        return (p.id, p.weight, p.price, p.stage);
    }

    // 🆕 Function to get all product IDs
    function getAllProductIds() public view returns (uint[] memory) {
        return productIds;
    }
}
