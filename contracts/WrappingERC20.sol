// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@fhenixprotocol/contracts/access/Permissioned.sol";

import "@fhenixprotocol/contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappingERC20 is ERC20, Permissioned {
    mapping (address => euint32) internal _encBalances;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10 ** uint(decimals()));
    }
    function wrap(uint32 amount) public {
        require(balanceOf(msg.sender) >= amount);
        _burn(msg.sender, amount);
        euint32 shieldedAmount = FHE.asEuint32(amount);
        _encBalances[msg.sender] = _encBalances[msg.sender] + shieldedAmount;

    }
    function unwrap(inEuint32 memory amount) public{
        euint32 _amount = FHE.asEuint32(amount);
        FHE.req(_encBalances[msg.sender].gte(_amount));
        _encBalances[msg.sender] = _encBalances[msg.sender] - _amount;
        _mint(msg.sender, FHE.decrypt(_amount));

    }

    function transferEncrypted(address to, inEuint32 calldata encryptedAmount) public {
        euint32 amount = FHE.asEuint32(encryptedAmount);
        FHE.req(amount.lte(_encBalances[msg.sender]));
        _encBalances[to] = _encBalances[to] + amount;
        _encBalances[msg.sender] = _encBalances[msg.sender] - amount;
    }
    function getBalanceEncrypted(Permission calldata perm) public view onlySender(perm) returns (uint256) {
        return FHE.decrypt(_encBalances[msg.sender]);
    }

}