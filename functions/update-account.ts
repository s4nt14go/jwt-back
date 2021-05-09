import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import { wrapper } from './lib';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const { TABLE } = process.env;

function getUpdateExpresion(update: any) {
  let prefix = "set "
  const updateExpresion: any = {
    UpdateExpression: '',
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {}
  };
  const attributes = Object.keys(update)
  for (let i=0; i<attributes.length; i++) {
    const attribute = attributes[i]
    if (update[attribute] !== undefined) {
      updateExpresion["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute
      updateExpresion["ExpressionAttributeValues"][":" + attribute] = update[attribute]
      updateExpresion["ExpressionAttributeNames"]["#" + attribute] = attribute
      prefix = ", "
    }
  }
  return updateExpresion;
}

export const update: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  const { principalId: account } = event.requestContext.authorizer;

  const body = JSON.parse(event.body);

  const updateExpresion = getUpdateExpresion({ ...body, updatedAt: new Date().toJSON()});
  await DocumentClient.update({
    TableName: TABLE,
    Key: {
      account,
    },
    ...updateExpresion
  }).promise();
  console.log(`${account} updated with:`, body);

  return 'success';
});
