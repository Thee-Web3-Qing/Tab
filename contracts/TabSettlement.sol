// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @notice Atomic USDC settlement splitter for Tab.
/// @dev The fee wallet and 0.5% fee are immutable. There are no owner/admin withdrawal functions.
contract TabSettlement {
    IERC20 public immutable usdc;
    address public immutable feeWallet;
    uint256 public constant FEE_BPS = 50;
    uint256 public constant BPS = 10_000;

    event BatchSettled(
        address indexed payer,
        uint256 totalSettlement,
        uint256 tabFee,
        uint256 recipientCount
    );

    constructor(address usdc_, address feeWallet_) {
        require(usdc_ != address(0), "USDC_ZERO");
        require(feeWallet_ != address(0), "FEE_WALLET_ZERO");
        usdc = IERC20(usdc_);
        feeWallet = feeWallet_;
    }

    function settle(address[] calldata recipients, uint256[] calldata amounts) external {
        uint256 length = recipients.length;
        require(length > 0 && length == amounts.length, "BAD_BATCH");

        uint256 total;
        for (uint256 i; i < length; ++i) {
            require(recipients[i] != address(0), "RECIPIENT_ZERO");
            require(amounts[i] > 0, "AMOUNT_ZERO");
            total += amounts[i];
        }

        // Round the fee up to the nearest USDC base unit so Tab never under-collects the 0.5%.
        uint256 fee = (total * FEE_BPS + BPS - 1) / BPS;

        for (uint256 i; i < length; ++i) {
            require(usdc.transferFrom(msg.sender, recipients[i], amounts[i]), "SETTLEMENT_TRANSFER_FAILED");
        }
        require(usdc.transferFrom(msg.sender, feeWallet, fee), "FEE_TRANSFER_FAILED");

        emit BatchSettled(msg.sender, total, fee, length);
    }
}
