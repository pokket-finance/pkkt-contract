// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
library Utils { 
     
 
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
 

    /*function assertUint104(uint256 num) internal pure {
        require(num <= type(uint104).max, "Overflow uint104");
    }

    function assertUint128(uint256 num) internal pure {
        require(num <= type(uint128).max, "Overflow uint128");
    }*/

}