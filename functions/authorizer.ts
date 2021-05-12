import njwt from 'njwt';
import { SSM } from 'aws-sdk';

const ssm = new SSM();

function getToken(event) {

  if (event.type !== 'TOKEN') {
    throw new Error('Authorizer must be of type "TOKEN"');
  }

  const { authorizationToken: bearer } = event;
  if (!bearer) {
    throw new Error(
      'Authorization header with "Bearer TOKEN" must be provided'
    );
  }

  const [, token] = bearer.match(/^Bearer (.*)$/) || [];
  if (!token) {
    throw new Error('Invalid bearer token');
  }

  return token;
}

export const authorizer = async event => {
  console.log('event:', JSON.stringify(event, null, 2));

  const stage = event.methodArn.split('/')[1];
  const Names = [
    `/jwt/${stage}/SECRET`,
  ]
  const request = await ssm.getParameters({ Names }).promise();
  const SECRET = request.Parameters.filter(p => p.Name === Names[0])[0].Value;

  try {
    const token = getToken(event);
    let verifiedData = njwt.verify(token, SECRET);
    console.log('verifiedData', JSON.stringify(verifiedData, null, 2));
    verifiedData = verifiedData.body;

    return {
      principalId: verifiedData.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      },
      // You can NOT set a JSON object or array as a valid value of any key in the context object
      // It must be either a String, Number or Boolean
      context: {
        scope: verifiedData.scope
      }
    };
  } catch (err) {
    console.log('Authorizer Error: ', err);

    // Error MUST be "Unauthorized" EXACTLY for APIG to return a 401
    throw new Error('Unauthorized');
  }
};
