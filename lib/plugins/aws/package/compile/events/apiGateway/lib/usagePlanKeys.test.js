'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const AwsCompileApigEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');
const AwsProvider = require('../../../../../provider/awsProvider');

describe('#compileUsagePlanKeys()', () => {
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
    awsCompileApigEvents.apiGatewayUsagePlanLogicalId = 'UsagePlan';
  });

  it('should compile usage plan key resource', () =>
    awsCompileApigEvents.compileUsagePlanKeys().then(() => {
      _.forEach(
        _.values(awsCompileApigEvents
          .serverless.service.provider.compiledCloudFormationTemplate.Resources),
        (resource, index) => {
          expect(resource.Type).to.equal('AWS::ApiGateway::UsagePlanKey');

          expect(resource.Properties.KeyId.Ref).to.equal(`ApiGatewayApiKey${index + 1}`);

          expect(resource.Properties.KeyType).to.equal('API_KEY');

          expect(resource.Properties.UsagePlanId.Ref).to.equal('UsagePlan');
        }
      );
    }));

  it('throw error if apiKey property is not an array', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = 2;
    expect(() => awsCompileApigEvents.compileUsagePlanKeys()).to.throw(Error);
  });

  it('throw error if an apiKey is not a string', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = [2];
    expect(() => awsCompileApigEvents.compileUsagePlanKeys()).to.throw(Error);
  });
});
