// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IFtsoRegistry {
    function getFtsoBySymbol(string calldata _symbol) external view returns (address);
    function getSupportedSymbols() external view returns (string[] memory);
    function getCurrentPriceWithDecimals(
        string memory _symbol
    ) external view returns (uint256 _price, uint256 _timestamp, uint256 _assetPriceUsdDecimals);
}
