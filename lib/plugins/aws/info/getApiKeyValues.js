'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  getApiKeyValues() {
    const info = this.gatheredData.info;
    info.apiKeys = [];

    // check if the user has set api keys
    const apiKeyNames = this.serverless.service.provider.apiKeys || [];

    if (apiKeyNames.length) {
      return this.provider
        .request('CloudFormation', 'describeStackResources', { StackName: this.provider.naming.getStackName() })
        .then(({ StackResources }) => {
          const apiKeys = _(StackResources)
            .filter(({ ResourceType }) => ResourceType === 'AWS::ApiGateway::ApiKey')
            .map(({ PhysicalResourceId }) => PhysicalResourceId)
            .value();
          return Promise.all(
            _.map(apiKeys, apiKey => {
              return this.provider.request('APIGateway', 'getApiKey', {
                apiKey,
                includeValue: true
              });
            })
          );
        })
        .then(apiKeys => {
          if (apiKeys && apiKeys.length) {
            // iterate over all apiKeys and push the API key info and update the info object
            apiKeys.forEach(apiKey => {
              const apiKeyInfo = {};
              apiKeyInfo.name = apiKey.name;
              apiKeyInfo.value = apiKey.value;
              info.apiKeys.push(apiKeyInfo);
            });
          }
          return BbPromise.resolve();
        });
    }
    return BbPromise.resolve();
  }
};
