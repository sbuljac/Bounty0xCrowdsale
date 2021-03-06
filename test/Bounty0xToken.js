import { ZERO_ADDRESS } from './helpers/util';

const Bounty0xToken = artifacts.require('Bounty0xToken');
const CrowdsaleTokenController = artifacts.require('CrowdsaleTokenController');
const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory');

contract('Bounty0xToken', (accounts) => {
  let token;
  let crowdsaleTokenController;
  let factory;

  before('get the deployed bounty0x token', async () => {
    token = await Bounty0xToken.deployed();
    crowdsaleTokenController = await CrowdsaleTokenController.deployed();
    factory = await MiniMeTokenFactory.deployed();
  });

  it('should be deployed', async () => {
    assert.strictEqual(typeof token.address, 'string');
  });

  it('controller should be CrowdsaleTokenController', async () => {
    const controller = await token.controller();
    assert.strictEqual(controller, crowdsaleTokenController.address);
  });

  it('should have a token factory', async () => {
    const minime = await token.tokenFactory();
    assert.strictEqual(minime, factory.address);
  });

  it('should have a total supply of 500M +/- 1 BNTY', async () => {
    const tokenSupply = await token.totalSupply();
    // not off by more than 1 BNTY === 0.0165 USD at crowdsale
    assert.strictEqual(tokenSupply.sub('5e+26').abs() < Math.pow(10, 18), true);
  });

  it('should have the constant attributes', async () => {
    //  0x0,                        // no parent token
    //  0,                          // no snapshot block number from parent
    //  "Bounty0x Token",           // Token name
    //  18   ,                      // Decimals
    //  "BNTY",                     // Symbol
    //  true                       // Enable transfers

    const parentSnapShotBlock = await token.parentSnapShotBlock();
    const parentToken = await token.parentToken();
    const name = await token.name();
    const decimals = await token.decimals();
    const symbol = await token.symbol();
    const transfersEnabled = await token.transfersEnabled();

    assert.strictEqual(parentSnapShotBlock.valueOf(), '0');
    assert.strictEqual(parentToken, ZERO_ADDRESS);
    assert.strictEqual(name, 'Bounty0x Token');
    assert.strictEqual(decimals.valueOf(), '18');
    assert.strictEqual(symbol, 'BNTY');
    assert.strictEqual(transfersEnabled, true);
  });
});