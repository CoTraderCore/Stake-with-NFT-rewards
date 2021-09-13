interface INFT {
  function allNFTsAssigned() external returns(bool);
  function createNewFor(address _for) external returns (uint256);
}
