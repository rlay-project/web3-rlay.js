# web3-rlay.js - Rlay submodule and helpers for [web3.js](https://github.com/ethereum/web3.js)

## Installation

### Node.js
```bash
npm install --save @rlay/web3-rlay
```

### Yarn
```bash
yarn install @rlay/web3-rlay
```

## Usage

### Adding Rlay submodule to web3 instance

```js
var Web3 = require('web3');
var rlay = require('@rlay/web3-rlay');

var web3 = new Web3();
// for web3 1.x
rlay.extendWeb3WithRlay(web3);
// for older web3
rlay.extendWeb3OldWithRlay(web3);
```

### List the CIDs of all entities that match a certain key/value-pair

```js
const subjectCid = "0x019680031b2063a26691e5526a86348ac4706f5d2eff358d75bdd3da5040abaf30637c13ef6b";
// List all ClassAssertions about a specific subject
web3.rlay.experimentalListCidsIndex("ClassAssertion", "subject", subjectCid)
  .then(console.log);
```

### Get the entity for a CID

```js
const entityCid = "0x019680031b2063a26691e5526a86348ac4706f5d2eff358d75bdd3da5040abaf30637c13ef6b";
web3.rlay.experimentalGetEntity(entityCid)
  .then(console.log);
```

## License

Licensed under either of

  * Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
  * MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
