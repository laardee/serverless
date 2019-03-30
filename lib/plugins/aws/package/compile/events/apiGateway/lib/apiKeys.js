'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  validateApiKeyInput(apiKey) {
    if (_.isObject(apiKey) && (!_.isNil(apiKey.name) || !_.isNil(apiKey.value))) {
      return true;
    } else if (!_.isString(apiKey)) {
      return false;
    }
    return true;
  },
  compileApiKeys() {
    if (this.serverless.service.provider.apiKeys) {
      if (!_.isArray(this.serverless.service.provider.apiKeys)) {
        throw new this.serverless.classes.Error('apiKeys property must be an array');
      }

      _.forEach(this.serverless.service.provider.apiKeys, (apiKey, i) => {
        const apiKeyNumber = i + 1;

        if (!this.validateApiKeyInput(apiKey)) {
          throw new this.serverless.classes.Error(
            'API Key must be a string or an object which contains name and/or value'
          );
        }

        const apiKeyName = _.isString(apiKey) ? apiKey : apiKey.name;
        const apiKeyValue = _.isObject(apiKey) && apiKey.value ? apiKey.value : undefined;

        const apiKeyLogicalId = this.provider.naming.getApiKeyLogicalId(apiKeyNumber);

        _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Resources, {
          [apiKeyLogicalId]: {
            Type: 'AWS::ApiGateway::ApiKey',
            Properties: {
              Enabled: true,
              Name: apiKeyName,
              Value: apiKeyValue,
              StageKeys: [
                {
                  RestApiId: this.provider.getApiGatewayRestApiId(),
                  StageName: this.provider.getStage(),
                },
              ],
            },
            DependsOn: this.apiGatewayDeploymentLogicalId,
          },
        });
      });
    }
    return BbPromise.resolve();
  },
};
