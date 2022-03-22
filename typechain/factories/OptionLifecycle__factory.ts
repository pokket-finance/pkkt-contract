/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  OptionLifecycle,
  OptionLifecycleInterface,
} from "../OptionLifecycle";

const _abi = [
  {
    inputs: [
      {
        internalType: "bool",
        name: "_execute",
        type: "bool",
      },
      {
        components: [
          {
            internalType: "uint128",
            name: "totalAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalTerminate",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "strikePrice",
            type: "uint128",
          },
          {
            internalType: "uint16",
            name: "round",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "premiumRate",
            type: "uint16",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "callOrPut",
            type: "bool",
          },
        ],
        internalType: "struct StructureData.OptionState",
        name: "_optionState",
        type: "tuple",
      },
      {
        internalType: "bool",
        name: "_callOrPut",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "_depositAssetAmountDecimals",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "_counterPartyAssetAmountDecimals",
        type: "uint8",
      },
    ],
    name: "calculateMaturity",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "releasedDepositAssetAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "releasedDepositAssetPremiumAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "releasedDepositAssetAmountWithPremium",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "releasedCounterPartyAssetAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "releasedCounterPartyAssetPremiumAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "releasedCounterPartyAssetAmountWithPremium",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollDepositAssetAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollDepositAssetPremiumAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollDepositAssetAmountWithPremium",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollCounterPartyAssetAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollCounterPartyAssetPremiumAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "autoRollCounterPartyAssetAmountWithPremium",
            type: "uint256",
          },
        ],
        internalType: "struct StructureData.MaturedState",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "_source",
        type: "address",
      },
    ],
    name: "getAvailableBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x612a0961003a600b82828239805160001a60731461002d57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100f45760003560e01c80638a229a5711610096578063b2838a7311610070578063b2838a73146102d7578063c502f991146102f8578063c975707314610318578063ce37f8bc1461032b57600080fd5b80638a229a571461025f578063aab696331461027f578063b0eecba81461029f57600080fd5b806369328dec116100d257806369328dec146101645780637441e8bb146101845780637b40fc98146101a4578063862f70b8146101c457600080fd5b80631bb98a33146100f95780634ed14a7f1461012257806366aef26314610142575b600080fd5b61010c6101073660046124e8565b61034b565b60405161011991906126ca565b60405180910390f35b61013561013036600461235e565b6105fd565b6040516101199190612672565b81801561014e57600080fd5b5061016261015d366004612589565b610811565b005b81801561017057600080fd5b5061016261017f3660046121f0565b6109d5565b81801561019057600080fd5b5061016261019f3660046123f8565b610a45565b8180156101b057600080fd5b506101626101bf3660046123ac565b610c11565b6101d76101d2366004612247565b610eff565b6040516101199190815181526020808301519082015260408083015190820152606080830151908201526080808301519082015260a0808301519082015260c0808301519082015260e0808301519082015261010080830151908201526101208083015190820152610140808301519082015261016091820151918101919091526101800190565b81801561026b57600080fd5b5061016261027a3660046123ac565b6111cd565b81801561028b57600080fd5b506101d761029a36600461253c565b611398565b8180156102ab57600080fd5b506102bf6102ba3660046125ab565b6114d5565b6040516001600160801b039091168152602001610119565b6102ea6102e53660046121be565b6116c2565b604051908152602001610119565b81801561030457600080fd5b50610162610313366004612452565b611766565b6101356103263660046124b4565b61191a565b81801561033757600080fd5b50610162610346366004612602565b611cc5565b6040805161014081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e08101829052610100810182905261012081019190915260006040518061014001604052808960020160006001886103bd919061292b565b61ffff908116825260208083019390935260409182016000908120546001600160801b03168552928401839052908301829052606083018290526080830182905260a0830182905260c0830182905260e0830182905261010083019190915285151561012090920191909152909150600290851611156105f057600088600201600060028761044c919061292b565b61ffff168152602081019190915260400160002080549091506001600160801b031661047a575090506105f3565b6040805160e08101825282546001600160801b038082168352600160801b918290048116602084015260018501549081169383019390935261ffff90830481166060830152600160901b830416608082015260ff600160a01b83048116151560a0830152600160a81b909204909116151560c08201526000906105019086908b8b8b610eff565b9050841561058057610517816101200151611d1f565b6001600160801b031660a084015261014081015161053490611d1f565b6001600160801b031660c0840152606081015161055090611d1f565b6001600160801b031660e0840152608081015161056c90611d1f565b6001600160801b03166101008401526105ed565b61058d8160c00151611d1f565b6001600160801b0316602084015260e08101516105a990611d1f565b6001600160801b0316604084015280516105c290611d1f565b6001600160801b0316606084015260208101516105de90611d1f565b6001600160801b031660808401525b50505b90505b9695505050505050565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101919091526001600160a01b03841660009081526004860160209081526040808320815160c08101835281546001600160801b03908116825293810185905291820184905260608201939093526002830154600160801b900482166080820152600383015490911660a082015284156107e45760028461ffff1611156107b45760008760020160006002876106bf919061292b565b61ffff9081168252602080830193909352604091820160002060019081015483516101008101855288546001600160801b038082168352600160801b918290048116978301979097529289015480871695820195909552938290048516606085015260028801548086166080860152829004851660a0850152600388015494851660c0850152930460ff16151560e0830152600160901b90920490911691506107719061076c9083611d91565b611d1f565b6001600160801b03908116602084015260018401546107a09161076c91600160801b90041661ffff8416611e29565b6001600160801b03166040830152506107cc565b8154600160801b90046001600160801b031660208201525b60028201546001600160801b031660608201526105f3565b60018201546001600160801b038082166020840152600160801b9091041660608201529695505050505050565b600382015460005b8181101561095257600084600401600086600301848154811061084c57634e487b7160e01b600052603260045260246000fd5b60009182526020808320909101546001600160a01b03168352820192909252604001902060028101549091506001600160801b0316156108ba576002810180546001830180546001600160801b03908116908316600160801b021790556001600160801b03191690556108e6565b6001810154600160801b90046001600160801b0316156108e6576001810180546001600160801b031690555b8054600160801b90046001600160801b03166109125760010180546001600160801b0319169055610940565b80546001820180546001600160801b0319166001600160801b03600160801b84048116919091179091551690555b8061094a81612991565b915050610819565b50600183015461ffff8316600090815260028501602052604090205461098f9161076c91600160801b90046001600160801b039081169116611e45565b61ffff9092166000908152600284016020526040902080546001600160801b03938416600160801b029316929092179091555060010180546001600160801b0319169055565b600082116109e257600080fd5b6001600160a01b038116610a2c576040516001600160a01b0384169083156108fc029084906000818181858888f19350505050158015610a26573d6000803e3d6000fd5b50505050565b610a406001600160a01b0382168484611e51565b505050565b6001600160a01b038416600090815260048601602052604090208115610b9e576002810154600160801b90046001600160801b0316848111610b41576000610a8d8683611ea3565b8354909150610aa99061076c906001600160801b031683611ea3565b83546001600160801b0319166001600160801b03918216178455600284018054821690558854610ade9161076c911684611ea3565b88546001600160801b0319166001600160801b0391821617895561ffff8616600090815260028a016020526040902080549091610b209161076c911684611ea3565b81546001600160801b0319166001600160801b039190911617905550610b98565b610b4e61076c8287611ea3565b6002830180546001600160801b03928316600160801b029083161790558754610b7c9161076c911687611ea3565b87546001600160801b0319166001600160801b03919091161787555b50610c09565b6003810154610bba9061076c906001600160801b031686611ea3565b6003820180546001600160801b0319166001600160801b039283161790558654610bf09161076c91600160801b90041686611ea3565b86546001600160801b03918216600160801b0291161786555b505050505050565b6001600160a01b038416600090815260048601602052604090208215610e22576002810154600090610c4c906001600160801b031686611e45565b90508261ffff1660021415610cdf578154600160801b90046001600160801b0316811115610c7957600080fd5b60006002880181610c8b60018761292b565b61ffff16815260208101919091526040016000208054909150610cc29061076c90600160801b90046001600160801b031688611e45565b81546001600160801b03918216600160801b029116179055610df1565b6000876002016000600286610cf4919061292b565b61ffff90811682526020808301939093526040918201600090812083516101008101855288546001600160801b038082168352600160801b918290048116978301979097526001808b015480891697840197909752958190048716606083015260028a01548088166080840152819004871660a083015260038a015496871660c083015290950460ff16151560e08601529283015492945092610da1929091600160901b90910416611d91565b905080831115610db057600080fd5b6001890154610dcc9061076c906001600160801b031689611e45565b60018a0180546001600160801b0319166001600160801b039290921691909117905550505b610dfa81611d1f565b6002830180546001600160801b0319166001600160801b039290921691909117905550610c09565b6001810154600090610e4490600160801b90046001600160801b031686611e45565b60018301549091506001600160801b0316811115610e6157600080fd5b610e6a81611d1f565b8260010160106101000a8154816001600160801b0302191690836001600160801b031602179055506000876002016000600186610ea7919061292b565b61ffff16815260208101919091526040016000208054909150610ede9061076c90600160801b90046001600160801b031688611e45565b81546001600160801b03918216600160801b02911617905550505050505050565b610f076120fc565b600060405180610180016040528060008152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001600081526020016000815250905086156110f157600085610fc957610fc4610f8486600a612861565b6040890151610fbe906001600160801b031681610fa28960046127d9565b610fad90600a612861565b8c516001600160801b031690611eaf565b90611ebb565b611013565b611013610fd78660046127d9565b610fe290600a612861565b610fbe610ff087600a612861565b60408b01518b5161100d916001600160801b039182169116611eaf565b90611eaf565b90506000611032886080015161ffff1683611ec790919063ffffffff16565b60208901519091506001600160801b0316156110a657602088015188516110679184916001600160801b039182169116611ed9565b60608401526020880151885161108b9183916001600160801b039182169116611ed9565b6080840181905260608401516110a091611e45565b60a08401525b60608301516110b6908390611ea3565b61012084015260808301516110cc908290611ea3565b61014084018190526101208401516110e391611e45565b610160840152506105f39050565b855160808701516001600160801b039091169060009061111690839061ffff16611ec7565b60208901519091506001600160801b031615611184576020880151885161114b9184916001600160801b039182169116611ed9565b83526020880151885161116c9183916001600160801b039182169116611ed9565b60208401819052835161117e91611e45565b60408401525b8251611191908390611ea3565b60c084015260208301516111a6908290611ea3565b60e0840181905260c08401516111bb91611e45565b61010084015250509695505050505050565b6001600160a01b0384166000908152600486016020526040902082156112e15760028101546112099061076c906001600160801b031686611ea3565b600282810180546001600160801b0319166001600160801b03939093169290921790915561ffff8316141561129e576000600287018161124a60018661292b565b61ffff168152602081019190915260400160002080549091506112819061076c90600160801b90046001600160801b031687611ea3565b81546001600160801b03918216600160801b029116179055610c09565b60018601546112ba9061076c906001600160801b031686611ea3565b6001870180546001600160801b0319166001600160801b0392909216919091179055610c09565b60018101546113049061076c90600160801b90046001600160801b031686611ea3565b8160010160106101000a8154816001600160801b0302191690836001600160801b031602179055506000866002016000600185611341919061292b565b61ffff168152602081019190915260400160002080549091506113789061076c90600160801b90046001600160801b031687611ea3565b81546001600160801b03918216600160801b029116179055505050505050565b6113a06120fc565b6040805160e08101825287546001600160801b038082168352600160801b918290048116602084015260018a01549081169383019390935261ffff90830481166060830152600160901b830416608082015260ff600160a01b83048116151560a0830152600160a81b909204909116151560c0820152600090611427908490888888610eff565b60018801805485158015600160a01b0260ff60a01b19909216919091179091559091506114905760a081015188546114739161076c91600160801b90046001600160801b031690611e45565b88546001600160801b03918216600160801b0291161788556105f0565b604081015188546114ae9161076c916001600160801b031690611e45565b88546001600160801b0319166001600160801b039190911617909755509495945050505050565b6040805160e0810182526000808252602080830182815283850183815261ffff808916606087018181526080880187815260a089018881528b151560c08b01908152848a5260028f01909852998820895196516001600160801b03908116600160801b908102988216989098178255955160019182018054945193519c5199511515600160a81b0260ff60a81b199a1515600160a01b0260ff60a01b199e8916600160901b029e909e1662ffffff60901b199590981690990271ffffffffffffffffffffffffffffffffffff19909516919097161792909217169290921797909717939093169190911790559092111561167457600385015460005b8181101561167157600087600401600089600301848154811061160457634e487b7160e01b600052603260045260246000fd5b60009182526020808320909101546001600160a01b03168352820192909252604001902080549091506001600160801b0316156116515780546001600160801b0316600160801b81021781555b80546001600160801b03191690558061166981612991565b9150506115d1565b50505b60018461ffff16116116875760006116b7565b60028501600061169860018761292b565b61ffff1681526020810191909152604001600020546001600160801b03165b9150505b9392505050565b60006001600160a01b03831615611753576040516370a0823160e01b81526001600160a01b0383811660048301528416906370a082319060240160206040518083038186803b15801561171457600080fd5b505afa158015611728573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061174c91906125ea565b9050611760565b506001600160a01b038116315b92915050565b61ffff8216600090815260028701602090815260408083206001600160a01b038916845260048a019092529091206003810154600160801b900460ff166117ee576003808201805460ff60801b1916600160801b17905588018054600181018255600091825260209091200180546001600160a01b0389166001600160a01b03199091161790555b826118a75780546118139061076c90600160801b90046001600160801b031688611e45565b81546001600160801b03918216600160801b02911617815584156118a257600281015461184d9061076c906001600160801b031687611e45565b6002820180546001600160801b0319166001600160801b03928316179055600189015461187f9161076c911687611e45565b6001890180546001600160801b0319166001600160801b03929092169190911790555b6118dc565b80546118c09061076c906001600160801b031688611e45565b81546001600160801b0319166001600160801b03919091161781555b81546118f59061076c906001600160801b031688611e45565b82546001600160801b0319166001600160801b03919091161790915550505050505050565b6040805160c08082018352600080835260208084018290528385018290526060808501839052608080860184905260a0808701859052875160e081018952858152938401859052968301849052908201839052810182905293840181905290830152906040805160e081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c08101919091526040805160c08101825261ffff86166000908152600289016020908152838220546001600160801b039081168452908301829052928201819052606082015287548083166080830152600160801b900490911660a08201528515611bf957600287016000611a2560018861292b565b61ffff90811682526020808301939093526040918201600020825160e08101845281546001600160801b038082168352600160801b918290048116968301969096526001928301548087169583019590955284048316606080830191909152600160901b85048416608083015260ff600160a01b86048116151560a0840152600160a81b909504909416151560c0820152908b01549093169184019190915290935060029086161115611be457866002016000600287611ae5919061292b565b61ffff90811682526020808301939093526040918201600020825160e08101845281546001600160801b038082168352600160801b9182900481169683018790526001909301549283169482019490945292810482166060840152600160901b81049091166080830181905260ff600160a01b83048116151560a0850152600160a81b909204909116151560c0830152909350611b859161076c91611e29565b6001600160801b039081166040830181905260808401518451611bd19361076c9392611bcb92611bba92169061ffff16611e29565b87516001600160801b031690611e45565b90611ea3565b6001600160801b031660208201526105f3565b82516001600160801b031660208201526105f3565b60018561ffff1611156105f357600287016000611c1760018861292b565b61ffff90811682526020808301939093526040918201600020825160e08101845281546001600160801b03808216808452600160801b928390048216848901908152600190950154808316978501979097529186048516606080850191909152600160901b8704909516608084015260ff600160a01b87048116151560a0850152600160a81b909604909516151560c083015294860194909452519091169083015291509695505050505050565b60018101546001600160801b031615611cdd57600080fd5b6001018054601083901c6001600160801b031673ffff0000ffffffffffffffffffffffffffffffff199091161761ffff92909216600160901b02919091179055565b60006001600160801b03821115611d8d5760405162461bcd60e51b815260206004820152602760248201527f53616665436173743a2076616c756520646f65736e27742066697420696e20316044820152663238206269747360c81b60648201526084015b60405180910390fd5b5090565b60408201516000906001600160801b031680611dbc57505060208201516001600160801b0316611760565b611dea8361ffff16611de486606001516001600160801b031684611ea390919063ffffffff16565b90611e29565b905083602001516001600160801b031660001415611e09579050611760565b6020840151611e21906001600160801b031682611e45565b949350505050565b60006116bb612710610fbe611e3e85836127c1565b8690611eaf565b60006116bb82846127c1565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180516001600160e01b031663a9059cbb60e01b179052610a40908490611f1f565b60006116bb828461294e565b60006116bb828461290c565b60006116bb82846127fe565b60006116bb612710610fbe8585611eaf565b6000821580611ee6575081155b80611eef575083155b15611efc575060006116bb565b81831015611f1757611f1282610fbe8686611eaf565b611e21565b509192915050565b6000611f74826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316611ff19092919063ffffffff16565b805190915015610a405780806020019051810190611f92919061222b565b610a405760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401611d84565b6060611e21848460008585843b61204a5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401611d84565b600080866001600160a01b031685876040516120669190612623565b60006040518083038185875af1925050503d80600081146120a3576040519150601f19603f3d011682016040523d82523d6000602084013e6120a8565b606091505b50915091506120b88282866120c3565b979650505050505050565b606083156120d25750816116bb565b8251156120e25782518084602001fd5b8160405162461bcd60e51b8152600401611d84919061263f565b6040518061018001604052806000815260200160008152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001600081526020016000815260200160008152602001600081525090565b80356001600160a01b038116811461217457600080fd5b919050565b8035612174816129c2565b80356001600160801b038116811461217457600080fd5b803561ffff8116811461217457600080fd5b803560ff8116811461217457600080fd5b600080604083850312156121d0578182fd5b6121d98361215d565b91506121e76020840161215d565b90509250929050565b600080600060608486031215612204578081fd5b61220d8461215d565b9250602084013591506122226040850161215d565b90509250925092565b60006020828403121561223c578081fd5b81516116bb816129c2565b6000806000806000858703610160811215612260578182fd5b863561226b816129c2565b955060e0601f198201121561227e578182fd5b5060405160e0810181811067ffffffffffffffff821117156122ae57634e487b7160e01b83526041600452602483fd5b6040526122bd60208801612184565b81526122cb60408801612184565b60208201526122dc60608801612184565b60408201526122ed6080880161219b565b60608201526122fe60a0880161219b565b608082015261230f60c08801612179565b60a082015261232060e08801612179565b60c082015293506123346101008701612179565b925061234361012087016121ad565b915061235261014087016121ad565b90509295509295909350565b60008060008060808587031215612373578384fd5b843593506123836020860161215d565b92506040850135612393816129c2565b91506123a16060860161219b565b905092959194509250565b600080600080600060a086880312156123c3578081fd5b853594506123d36020870161215d565b93506040860135925060608601356123ea816129c2565b91506123526080870161219b565b600080600080600060a0868803121561240f578081fd5b8535945061241f6020870161215d565b9350604086013592506124346060870161219b565b91506080860135612444816129c2565b809150509295509295909350565b60008060008060008060c0878903121561246a578081fd5b8635955061247a6020880161215d565b945060408701359350606087013592506124966080880161219b565b915060a08701356124a6816129c2565b809150509295509295509295565b6000806000606084860312156124c8578081fd5b8335925060208401356124da816129c2565b91506122226040850161219b565b60008060008060008060c08789031215612500578384fd5b863595506020870135612512816129c2565b9450612520604088016121ad565b935061252e606088016121ad565b92506124966080880161219b565b60008060008060008060c08789031215612554578384fd5b8635955060208701359450604087013561256d816129c2565b935061257b606088016121ad565b9250612496608088016121ad565b6000806040838503121561259b578182fd5b823591506121e76020840161219b565b6000806000606084860312156125bf578081fd5b833592506125cf6020850161219b565b915060408401356125df816129c2565b809150509250925092565b6000602082840312156125fb578081fd5b5051919050565b60008060408385031215612614578182fd5b50508035926020909101359150565b60008251612635818460208701612965565b9190910192915050565b602081526000825180602084015261265e816040850160208701612965565b601f01601f19169190910160400192915050565b60c0810161176082846001600160801b038082511683528060208301511660208401528060408301511660408401528060608301511660608401528060808301511660808401528060a08301511660a0840152505050565b81516001600160801b03168152610140810160208301516126f660208401826001600160801b03169052565b50604083015161271160408401826001600160801b03169052565b50606083015161272c60608401826001600160801b03169052565b50608083015161274760808401826001600160801b03169052565b5060a083015161276260a08401826001600160801b03169052565b5060c083015161277d60c08401826001600160801b03169052565b5060e083015161279860e08401826001600160801b03169052565b50610100838101516001600160801b031690830152610120928301511515929091019190915290565b600082198211156127d4576127d46129ac565b500190565b600060ff821660ff84168060ff038211156127f6576127f66129ac565b019392505050565b60008261281957634e487b7160e01b81526012600452602481fd5b500490565b600181815b8085111561285957816000190482111561283f5761283f6129ac565b8085161561284c57918102915b93841c9390800290612823565b509250929050565b60006116bb60ff84168360008261287a57506001611760565b8161288757506000611760565b816001811461289d57600281146128a7576128c3565b6001915050611760565b60ff8411156128b8576128b86129ac565b50506001821b611760565b5060208310610133831016604e8410600b84101617156128e6575081810a611760565b6128f0838361281e565b8060001904821115612904576129046129ac565b029392505050565b6000816000190483118215151615612926576129266129ac565b500290565b600061ffff83811690831681811015612946576129466129ac565b039392505050565b600082821015612960576129606129ac565b500390565b60005b83811015612980578181015183820152602001612968565b83811115610a265750506000910152565b60006000198214156129a5576129a56129ac565b5060010190565b634e487b7160e01b600052601160045260246000fd5b80151581146129d057600080fd5b5056fea264697066735822122020970b2794573a46c253c3a108664986a4a15100ba2d30c849306bf15c6f29bf64736f6c63430008040033";

export class OptionLifecycle__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<OptionLifecycle> {
    return super.deploy(overrides || {}) as Promise<OptionLifecycle>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): OptionLifecycle {
    return super.attach(address) as OptionLifecycle;
  }
  connect(signer: Signer): OptionLifecycle__factory {
    return super.connect(signer) as OptionLifecycle__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): OptionLifecycleInterface {
    return new utils.Interface(_abi) as OptionLifecycleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OptionLifecycle {
    return new Contract(address, _abi, signerOrProvider) as OptionLifecycle;
  }
}
