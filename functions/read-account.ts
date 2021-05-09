import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import { wrapper } from './lib';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const { TABLE } = process.env;

export const read: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  const { principalId: account } = event.requestContext.authorizer;

  const { Items } = await DocumentClient.query({
    TableName: TABLE,
    KeyConditionExpression: "#name1 = :value1",
    ExpressionAttributeValues: {
      ":value1": account,
    },
    ExpressionAttributeNames: {
      "#name1": "account",
    }
  }).promise();

  console.log('Items', Items);

  return Items[0] || `No data for account ${account}`;
});
