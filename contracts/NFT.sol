pragma solidity 0.6.12;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract NFT is ERC721, Ownable {
  using SafeMath for uint256;

  uint256 public tokenCounter;
  bool public allNFTsAssigned;
  uint256 maxNFTsSupply;
  address public platformAddress;

  struct Offer {
    bool isForSale;
    uint NFTIndex;
    address seller;
    uint minValue;          // in ether
    address onlySellTo;     // specify to sell only to a specific person
  }

  // A record of NFTs that are offered for sale at a specific minimum value, and perhaps to a specific person
  mapping (uint => Offer) public NFTsOfferedForSale;

  event NFTOffered(uint indexed NFTIndex, uint minValue, address indexed toAddress);
  event NFTBought(uint indexed NFTIndex, uint value, address indexed fromAddress, address indexed toAddress);
  event NFTNoLongerForSale(uint indexed NFTIndex);

  constructor (uint256 _maxNFTsSupply, address _platformAddress)
    public
    ERC721 ("NFT", "NFT")
  {
    maxNFTsSupply = _maxNFTsSupply;
    platformAddress = _platformAddress;
  }

  // owner can create new nft
  function createNewFor(address _for)
    external
    onlyOwner
    returns (uint256)
  {
    require(!allNFTsAssigned, "All NFTs assigned");
    // create new vimpire token
    uint256 newItemId = tokenCounter;
    _safeMint(_for, newItemId);

    // update counter
    tokenCounter = tokenCounter + 1;

    if(tokenCounter >= maxNFTsSupply)
      allNFTsAssigned = true;

    return newItemId;
  }

  // offer NFT for all users
  function offerForSale(
    uint NFTIndex,
    uint minSalePriceInWei
  )
    external
  {
    require(allNFTsAssigned, "Not all NFTs assigned");
    require(ownerOf(NFTIndex) == msg.sender, "Not owner");
    require(NFTIndex <= maxNFTsSupply, "Wrong index");

    NFTsOfferedForSale[NFTIndex] = Offer(true, NFTIndex, msg.sender, minSalePriceInWei, address(0));
    emit NFTOffered(NFTIndex, minSalePriceInWei, address(0));
  }

  // offer NFT for a certain user
  function offerForSaleToAddress(
    uint NFTIndex,
    uint minSalePriceInWei,
    address toAddress
  )
    external
  {
    require(allNFTsAssigned, "Not all NFTs assigned");
    require(ownerOf(NFTIndex) == msg.sender, "Not owner");
    require(NFTIndex <= maxNFTsSupply, "Wrong index");

    NFTsOfferedForSale[NFTIndex] = Offer(true, NFTIndex, msg.sender, minSalePriceInWei, toAddress);
    emit NFTOffered(NFTIndex, minSalePriceInWei, toAddress);
  }

  // buy NFT by index
  function buy(uint NFTIndex) external payable {
    require(allNFTsAssigned, "Not all NFTs assigned");
    require(NFTIndex <= maxNFTsSupply, "Wrong index");

    Offer memory offer = NFTsOfferedForSale[NFTIndex];
    require(offer.isForSale, "Not for sale"); // NFT not actually for sale

    if (offer.onlySellTo != address(0))
     require(offer.onlySellTo == msg.sender, "Wrong sale to");  // NFT not supposed to be sold to this user

    require(msg.value >= offer.minValue, "Wrong ETH amount");
    require(ownerOf(NFTIndex) == offer.seller, "Saller is not owner");


    address seller = offer.seller;

    // transfer token
    _transfer(seller, msg.sender, NFTIndex);

    // calculate transfer eth to seller and platform
    uint256 totalReceivedETH = msg.value;
    uint256 platformCommision = totalReceivedETH.div(100).mul(10);
    uint256 sellerAmount = totalReceivedETH.sub(platformCommision);

    // transfer ETH
    payable(seller).transfer(sellerAmount);
    payable(platformAddress).transfer(platformCommision);

    noLongerForSale(NFTIndex);

    emit NFTBought(NFTIndex, msg.value, seller, msg.sender);
  }

  // transfer to another address 
  function transfer(address _to, uint256 _tokenId) external {
    _transfer(msg.sender, _to, _tokenId);
  }

  // helper for finish sale for a certain NFT
  function noLongerForSale(uint NFTIndex) private {
    NFTsOfferedForSale[NFTIndex] = Offer(false, NFTIndex, msg.sender, 0, address(0));
    NFTNoLongerForSale(NFTIndex);
  }
}
