// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 _initSupply) public ERC20("COT", "COT") {
        _mint(msg.sender, _initSupply);
    }
}
