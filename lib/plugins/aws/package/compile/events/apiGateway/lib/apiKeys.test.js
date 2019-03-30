'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const AwsCompileApigEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');
const AwsProvider = require('../../../../../provider/awsProvider');

describe('#compileApiKeys()', () => {
  let serverless;
  let awsCompileApigEvents;

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    serverless = new Serverless();
    serverless.setProvider('aws', new AwsProvider(serverless, options));
    serverless.service.service = 'first-service';
    serverless.service.provider = {
      name: 'aws',
      apiKeys: [
        '1234567890',
        { name: '2345678901' },
        { value: 'valueForKeyWithoutName' },
        { name: '3456789012', value: 'valueForKey3456789012' },
      ],
    };
    serverless.service.provider.compiledCloudFormationTemplate = {
      Resources: {},
      Outputs: {},
    };
    awsCompileApigEvents = new AwsCompileApigEvents(serverless, options);
    awsCompileApigEvents.apiGatewayRestApiLogicalId = 'ApiGatewayRestApi';
    awsCompileApigEvents.apiGatewayDeploymentLogicalId = 'ApiGatewayDeploymentTest';
  });

  it('should compile api key resource', () =>
    awsCompileApigEvents.compileApiKeys().then(() => {
      const apiKeys = [
        { name: '1234567890', value: undefined },
        { name: '2345678901', value: undefined },
        { name: undefined, value: 'valueForKeyWithoutName' },
        { name: '3456789012', value: 'valueForKey3456789012' },
      ];

      _.map(apiKeys, ({ name, value }, index) => {
        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Type
        ).to.equal('AWS::ApiGateway::ApiKey');

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Properties.Enabled
        ).to.equal(true);

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Properties.Name
        ).to.equal(name);

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Properties.Value
        ).to.equal(value);

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Properties.StageKeys[0].RestApiId.Ref
        ).to.equal('ApiGatewayRestApi');

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].Properties.StageKeys[0].StageName
        ).to.equal('dev');

        expect(
          awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources[
            awsCompileApigEvents.provider.naming.getApiKeyLogicalId(index + 1)
          ].DependsOn
        ).to.equal('ApiGatewayDeploymentTest');
      });
    }));

  it('throw error if apiKey property is not an array', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = 2;
    expect(() => awsCompileApigEvents.compileApiKeys()).to.throw(Error);
  });

  it('throw error if an apiKey is not a string', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = [2];
    expect(() => awsCompileApigEvents.compileApiKeys()).to.throw(Error);
  });

  it('throw error if an apiKey is not a valid object', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = [{
      named: 'invalid',
    }];
    expect(() => awsCompileApigEvents.compileApiKeys()).to.throw(Error);
  });
});
