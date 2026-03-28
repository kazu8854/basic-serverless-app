/// <reference types="jest" />
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Infrastructure from '../lib/infrastructure-stack';

test('Empty Matcher', () => {
  const app = new cdk.App();
  const stack = new Infrastructure.InfrastructureStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::DynamoDB::Table', 1);
});
