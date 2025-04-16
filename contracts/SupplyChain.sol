// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Product {
        uint id;
        string name;
        string description;
        uint stage;
    }

    mapping(uint => Product) public products;
    uint public productCount = 0;

    event ProductCreated(uint id, string name, string description);
    event ProductUpdated(uint id, uint stage);

    function createProduct(string memory _name, string memory _description) public {
        productCount++;
        products[productCount] = Product(productCount, _name, _description, 0);
        emit ProductCreated(productCount, _name, _description);
    }

    function updateProductStage(uint _id, uint _stage) public {
        require(_id > 0 && _id <= productCount, "Product not found");
        require(_stage <= 5, "Invalid stage");
        products[_id].stage = _stage;
        emit ProductUpdated(_id, _stage);
    }

    function getProduct(uint _id) public view returns (uint, string memory, string memory, uint) {
        require(_id > 0 && _id <= productCount, "Product not found");
        Product memory p = products[_id];
        return (p.id, p.name, p.description, p.stage);
    }
}
