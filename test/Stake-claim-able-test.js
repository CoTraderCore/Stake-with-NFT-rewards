import { BN, fromWei, toWei } from 'web3-utils'
import ether from './helpers/ether'
import EVMRevert from './helpers/EVMRevert'
import { duration } from './helpers/duration'
import { PairHash } from '../config'


const BigNumber = BN
const timeMachine = require('ganache-time-traveler')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// real contracts
const UniswapV2Factory = artifacts.require('./UniswapV2Factory.sol')
const UniswapV2Router = artifacts.require('./UniswapV2Router02.sol')
const UniswapV2Pair = artifacts.require('./UniswapV2Pair.sol')
const WETH = artifacts.require('./WETH9.sol')
const TOKEN = artifacts.require('./Token.sol')
const StakeClaim = artifacts.require('./StakeClaim.sol')

const Beneficiary = "0x6ffFe11A5440fb275F30e0337Fc296f938a287a5"

let uniswapV2Factory,
    uniswapV2Router,
    weth,
    token,
    pair,
    pairAddress,
    stakeClaim


contract('Stake-claim-able-test', function([userOne, userTwo, userThree]) {

  async function deployContracts(){
    // deploy contracts
    uniswapV2Factory = await UniswapV2Factory.new(userOne)
    weth = await WETH.new()
    uniswapV2Router = await UniswapV2Router.new(uniswapV2Factory.address, weth.address)
    token = await TOKEN.new(toWei(String(100000)))

    // add token liquidity
    await token.approve(uniswapV2Router.address, toWei(String(500)))

    await uniswapV2Router.addLiquidityETH(
      token.address,
      toWei(String(500)),
      1,
      1,
      userOne,
      "1111111111111111111111"
    , { from:userOne, value:toWei(String(500)) })

    pairAddress = await uniswapV2Factory.allPairs(0)
    pair = await UniswapV2Pair.at(pairAddress)

    stakeClaim = await StakeClaim.new(
      userOne,
      token.address,
      pair.address,
      duration.days(30)
    )

    // add some rewards to claim stake
    stakeClaim.setRewardsDistribution(userOne)
    token.transfer(stakeClaim.address, toWei(String(1)))
    stakeClaim.notifyRewardAmount(toWei(String(1)))

    // send some tokens to another users
    await token.transfer(userTwo, toWei(String(1)))
    await token.transfer(userThree, toWei(String(1)))
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('INIT stake', function() {
    it('Correct init Stake', async function() {
      assert.equal(await stakeClaim.rewardsToken(), token.address)
      assert.equal(await stakeClaim.stakingToken(), pair.address)
    })
  })


  describe('Stake increase rewards logs', function() {
    it('_', async function() {
      // stake should not have any pool
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // amount to stake
      const toStake = await pair.balanceOf(userOne)
      assert.isTrue(toStake > 0)
      // stake
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      // stake should get pool
      assert.equal(Number(await pair.balanceOf(stakeClaim.address)), Number(toStake))
      // shares should be same as stake
      const shares = await stakeClaim.balanceOf(userOne)
      assert.equal(Number(shares), Number(toStake))

      // logs eraned
      console.log("without new rewards, total rewards 1 COT")
      let curDay = 5
      for(let i=0; i < 6; i++){
        await timeMachine.advanceTimeAndBlock(duration.days(5))
        console.log(
          "Day ", curDay, " - ",
          Number(fromWei(String(await stakeClaim.earned(userOne)))).toFixed(2), "Earned "
        )

        curDay = curDay+5
      }

      // clear user balance
      await token.transfer(userTwo, await token.balanceOf(userOne))
      assert.equal(await token.balanceOf(userOne), 0)

      // withdraw
      await stakeClaim.exit()
      // stake should send all pools
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // user should get back all pools
      assert.equal(Number(await pair.balanceOf(userOne)), Number(toStake))
      // user should get stake rewards
      assert.notEqual(await token.balanceOf(userOne), 0)
    })

    it('_', async function() {
      // stake should not have any pool
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // amount to stake
      const toStake = await pair.balanceOf(userOne)
      assert.isTrue(toStake > 0)
      // stake
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      // stake should get pool
      assert.equal(Number(await pair.balanceOf(stakeClaim.address)), Number(toStake))
      // shares should be same as stake
      const shares = await stakeClaim.balanceOf(userOne)
      assert.equal(Number(shares), Number(toStake))


      // add new rewards
      await token.transfer(stakeClaim.address, toWei(String(1)))
      await stakeClaim.notifyRewardAmount(toWei(String(1)))
      assert.equal(await token.balanceOf(stakeClaim.address), toWei(String(2)))

      // logs eraned
      console.log("with add new rewards, total rewards 2 COT")
      let curDay = 5
      for(let i=0; i < 6; i++){
        await timeMachine.advanceTimeAndBlock(duration.days(5))
        console.log(
          "Day ", curDay, " - ",
          Number(fromWei(String(await stakeClaim.earned(userOne)))).toFixed(2), "Earned "
        )

        curDay = curDay+5
      }

      // clear user balance
      await token.transfer(userTwo, await token.balanceOf(userOne))
      assert.equal(await token.balanceOf(userOne), 0)

      // withdraw
      await stakeClaim.exit()
      // stake should send all pools
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // user should get back all pools
      assert.equal(Number(await pair.balanceOf(userOne)), Number(toStake))
      // user should get stake rewards
      assert.notEqual(await token.balanceOf(userOne), 0)
    })
  })


  describe('Stake', function() {
    it('Can be staked and withdrawed', async function() {
      // stake should not have any pool
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // amount to stake
      const toStake = await pair.balanceOf(userOne)
      assert.isTrue(toStake > 0)
      // stake
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      // stake should get pool
      assert.equal(Number(await pair.balanceOf(stakeClaim.address)), Number(toStake))
      // shares should be same as stake
      const shares = await stakeClaim.balanceOf(userOne)
      assert.equal(Number(shares), Number(toStake))
      await timeMachine.advanceTimeAndBlock(duration.days(31))
      // exit
      await stakeClaim.exit()
      // stake should send all pools
      assert.equal(await pair.balanceOf(stakeClaim.address), 0)
      // user should get back all pools
      assert.equal(Number(await pair.balanceOf(userOne)), Number(toStake))
    })

    it('User should get rewards after time', async function() {
      // stake
      const toStake = await pair.balanceOf(userOne)
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      // check rewards
      const stakeRewards = await token.balanceOf(stakeClaim.address)
      assert.isTrue(stakeRewards > 0)
      const tokenBalanceBefore = await token.balanceOf(userOne)

      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(36))
      const calculateRewards = Number(toStake) * Number(await stakeClaim.rewardPerToken())
      // console.log(Number(toStake))
      // console.log(Number(await stakeClaim.rewardPerToken()))
      // console.log(Number(calculateRewards).toLocaleString('fullwide', {useGrouping:false}))
      // withdraw
      await stakeClaim.exit()
      // user should get all rewards
      assert.isTrue(Number(await token.balanceOf(userOne)) > Number(tokenBalanceBefore))
    })

    it('eranedByShare should be the same as earned', async function() {
      // stake
      const toStake = await pair.balanceOf(userOne)
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(31))
      assert.equal(
        Number(await stakeClaim.earned(userOne)),
        Number(await stakeClaim.earnedByShare(await stakeClaim.balanceOf(userOne)))
      )
    })

    it('User who join early get more rewards', async function() {
      // stake 1 pool token from user 1
      await pair.approve(stakeClaim.address, toWei(String(1)))
      await stakeClaim.stake(toWei(String(1)))
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))

      await pair.transfer(userTwo, toWei(String(1)))
      // stake 1 pool token from user 2
      await pair.approve(stakeClaim.address, toWei(String(1)), {from:userTwo})
      await stakeClaim.stake(toWei(String(1)), {from:userTwo})
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      assert.isTrue(Number(await stakeClaim.earned(userOne)) > Number(await stakeClaim.earned(userTwo)))
    })

    it('User who join early get more rewards via use stakeFor', async function() {
      // stake 1 pool token from user 1
      await pair.approve(stakeClaim.address, toWei(String(2)))
      await stakeClaim.stakeFor(toWei(String(1)), userOne)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      // stake 1 pool token from user 1 for user 2
      await stakeClaim.stakeFor(toWei(String(1)), userTwo)
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      assert.isTrue(Number(await stakeClaim.earned(userOne)) > Number(await stakeClaim.earned(userTwo)))
    })

    it('Users who join in the same time get the same rewards even if exit not in the same time even if exit much later', async function() {
      // clear rewards balance
      await token.transfer(userThree, await token.balanceOf(userOne), { from:userOne })
      await token.transfer(userThree, await token.balanceOf(userTwo), { from:userTwo })

      // stake 1 pool token from user 1
      await pair.approve(stakeClaim.address, toWei(String(2)))
      await stakeClaim.stakeFor(toWei(String(1)), userOne)
      await stakeClaim.stakeFor(toWei(String(1)), userTwo)
      await timeMachine.advanceTimeAndBlock(duration.days(31))

      assert.equal(
        Number(await stakeClaim.earned(userOne)),
        Number(await stakeClaim.earned(userTwo))
      )

      // users not hold any rewards
      assert.equal(Number(await token.balanceOf(userOne)), 0)
      assert.equal(Number(await token.balanceOf(userTwo)), 0)

      // exit
      await timeMachine.advanceTimeAndBlock(duration.days(31))
      await stakeClaim.exit( {from:userOne} )

      await timeMachine.advanceTimeAndBlock(duration.days(31))
      await stakeClaim.exit( {from:userTwo} )

      assert.isTrue(Number(await token.balanceOf(userTwo)) > 0)

      assert.equal(
        Number(await token.balanceOf(userOne)),
        Number(await token.balanceOf(userTwo))
      )
    })

    it('User who join 2 times via use stakeFor not lose rewards', async function() {
      // stake 1 pool token from user 1
      await pair.approve(stakeClaim.address, toWei(String(3)))
      await stakeClaim.stakeFor(toWei(String(1)), userOne)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      // stake 1 pool token from user 1 for user 2
      await stakeClaim.stakeFor(toWei(String(1)), userTwo)
      // add small amount from user 1
      const userOneBeforeDeposit = Number(await stakeClaim.earned(userOne))
      await stakeClaim.stakeFor(toWei(String(0.01)), userOne)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      // user 1 shouldnt lose rewards
      assert.isTrue(Number(await stakeClaim.earned(userOne)) > userOneBeforeDeposit)
      assert.isTrue(Number(await stakeClaim.earned(userOne)) > Number(await stakeClaim.earned(userTwo)))
    })

    it('User A claim not affect to user B rewards', async function() {
      // clear users balances
      await token.transfer(userThree, await token.balanceOf(userOne))
      await token.transfer(userThree, await token.balanceOf(userTwo), { from:userTwo })
      // stake 1 pool token from user 1
      await pair.approve(stakeClaim.address, toWei(String(3)))
      await stakeClaim.stakeFor(toWei(String(1)), userOne)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      // stake 1 pool token from user 1 for user 2
      await stakeClaim.stakeFor(toWei(String(1)), userTwo)
      // increase time
      await timeMachine.advanceTimeAndBlock(duration.days(15))
      const userOneEarned = await stakeClaim.earned(userOne)
      const userTwoEarned = await stakeClaim.earned(userTwo)

      // call few times from user 1
      await stakeClaim.getReward()
      await stakeClaim.getReward()
      await stakeClaim.getReward()

      // call from user 2
      await stakeClaim.getReward({ from:userTwo })

      assert.equal(Number(userOneEarned), Number(await token.balanceOf(userOne)))
      assert.equal(Number(userTwoEarned), Number(await token.balanceOf(userTwo)))
    })

    it('Destributor can rescue rewards', async function() {
      // stake
      const toStake = await pair.balanceOf(userOne)
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      await stakeClaim.exit()
      // send some remains
      await token.transfer(stakeClaim.address, 100);
      assert.isTrue(await token.balanceOf(stakeClaim.address) > 0)
      await stakeClaim.inCaseRewardsStuck()
      // should burn remains
      assert.equal(await token.balanceOf(stakeClaim.address), 0)
    })

    it('Not destributor can NOT rescue rewards', async function() {
      // stake
      const toStake = await pair.balanceOf(userOne)
      await pair.approve(stakeClaim.address, toStake)
      await stakeClaim.stake(toStake)
      await stakeClaim.exit()
      await stakeClaim.inCaseRewardsStuck({from:userTwo})
      .should.be.rejectedWith(EVMRevert)
    })
  })
  //END
})
