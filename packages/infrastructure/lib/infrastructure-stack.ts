/// <reference types="node" />
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table
    const table = new dynamodb.Table(this, 'AppTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes only
    });

    // 2. Cognito User Pool & Client
    const userPool = new cognito.UserPool(this, 'AppUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes only
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AppUserPoolClient', {
      userPool,
      generateSecret: false,
    });

    // 3. Lambda Backend (Hono) using NodejsFunction
    const apiLambda = new NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      // We will point this to the backend workspace output later
      entry: path.join(__dirname, '../../backend/src/index.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    table.grantReadWriteData(apiLambda);

    // 4. API Gateway REST API connected to Lambda
    const api = new apigateway.LambdaRestApi(this, 'AppApi', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Outputs for the Frontend
    new cdk.CfnOutput(this, 'ApiEndpointOutput', { value: api.url });
    new cdk.CfnOutput(this, 'UserPoolIdOutput', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'RegionOutput', { value: this.region });
  }
}
