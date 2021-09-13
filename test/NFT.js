import { BN } from 'web3-utils'
import ether from './helpers/ether'
import EVMRevert from './helpers/EVMRevert'
import { toWei, fromWei } from 'web3-utils'

const BigNumber = BN

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const NFT = artifacts.require('./NFT.sol')
const vampsSupply = 10

let nft,
    platformAddress


contract('NFT', function([userOne, userTwo, userThree]) {

  async function deployContracts(){
    // deploy contracts
    nft = await NFT.new(vampsSupply, userOne)
    platformAddress = userOne
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('Create NFT', function() {
    it('Only owner can create new vamp until a certain limit', async function() {
      assert.equal(await nft.totalSupply(), 0)
      await nft.createNewFor(userOne)
      assert.equal(await nft.totalSupply(), 1)
    })

    it('Nobody can create new vamp after a certain limit', async function() {
      assert.equal(await nft.totalSupply(), 0)

      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      assert.equal(await nft.totalSupply(), vampsSupply)

      await nft.createNewFor(userOne).should.be.rejectedWith(EVMRevert)
    })
  })

  describe('Offer and Buy NFT', function() {
    it('Owner can not offer vamp until all vampires are created', async function() {
      await nft.createNewFor(userOne)
      await nft.offerForSale(0, toWei("0.00001"))
      .should.be.rejectedWith(EVMRevert)
    })

    it('Owner can offer vamp after all vampires are created', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      await nft.offerForSale(0, toWei("0.00001"))
    })

    it('Not owner can NOT offer vamp after all vampires are created', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      await nft.offerForSale(0, toWei("0.00001"), { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
    })

    it('User can not buy with less than min eth require', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      await nft.offerForSale(0, toWei("1"))
      await nft.buy(0, { from:userTwo, value:toWei("0.00001") })
      .should.be.rejectedWith(EVMRevert)

      assert.equal(await nft.ownerOf(0), userOne)
    })

    it('User can buy with min eth require', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      assert.equal(await nft.ownerOf(0), userOne)

      await nft.offerForSale(0, toWei("1"))
      await nft.buy(0, { from:userTwo, value:toWei("1") })

      assert.equal(await nft.ownerOf(0), userTwo)
    })

    it('User A can not buy with min eth require, if owner offer for user B', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userOne)
      }

      assert.equal(await nft.ownerOf(0), userOne)

      await nft.offerForSaleToAddress(0, toWei("1"), userThree)
      await nft.buy(0, { from:userTwo, value:toWei("1") })
      .should.be.rejectedWith(EVMRevert)

      await nft.buy(0, { from:userThree, value:toWei("1") })

      assert.equal(await nft.ownerOf(0), userThree)
    })


    it('Saller address and platform address receive ETH from sell', async function() {

      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userThree, { from:userOne })
      }

      const platformBalanceBefore = await web3.eth.getBalance(platformAddress)
      const sallerBalanceBefore = await web3.eth.getBalance(userThree)

      await nft.offerForSale(0, toWei("1"), { from:userThree })
      await nft.buy(0, { from:userTwo, value:toWei("1") })

      assert.isTrue(
        await web3.eth.getBalance(platformAddress) > platformBalanceBefore
      )

      assert.isTrue(
        await web3.eth.getBalance(userThree) > sallerBalanceBefore
      )

      console.log(
        "Sale amount 1 ETH",
        "platform received : ",
        fromWei(String(await web3.eth.getBalance(platformAddress) - platformBalanceBefore)),
        "saller received : ",
        fromWei(String(await web3.eth.getBalance(userThree) - sallerBalanceBefore)),
        "nft eth balance should be 0 and it's : ",
        fromWei(String(await web3.eth.getBalance(nft.address)))
      )
    })

    it('User can not buy the same vampire twice', async function() {
      for(let i = 0; i<vampsSupply; i++){
        await nft.createNewFor(userThree, { from:userOne })
      }

      const platformBalanceBefore = await web3.eth.getBalance(platformAddress)
      const sallerBalanceBefore = await web3.eth.getBalance(userThree)

      await nft.offerForSale(0, toWei("1"), { from:userThree })
      await nft.buy(0, { from:userTwo, value:toWei("1") })
      await nft.buy(0, { from:userTwo, value:toWei("1") })
      .should.be.rejectedWith(EVMRevert)
    })
  })
  //END
})
