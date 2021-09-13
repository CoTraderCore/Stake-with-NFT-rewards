// import { BN, fromWei, toWei } from 'web3-utils'
// import ether from './helpers/ether'
// import EVMRevert from './helpers/EVMRevert'
// import { duration } from './helpers/duration'
// import { PairHash } from '../config'
//
// const BigNumber = BN
// const timeMachine = require('ganache-time-traveler')
//
// require('chai')
//   .use(require('chai-as-promised'))
//   .use(require('chai-bignumber')(BigNumber))
//   .should()
//
// const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
//
// // real contracts
// const UniswapV2Factory = artifacts.require('./UniswapV2Factory.sol')
// const UniswapV2Router = artifacts.require('./UniswapV2Router02.sol')
// const UniswapV2Pair = artifacts.require('./UniswapV2Pair.sol')
// const WETH = artifacts.require('./WETH9.sol')
// const TOKEN = artifacts.require('./Token.sol')
// const StakeNonClaim = artifacts.require('./StakeNonClaim.sol')
//
//
// const Beneficiary = "0x6ffFe11A5440fb275F30e0337Fc296f938a287a5"
//
// let uniswapV2Factory,
//     uniswapV2Router,
//     weth,
//     token,
//     pair,
//     pairAddress,
//     stakeNonClaim
//
//
// contract('Stake-NON-claim-able-test', function([userOne, userTwo, userThree]) {
//
//   async function deployContracts(){
//     // deploy contracts
//     uniswapV2Factory = await UniswapV2Factory.new(userOne)
//     weth = await WETH.new()
//     uniswapV2Router = await UniswapV2Router.new(uniswapV2Factory.address, weth.address)
//     token = await TOKEN.new(toWei(String(100000)))
//
//     // add token liquidity
//     await token.approve(uniswapV2Router.address, toWei(String(500)))
//
//     await uniswapV2Router.addLiquidityETH(
//       token.address,
//       toWei(String(500)),
//       1,
//       1,
//       userOne,
//       "1111111111111111111111"
//     , { from:userOne, value:toWei(String(500)) })
//
//     pairAddress = await uniswapV2Factory.allPairs(0)
//     pair = await UniswapV2Pair.at(pairAddress)
//
//     stakeNonClaim = await StakeNonClaim.new(
//       userOne,
//       token.address,
//       pair.address,
//       duration.days(30)
//     )
//
//     // add some rewards to non claim stake
//     stakeNonClaim.setRewardsDistribution(userOne)
//     token.transfer(stakeNonClaim.address, toWei(String(1)))
//     stakeNonClaim.notifyRewardAmount(toWei(String(1)))
//
//     // send some tokens to another users
//     await token.transfer(userTwo, toWei(String(1)))
//     await token.transfer(userThree, toWei(String(1)))
//   }
//
//   beforeEach(async function() {
//     await deployContracts()
//   })
//
//   describe('INIT stake', function() {
//     it('Correct init Stake', async function() {
//       assert.equal(await stakeNonClaim.rewardsToken(), token.address)
//       assert.equal(await stakeNonClaim.stakingToken(), pair.address)
//     })
//   })
//
//
//   describe('Stake', function() {
//     it('Can be staked and withdrawed', async function() {
//       // stake should not have any pool
//       assert.equal(await pair.balanceOf(stakeNonClaim.address), 0)
//       // amount to stake
//       const toStake = await pair.balanceOf(userOne)
//       assert.isTrue(toStake > 0)
//       // stake
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       // stake should get pool
//       assert.equal(Number(await pair.balanceOf(stakeNonClaim.address)), Number(toStake))
//       // shares should be same as stake
//       const shares = await stakeNonClaim.balanceOf(userOne)
//       assert.equal(Number(shares), Number(toStake))
//       // withdraw
//       await stakeNonClaim.withdraw(shares)
//       // stake should send all pools
//       assert.equal(await pair.balanceOf(stakeNonClaim.address), 0)
//       // user should get back all pools
//       assert.equal(Number(await pair.balanceOf(userOne)), Number(toStake))
//     })
//
//
//     it('User should get rewards after time', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       // check rewards
//       const stakeRewards = await token.balanceOf(stakeNonClaim.address)
//       assert.isTrue(stakeRewards > 0)
//       const tokenBalanceBefore = await token.balanceOf(userOne)
//
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//       const calculateRewards = Number(toStake) * Number(await stakeNonClaim.rewardPerToken())
//       // console.log(Number(toStake))
//       // console.log(Number(await stakeNonClaim.rewardPerToken()))
//       // console.log(Number(calculateRewards).toLocaleString('fullwide', {useGrouping:false}))
//       // withdraw
//       await stakeNonClaim.exit()
//       // user should get all rewards
//       assert.isTrue(Number(await token.balanceOf(userOne)) > Number(tokenBalanceBefore))
//     })
//
//     it('eranedByShare should be the same as earned', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//       assert.equal(
//         Number(await stakeNonClaim.earned(userOne)),
//         Number(await stakeNonClaim.earnedByShare(await stakeNonClaim.balanceOf(userOne)))
//       )
//     })
//
//     it('User who join early get more rewards', async function() {
//       // stake 1 pool token from user 1
//       await pair.approve(stakeNonClaim.address, toWei(String(1)))
//       await stakeNonClaim.stake(toWei(String(1)))
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//
//       await pair.transfer(userTwo, toWei(String(1)))
//       // stake 1 pool token from user 2
//       await pair.approve(stakeNonClaim.address, toWei(String(1)), {from:userTwo})
//       await stakeNonClaim.stake(toWei(String(1)), {from:userTwo})
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//       assert.isTrue(Number(await stakeNonClaim.earned(userOne)) > Number(await stakeNonClaim.earned(userTwo)))
//     })
//
//     it('User who join early get more rewards via use stakeFor', async function() {
//       // stake 1 pool token from user 1
//       await pair.approve(stakeNonClaim.address, toWei(String(2)))
//       await stakeNonClaim.stakeFor(toWei(String(1)), userOne)
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//       // stake 1 pool token from user 1 for user 2
//       await stakeNonClaim.stakeFor(toWei(String(1)), userTwo)
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//       assert.isTrue(Number(await stakeNonClaim.earned(userOne)) > Number(await stakeNonClaim.earned(userTwo)))
//     })
//
//     it('User who join 2 times via use stakeFor not lose rewards', async function() {
//       // stake 1 pool token from user 1
//       await pair.approve(stakeNonClaim.address, toWei(String(3)))
//       await stakeNonClaim.stakeFor(toWei(String(1)), userOne)
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//       // stake 1 pool token from user 1 for user 2
//       await stakeNonClaim.stakeFor(toWei(String(1)), userTwo)
//       // add small amount from user 1
//       const userOneBeforeDeposit = Number(await stakeNonClaim.earned(userOne))
//       await stakeNonClaim.stakeFor(toWei(String(0.01)), userOne)
//       // increase time
//       await timeMachine.advanceTimeAndBlock(duration.days(15))
//       // user 1 shouldnt lose rewards
//       assert.isTrue(Number(await stakeNonClaim.earned(userOne)) > userOneBeforeDeposit)
//       assert.isTrue(Number(await stakeNonClaim.earned(userOne)) > Number(await stakeNonClaim.earned(userTwo)))
//     })
//
//     it('Users who join in the same time get the same rewards even if exit not in the same time even if exit much later', async function() {
//       // clear rewards balance
//       await token.transfer(userThree, await token.balanceOf(userOne), { from:userOne })
//       await token.transfer(userThree, await token.balanceOf(userTwo), { from:userTwo })
//
//       // stake 1 pool token from user 1
//       await pair.approve(stakeNonClaim.address, toWei(String(2)))
//       await stakeNonClaim.stakeFor(toWei(String(1)), userOne)
//       await stakeNonClaim.stakeFor(toWei(String(1)), userTwo)
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//
//       assert.equal(
//         Number(await stakeNonClaim.earned(userOne)),
//         Number(await stakeNonClaim.earned(userTwo))
//       )
//
//       // users not hold any rewards
//       assert.equal(Number(await token.balanceOf(userOne)), 0)
//       assert.equal(Number(await token.balanceOf(userTwo)), 0)
//
//       // exit
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//       await stakeNonClaim.exit( {from:userOne} )
//
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//       await stakeNonClaim.exit( {from:userTwo} )
//
//       assert.isTrue(Number(await token.balanceOf(userTwo)) > 0)
//
//       assert.equal(
//         Number(await token.balanceOf(userOne)),
//         Number(await token.balanceOf(userTwo))
//       )
//     })
//
//     it('Destributor can rescue rewards', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       await stakeNonClaim.inCaseRewardsStuck()
//     })
//
//     it('Not destributor can NOT rescue rewards', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       await stakeNonClaim.inCaseRewardsStuck( {from:userTwo} )
//       .should.be.rejectedWith(EVMRevert)
//     })
//
//     it('User can not call exit() (claim and withdraw) ahead of time ', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       await stakeNonClaim.exit().should.be.rejectedWith(EVMRevert)
//     })
//
//     it('User can call exit() (claim and withdraw) after finish stake and get pool back + rewards', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stakeFor(toStake, userOne)
//       // advance time
//       await timeMachine.advanceTimeAndBlock(duration.days(31))
//       // clear balance
//       await token.transfer(userTwo, await token.balanceOf(userOne))
//       // exit
//       await stakeNonClaim.exit()
//       assert.isTrue(await token.balanceOf(userOne) > 0)
//       assert.equal(Number(await pair.balanceOf(userOne)), Number(toStake))
//     })
//
//     it('User can not claim rewards (call getReward)', async function() {
//       // clear rewards balance
//       await token.transfer(userTwo, await token.balanceOf(userOne))
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stakeFor(toStake, userOne)
//       try{
//         // try get rewards (should fail beacuse private)
//         await stakeNonClaim.getReward().should.be.rejectedWith(EVMRevert)
//       }catch(e){
//         console.log("stakeNonClaim.getReward is not a function")
//       }
//       // shouldnt receive any rewards
//       assert.equal(await token.balanceOf(userOne), 0)
//     })
//
//     it('Cannot get remains rewards if stake have not destributed shares', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       await stakeNonClaim.withdraw(toStake)
//       // send some remains
//       await token.transfer(stakeNonClaim.address, 100);
//       assert.isTrue(await token.balanceOf(stakeNonClaim.address) > 0)
//       await stakeNonClaim.inCaseRewardsStuck()
//       // should burn remains
//       assert.equal(await token.balanceOf(stakeNonClaim.address), 0)
//     })
//
//     it('Not reward destributor can not call inCaseRewardsStuck', async function() {
//       // stake
//       const toStake = await pair.balanceOf(userOne)
//       await pair.approve(stakeNonClaim.address, toStake)
//       await stakeNonClaim.stake(toStake)
//       await stakeNonClaim.withdraw(toStake)
//       await stakeNonClaim.inCaseRewardsStuck({from:userTwo})
//       .should.be.rejectedWith(EVMRevert)
//     })
//   })
//
//   //END
// })
