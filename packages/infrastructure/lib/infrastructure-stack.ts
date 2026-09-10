/// <reference types="node" />
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as triggers from 'aws-cdk-lib/triggers';

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

    // 2. Cognito User Pool
    const userPool = new cognito.UserPool(this, 'AppUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes only
    });

    // 3. Frontend SPA Hosting (S3 + CloudFront)
    // Created before the UserPoolClient below because its Hosted UI OAuth
    // callback URLs need the CloudFront domain name.
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // Redirect 404 to index.html for SPA routing
        },
      ],
    });

    const frontendUrl = `https://${distribution.distributionDomainName}`;

    // 4. Cognito Hosted UI (domain) + App Client
    // NOTE: the domain prefix must be globally unique. Using the account ID
    // keeps this boilerplate deployable out of the box; rename it for a
    // real project (e.g. via a CDK context/env var).
    const userPoolDomain = userPool.addDomain('AppUserPoolDomain', {
      cognitoDomain: { domainPrefix: `basic-serverless-app-${this.account}` },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AppUserPoolClient', {
      userPool,
      generateSecret: false, // Required for the SPA's public-client PKCE flow
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        // localhost is included so `npm run dev:aws` can sign in against the
        // real deployed User Pool without deploying the frontend.
        callbackUrls: [`${frontendUrl}/auth/callback`, 'http://localhost:5173/auth/callback'],
        logoutUrls: [`${frontendUrl}/`, 'http://localhost:5173/'],
      },
    });

    // 5. Lambda Backend (Hono) using NodejsFunction
    const apiLambda = new NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      // We will point this to the backend workspace output later
      entry: path.join(__dirname, '../../backend/src/index.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        FRONTEND_URL: frontendUrl,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    table.grantReadWriteData(apiLambda);

    // 6. API Gateway REST API connected to Lambda
    const api = new apigateway.LambdaRestApi(this, 'AppApi', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // 7. Deploy the frontend build plus a runtime `config.json`.
    // The frontend is built *before* this stack is deployed (see root
    // `npm run deploy`), so it cannot know the API/Cognito endpoints at
    // build time. Instead it fetches `/config.json` at runtime — generated
    // here from CDK tokens that are only resolved at deploy time.
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist')),
        s3deploy.Source.jsonData('config.json', {
          apiUrl: api.url,
          region: this.region,
          userPoolId: userPool.userPoolId,
          userPoolClientId: userPoolClient.userPoolClientId,
          cognitoDomain: userPoolDomain.baseUrl(),
        }),
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'], // Invalidate cache on deploy
    });

    // 8. DB Migration / Seeder (CDK Trigger)
    // Runs automatically upon `cdk deploy` to seed the database or execute migrations.
    const seederLambda = new NodejsFunction(this, 'DbSeeder', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/seeder.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(seederLambda);

    new triggers.Trigger(this, 'SeederTrigger', {
      handler: seederLambda,
      timeout: cdk.Duration.minutes(2),
      invocationType: triggers.InvocationType.EVENT,
    });

    // Outputs for the Frontend
    new cdk.CfnOutput(this, 'ApiEndpointOutput', { value: api.url });
    new cdk.CfnOutput(this, 'UserPoolIdOutput', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'CognitoDomainOutput', { value: userPoolDomain.baseUrl() });
    new cdk.CfnOutput(this, 'RegionOutput', { value: this.region });
    new cdk.CfnOutput(this, 'FrontendUrlOutput', { value: frontendUrl });
  }
}
