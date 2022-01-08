// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
library Utils { 
     
    uint256 public constant RATIOMULTIPLIER = 10000;
 
     using SafeMath for uint256;
      function StringConcat(bytes memory _base, bytes memory _value) internal pure returns (string memory) {
        string memory _tmpValue = new string(_base.length + _value.length);
        bytes memory _newValue = bytes(_tmpValue);

        uint i;
        uint j;

        for(i=0; i<_base.length; i++) {
            _newValue[j++] = _base[i];
        }

        for(i=0; i<_value.length; i++) {
            _newValue[j++] = _value[i++];
        }

        return string(_newValue);
    }

    function Uint8Sub(uint8 a, uint8 b) internal pure returns (uint8) {
        require(b <= a);
        return a - b;
    }
    
 
    function getAmountToTerminate(uint256 _maturedAmount, uint256 _assetToTerminate, uint256 _assetAmount) 
    internal pure returns(uint256) {
       if (_assetToTerminate == 0 || _assetAmount == 0 || _maturedAmount == 0) return 0;
       return _assetToTerminate >= _assetAmount ?  _maturedAmount  : _maturedAmount.mul(_assetToTerminate).div(_assetAmount);
   }

   function withPremium(uint256 _baseAmount, uint256 _premimumRate) internal pure returns(uint256) {
       return  _baseAmount.mul(RATIOMULTIPLIER + _premimumRate).div(RATIOMULTIPLIER);
   }
   
   function premium(uint256 _baseAmount, uint256 _premimumRate) internal pure returns(uint256) {
       return   _baseAmount.mul(_premimumRate).div(RATIOMULTIPLIER);
   }
   
   function subOrZero(uint256 _base, uint256 _substractor) internal pure returns (uint256) {
       return _base >= _substractor ? _base - _substractor : 0;
   }
  
    /*function assertUint104(uint256 num) internal pure {
        require(num <= type(uint104).max, "Overflow uint104");
    }

    function assertUint128(uint256 num) internal pure {
        require(num <= type(uint128).max, "Overflow uint128");
    }*/

}