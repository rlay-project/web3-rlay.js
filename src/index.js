const ethers = require('ethers');
const cbor = require('cbor');
const ontologyContractJson = require('./OntologyStorage.json');
const propositionLedgerContractJson = require('./PropositionLedger.json');
const tokenContractJson = require('./RlayToken.json');
const builtins = require('./builtins.json');

const buildEthersInterfaceOntologyStorage = () => {
  const abi = ontologyContractJson.abi;
  const contract = new ethers.Interface(abi);

  return contract;
};

const buildEthersInterfacePropositionLedger = () => {
  const abi = propositionLedgerContractJson.abi;
  const contract = new ethers.Interface(abi);

  return contract;
};

const buildEthersInterfaceRlayToken = () => {
  const abi = tokenContractJson.abi;
  const contract = new ethers.Interface(abi);

  return contract;
};

const ethersInterfaceOntologyStorage = buildEthersInterfaceOntologyStorage();
const ethersInterfacePropositionLedger = buildEthersInterfacePropositionLedger();
const ethersInterfaceRlayToken = buildEthersInterfaceRlayToken();

const formatOutputGetPropostionPools = (web3, pool) => {
  const toBN = web3.toBigNubmer || web3.utils.toBN;
  const formatAssertion = (assertion) => ({
    ...assertion,
    totalWeight: toBN(assertion.totalWeight),
  })

  const formatPool = (pool) => {
    pool.aggregatedValue = pool.aggregatedValue ? formatAssertion(pool.aggregatedValue) : null;
    pool.canonicalNegativeValue = formatAssertion(pool.canonicalNegativeValue);
    pool.canonicalPositiveValue = formatAssertion(pool.canonicalPositiveValue);

    pool.values = pool.values.map(formatAssertion);
    pool.positiveValues = pool.positiveValues.map(formatAssertion);
    pool.negativeValues = pool.negativeValues.map(formatAssertion);

    pool.totalWeight = toBN(pool.totalWeight);
    pool.totalWeightAggregationResult = pool.totalWeightAggregationResult ? toBN(pool.totalWeightAggregationResult) : null;
    pool.totalWeightNegative = toBN(pool.totalWeightNegative);
    pool.totalWeightPositive = toBN(pool.totalWeightPositive);

    return pool;
  };

  return formatPool(pool);
};

const formatInputEntity = (web3, entity) => {
    const newEntity = web3.utils._.mapObject(entity, (val, key) => {
      if (key === 'type') {
        return val;
      }
      if (Array.isArray(val)) {
        return val.map(ethers.utils.hexlify);
      } else {
        return ethers.utils.hexlify(val);
      }
    });
    return newEntity;
};

// Extend web3 0.20.x with custom Rlay RPC methods.
const extendWeb3OldWithRlay = web3 => {
  web3._extend({
    property: 'rlay',
    methods: [
      new web3._extend.Method({
        name: 'version',
        call: 'rlay_version',
      }),
      new web3._extend.Method({
        name: 'getPropositionPools',
        call: 'rlay_getPropositionPools',
        params: 1,
        outputFormatter: (pools) => formatOutputGetPropostionPools(web3, pools),
      }),
      new web3._extend.Method({
        name: 'experimentalKindForCid',
        call: 'rlay_experimentalKindForCid',
        params: 1,
      }),
      new web3._extend.Method({
        name: 'experimentalListCids',
        call: 'rlay_experimentalListCids',
        params: 1,
      }),
      new web3._extend.Method({
        name: 'experimentalListCidsIndex',
        call: 'rlay_experimentalListCidsIndex',
        params: 3,
      }),
      new web3._extend.Method({
        name: 'experimentalGetEntity',
        call: 'rlay_experimentalGetEntity',
        params: 2,
      }),
      new web3._extend.Method({
        name: 'experimentalGetEntityCid',
        call: 'rlay_experimentalGetEntityCid',
        params: 1,
        inputFormatter: [(entity) => formatInputEntity(web3, entity)],
      }),
      new web3._extend.Method({
        name: 'experimentalStoreEntity',
        call: 'rlay_experimentalStoreEntity',
        params: 2,
        inputFormatter: [(entity) => formatInputEntity(web3, entity), null],
      }),
    ],
  });
};

// Extend web 1.0.x with custom Rlay RPC methods.
const extendWeb3WithRlay = web3 => {
  web3.extend({
    property: 'rlay',
    methods: [
      {
        name: 'version',
        call: 'rlay_version',
      },
      {
        name: 'getPropositionPools',
        call: 'rlay_getPropositionPools',
        params: 1,
        outputFormatter: (pools) => formatOutputGetPropostionPools(web3, pools),
      },
      {
        name: 'experimentalKindForCid',
        call: 'rlay_experimentalKindForCid',
        params: 1,
      },
      {
        name: 'experimentalListCids',
        call: 'rlay_experimentalListCids',
        params: 1,
      },
      {
        name: 'experimentalListCidsIndex',
        call: 'rlay_experimentalListCidsIndex',
        params: 3,
      },
      {
        name: 'experimentalGetEntity',
        call: 'rlay_experimentalGetEntity',
        params: 2,
      },
      {
        name: 'experimentalGetEntityCid',
        call: 'rlay_experimentalGetEntityCid',
        params: 1,
        inputFormatter: [(entity) => formatInputEntity(web3, entity)],
      },
      {
        name: 'experimentalStoreEntity',
        call: 'rlay_experimentalStoreEntity',
        params: 2,
        inputFormatter: [(entity) => formatInputEntity(web3, entity), null],
      },
    ],
  });
};

