import axios from 'axios';
import { Chance } from 'chance';
import { load } from 'ts-dotenv';
import retry from 'async-retry';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const chance = Chance();

const env = load({
  API_URL: String,
  TABLE: String,
});

const { API_URL, TABLE } = env;

describe('When we created an account and get a token', () => {

  const account = chance.name();
  let token;

  beforeAll(async () => {

    await axios({
      method: 'post',
      url: `${API_URL}/create-account`,
      data: JSON.stringify({
        account,
      }),
    });

    const { data } = await axios({
      method: 'post',
      url: `${API_URL}/get-token`,
      data: JSON.stringify({
        account,
      })
    });

    token = data;
  })

  it(`updates account and read back updated values`, async () => {

    const country = chance.country({ full: true });

    await axios( {
      method: 'post',
      url: `${API_URL}/update-account`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        country,
      }),
    });

    await retry(async (bail, attempt) => {
      const read = await axios({
        method: 'get',
        url: `${API_URL}/read-account`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(read.data).toEqual(expect.objectContaining({
        country,
      }));
      console.log(`updates attempt: ${attempt}`);
    }, {
      retries: 2,
    })
  });

  it(`returns 401 when trying to read account without token`, async () => {
    try {
      await axios({
        method: 'get',
        url: `${API_URL}/read-account`,
      });
      throw new Error(`Throw error in case previous get doesn't error, so we force expect is always assessed in catch block`);
    } catch (e) {
      expect(e.response.status).toEqual(401)
    }
  });

  it(`returns 401 when trying to update account without token`, async () => {
    try {
      const country = chance.country({ full: true });

      await axios( {
        method: 'post',
        url: `${API_URL}/update-account`,
        data: JSON.stringify({
          country,
        }),
      });
      throw new Error(`Throw error in case previous post doesn't error, so we force expect is always assessed in catch block`);
    } catch (e) {
      expect(e.response.status).toEqual(401)
    }
  });

  afterAll(async () => {
    await DocumentClient.delete({
      TableName: TABLE,
      Key: {
        account,
      },
    }).promise();
  })

});
