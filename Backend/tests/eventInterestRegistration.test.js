const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { EventInterestRegistrationValidationSchema } = require('../validations/EventInterestRegistrationValidation');
const { MementoRegistrationValidationSchema } = require('../validations/MementoRegistrationValidation');

const validRegistration = {
  fullName: '  Alex Student  ',
  batch: '2026',
  program: 'B.Tech Computer Science',
  section: 'A',
  registrationNumber: 'CTU12345',
  interested: "Yes, I'm interested.",
};

describe('College event interest registration validation', () => {
  test('accepts and trims all required registration fields', () => {
    const { error, value } = EventInterestRegistrationValidationSchema.validate(validRegistration);

    assert.equal(error, undefined);
    assert.equal(value.fullName, 'Alex Student');
    assert.equal(value.registrationNumber, 'CTU12345');
  });

  describe('Memento registration validation', () => {
    test('accepts the requested name, registration number, and program fields', () => {
      const { error } = MementoRegistrationValidationSchema.validate({
        name: 'Alex Student',
        regNo: 'CTU12345',
        program: 'B.Tech Computer Science',
      });

      assert.equal(error, undefined);
    });

    test('requires all text fields and rejects unrelated fields', () => {
      const missingProgram = MementoRegistrationValidationSchema.validate({
        name: 'Alex Student',
        regNo: 'CTU12345',
      });
      const extraField = MementoRegistrationValidationSchema.validate({
        name: 'Alex Student',
        regNo: 'CTU12345',
        program: 'B.Tech Computer Science',
        batch: '2026',
      });

      assert.ok(missingProgram.error);
      assert.ok(extraField.error);
    });
  });

  test('requires a valid interest choice and rejects unrelated fields', () => {
    const missingChoice = EventInterestRegistrationValidationSchema.validate({
      ...validRegistration,
      interested: '',
    });
    const extraField = EventInterestRegistrationValidationSchema.validate({
      ...validRegistration,
      activity: 'Dance',
    });

    assert.ok(missingChoice.error);
    assert.ok(extraField.error);
  });
});