const store = (web3, entity, options) => {
  const iface = ethersInterfaceOntologyStorage;

  const storeFnName = `store${entity.type}`;
  const contractFn = iface.functions[storeFnName];

  if (options.backend) {
    return web3.rlay.experimentalStoreEntity(entity, { backend: options.backend });
  }

  return web3.rlay
    .version()
    .then(version => version.contractAddresses.OntologyStorage)
    .then(ontologyAddress => {
      const data = encodeForStore(entity);

      return web3.eth.sendTransaction({
        to: ontologyAddress,
        data,
        ...options,
      });
    })
    .then(storeTx => contractFn.parseResult(storeTx.logs[0].data)[0]);
};

const retrieve = (web3, cid, options) => {
  const iface = ethersInterfaceOntologyStorage;

  return web3.rlay.experimentalGetEntity(cid).then((entity) => {
    if (entity) {
      return Promise.resolve(entity);
    }
    const ontologyAddress = web3.rlay
      .version()
      .then(version => version.contractAddresses.OntologyStorage);
    const entityKind = web3.rlay
      .experimentalKindForCid(cid)
      .then(res => res.kind);

    return Promise.all([ontologyAddress, entityKind]).then(
      ([ontologyAddress, entityKind]) => {
        const data = encodeForRetrieve(entityKind, cid);

        return web3.eth
          .call({
            to: ontologyAddress,
            data,
            ...options,
          })
          .then(callResponseData =>
            decodeFromRetrieve(entityKind, callResponseData),
          );
      },
    );
  })
};

const setAllowance = (web3, weight, options) => {
  const tokenInterface = ethersInterfaceRlayToken;

  const contractAddresses = web3.rlay
    .version()
    .then(version => version.contractAddresses);

  return contractAddresses.then(contractAddresses => {
    const approveFn = tokenInterface.functions['approve'];
    const approveEncoded = approveFn(
      contractAddresses.PropositionLedger,
      weight,
    ).data;

    return web3.eth
        .sendTransaction({
          to: contractAddresses.RlayToken,
          data: approveEncoded,
          ...options,
        });
  });
};

const addWeight = (web3, cid, weight, options) => {
  const iface = ethersInterfacePropositionLedger;

  const doSetAllowance = options.setAllowance;
  delete options.setAllowance;

  const contractAddresses = web3.rlay
    .version()
    .then(version => version.contractAddresses);

  return contractAddresses.then(contractAddresses => {
    const submitPropositionFn = iface.functions['submitProposition'];
    const submitPropositionEncoded = submitPropositionFn(cid, weight).data;

    let approvePr;
    if (doSetAllowance) {
      approvePr = setAllowance(web3, weight, options);
    } else {
      approvePr = Promise.resolve(null);
    }

    return approvePr
      .then(() =>
        web3.eth.sendTransaction({
          to: contractAddresses.PropositionLedger,
          data: submitPropositionEncoded,
          ...options,
        }),
      );
  });
};

const encodeForStore = entity => {
  const iface = ethersInterfaceOntologyStorage;

  const storeFnName = `store${entity.type}`;
  const contractFn = iface.functions[storeFnName];

  const params = [];
  contractFn.inputs.names.forEach((paramName, paramIdx) => {
    const paramType = contractFn.inputs.types[paramIdx];
    let nullValue = '0x';
    if (paramType.endsWith('[]')) {
      nullValue = [];
    }

    params.push(
      entity[paramName] || entity[paramName.replace('_', '')] || nullValue,
    );
  });
  const encoded = contractFn(...params);

  return encoded.data;
};

const encodeForRetrieve = (entityKind, cid) => {
  const iface = ethersInterfaceOntologyStorage;

  const storeFnName = `retrieve${entityKind}`;
  const contractFn = iface.functions[storeFnName];
  return contractFn(cid).data;
};

const decodeFromRetrieve = (entityKind, responseData) => {
  const iface = ethersInterfaceOntologyStorage;

  const storeFnName = `retrieve${entityKind}`;
  const contractFn = iface.functions[storeFnName];

  const parsed = contractFn.parseResult(responseData);

  const entity = { type: entityKind };
  contractFn.outputs.names.forEach(paramName => {
    let parsedValue = parsed[paramName];
    if (Array.isArray(parsedValue)) {
      parsedValue = new Array(...parsedValue);
    }
    entity[paramName.replace('_', '')] = parsedValue;
  });

  return entity;
};

const encodeValue = val => cbor.encode(val);

const decodeValue = encoded =>
  cbor.decodeFirstSync(encoded.substring(2, encoded.length));

module.exports = {
  store,
  retrieve,
  setAllowance,
  addWeight,

  encodeValue,
  decodeValue,

  encodeForStore,
  extendWeb3WithRlay,
  extendWeb3OldWithRlay,

  builtins,
};
