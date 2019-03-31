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
        .request('CloudFormation',
          'describeStackResources', { StackName: this.provider.naming.getStackName() })
        .then(resources => {
          const apiKeys = _(resources.StackResources)
            .filter(resource => resource.ResourceType === 'AWS::ApiGateway::ApiKey')
            .map(resource => resource.PhysicalResourceId)
            .value();
          return Promise.all(
            _.map(apiKeys, apiKey =>
              this.provider.request('APIGateway', 'getApiKey', {
                apiKey,
                includeValue: true,
              })
            )
          );
        })
        .then(apiKeys => {
          if (apiKeys && apiKeys.length) {
            info.apiKeys =
              _.map(apiKeys, apiKey =>
                _.pick(apiKey, ['name', 'value', 'description']));
          }
          return BbPromise.resolve();
        });
    }
    return BbPromise.resolve();
  },
};
