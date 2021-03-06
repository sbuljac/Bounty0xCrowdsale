import { ONE_DAY_SECONDS, ONE_HOUR_SECONDS, withinPercentage } from './helpers/util';
import expectThrow from './helpers/expectThrow';

const BntyExchangeRateCalculator = artifacts.require('BntyExchangeRateCalculator');
const MockBntyExchangeRateCalculator = artifacts.require('MockBntyExchangeRateCalculator');

const CROWDSALE_PRICE = 16500;
const PRESALE_PRICE = 13200;

const CONVERSION_TEST_CASES = [
  {
    ethPriceUSD: 355,
    bntyMicrodollarPrice: PRESALE_PRICE,
    ethAmt: 1
  },
  {
    ethPriceUSD: 460,
    bntyMicrodollarPrice: CROWDSALE_PRICE,
    ethAmt: 3.15
  },
  {
    ethPriceUSD: 460,
    bntyMicrodollarPrice: CROWDSALE_PRICE,
    ethAmt: 10
  },
  {
    ethPriceUSD: 355,
    bntyMicrodollarPrice: PRESALE_PRICE,
    ethAmt: 0.1
  },
  {
    ethPriceUSD: 460,
    bntyMicrodollarPrice: CROWDSALE_PRICE,
    ethAmt: 0.1
  },
];

contract('BntyExchangeRateCalculator', function (accounts) {
  CONVERSION_TEST_CASES.forEach(
    ({ ethPriceUSD, bntyMicrodollarPrice, ethAmt }) => {
      describe(`ETH Price: $${ethPriceUSD}, USD/BNTY: $${bntyMicrodollarPrice * Math.pow(10, -6)}`, async () => {
        let calculator;
        before(async () => {
          calculator = await BntyExchangeRateCalculator.new(bntyMicrodollarPrice, ethPriceUSD, 0);
        });

        it(
          `calculates BNTY rewards correctly`,
          async () => {
            const rewardFor = await calculator.weiToBnty(ethAmt * Math.pow(10, 18));

            const bntyUsdPrice = bntyMicrodollarPrice * Math.pow(10, -6);
            withinPercentage(rewardFor, (ethPriceUSD * ethAmt / bntyUsdPrice) * Math.pow(10, 18));
          }
        );

        describe('#usdToWei', async () => {

          for (let testUsdAmt = 0; testUsdAmt < 1500000; testUsdAmt = testUsdAmt === 0 ? 50 : testUsdAmt * 2) {
            it(
              `calculates WEI per USD correctly for $${testUsdAmt}`, async () => {
                const usdToWei = await calculator.usdToWei(testUsdAmt);

                withinPercentage(usdToWei, (testUsdAmt / ethPriceUSD) * Math.pow(10, 18));
              }
            );
          }

        });
      });
    }
  );

  describe('#setUSDEtherPrice', function () {
    let calc;
    const TEST_LOCKED_TIME = 1513346400;

    beforeEach(async () => {
      calc = await MockBntyExchangeRateCalculator.new(16500, 355, 1513346400);
    });

    it('can be changed one day before the lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME - ONE_DAY_SECONDS);

      await calc.setUSDEtherPrice(460);
    });

    it('can be changed one hour before lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME - ONE_HOUR_SECONDS);

      await calc.setUSDEtherPrice(460);
    });

    it('can be changed one second before lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME - 1);

      await calc.setUSDEtherPrice(460);
    });

    it('cannot be changed at lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME);

      await expectThrow(calc.setUSDEtherPrice(460));
    });

    it('cannot be changed after lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME + 1);

      await expectThrow(calc.setUSDEtherPrice(460));
    });

    it('cannot be changed one day after lock time', async () => {
      await calc.setTime(TEST_LOCKED_TIME + ONE_DAY_SECONDS);

      await expectThrow(calc.setUSDEtherPrice(460));
    });
  });
});