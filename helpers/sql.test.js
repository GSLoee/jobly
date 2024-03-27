const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate function', () => {
  test('should generate correct SQL SET clause and values', () => {
    const dataToUpdate = {
      firstName: 'Aliya',
      age: 32
    };

    const jsToSql = {
      firstName: 'first_name' // Example mapping
    };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(setCols).toBe('"first_name"=$1, "age"=$2');
    expect(values).toEqual(['Aliya', 32]);
  });

  test('should throw a BadRequestError when no data is provided', () => {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow('No data');
  });

  test('should use original column names if no mappings are provided', () => {
    const dataToUpdate = {
      firstName: 'Aliya',
      age: 32
    };

    const { setCols } = sqlForPartialUpdate(dataToUpdate, {});
    expect(setCols).toBe('"firstName"=$1, "age"=$2');
  });

  // Add more test cases to cover edge cases, mappings, etc.
});

