import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import { wrapper } from './lib';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const { TABLE } = process.env;

export const create: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  const { account } = JSON.parse(event.body);

  const Item = {
    account,
    createdAt: new Date().toJSON(),
  };
  await DocumentClient.put({
    TableName: TABLE,
    Item,
    ConditionExpression: 'attribute_not_exists(account)',
  }).promise();

  return `Account ${account} successfully created`;
});
