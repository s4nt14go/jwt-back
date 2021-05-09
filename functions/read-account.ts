import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import { wrapper } from './lib';

export const read: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  return 'success';
});
