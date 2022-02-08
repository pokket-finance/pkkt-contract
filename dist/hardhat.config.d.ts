import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "hardhat-log-remover";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
declare const _default: {
    paths: {
        deploy: string;
        deployments: string;
    };
    networks: {
        hardhat: {
            forking: {
                url: string;
                gasLimit: number;
                blockNumber: number;
                accounts: string[] | {
                    mnemonic: string;
                };
            };
        };
        mainnet: {
            url: string;
            accounts: string[] | {
                mnemonic: string;
            };
        };
        ropsten: {
            url: string;
            gas: number;
            accounts: string[] | {
                mnemonic: string;
            };
            gasPrice: number;
        };
        rinkeby: {
            url: string;
            gas: number;
            gasPrice: number;
            accounts: string[] | {
                mnemonic: string;
            };
        };
    };
    namedAccounts: {
        deployer: {
            default: any;
            3: any;
            1: any;
        };
        settler: {
            default: any;
        };
        alice: {
            default: number;
        };
        bob: {
            default: number;
        };
        owner: {
            default: number;
        };
        trader: {
            default: number;
        };
    };
    etherscan: {
        apiKey: string | undefined;
    };
    gasReporter: {
        currency: string;
        enabled: boolean;
    };
    mocha: {
        timeout: number;
    };
    solidity: {
        version: string;
        settings: {
            optimizer: {
                runs: number;
                enabled: boolean;
            };
        };
    };
};
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default _default;
