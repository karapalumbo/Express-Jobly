const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe('sqlForPartialUpdate', function() {
  test('works', function() {
    const dataToUpdate = {
      firstName: 'Alice',
      age: 30,
    };
    const jsToSql = {
      firstName: 'first_name',
      age: 'age',
    };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["Alice", 30]);
  });

  test('bad request with no data', async function() {
    try {
      sqlForPartialUpdate({});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
