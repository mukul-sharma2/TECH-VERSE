const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  createAdminToken,
  verifyAdminToken,
} = require('../controllers/AdminController');
const requireAdmin = require('../middlewares/adminAuth');
const { addGalleryImage, getGalleryImages } = require('../controllers/GalleryController');

describe('Admin Authentication & Token Mechanism', () => {
  test('createAdminToken should generate a valid HMAC-signed token for authorized email', () => {
    const email = 'techverse@ctuniversity.in';
    const token = createAdminToken(email);

    assert.ok(token, 'Token should be generated');
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 2, 'Token should have payload and signature parts');

    const verified = verifyAdminToken(token);
    assert.ok(verified, 'Token should verify successfully');
    assert.equal(verified.email, email);
    assert.equal(verified.role, 'superadmin');
    assert.ok(verified.exp > Date.now(), 'Token expiration should be in the future');
  });

  test('verifyAdminToken should reject tampered signature', () => {
    const token = createAdminToken('techverse@ctuniversity.in');
    const [payloadB64] = token.split('.');
    const tamperedToken = `${payloadB64}.tamperedSignature12345`;

    const result = verifyAdminToken(tamperedToken);
    assert.equal(result, null, 'Tampered token should return null');
  });

  test('verifyAdminToken should reject tokens for unauthorized email', () => {
    const token = createAdminToken('unauthorized@example.com');
    const result = verifyAdminToken(token);
    assert.equal(result, null, 'Tokens for unauthorized email must be rejected');
  });

  test('requireAdmin middleware should reject request when Authorization header is missing', () => {
    const req = { headers: {} };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; },
        };
      },
    };
    let nextCalled = false;

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(statusSent, 401);
    assert.equal(jsonSent.success, false);
    assert.equal(nextCalled, false);
  });

  test('requireAdmin middleware should reject request when token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid.token' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; },
        };
      },
    };
    let nextCalled = false;

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(statusSent, 401);
    assert.equal(jsonSent.success, false);
    assert.equal(nextCalled, false);
  });

  test('requireAdmin middleware should allow request with valid admin Bearer token', () => {
    const token = createAdminToken('techverse@ctuniversity.in');
    const req = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;
    const res = {};

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.ok(req.admin);
    assert.equal(req.admin.email, 'techverse@ctuniversity.in');
    assert.equal(req.admin.role, 'superadmin');
  });
});

describe('Gallery Controller & Validation', () => {
  test('addGalleryImage should reject missing category with 400', async () => {
    const req = {
      body: { name: 'Test Event' },
      file: { buffer: Buffer.from('fake image data'), mimetype: 'image/jpeg' },
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; },
        };
      },
    };

    await addGalleryImage(req, res);

    assert.equal(statusSent, 400);
    assert.equal(jsonSent.success, false);
    assert.equal(jsonSent.message, 'Category is required.');
  });

  test('addGalleryImage should reject missing image file with 400', async () => {
    const req = {
      body: { category: 'Hackathons', name: 'Test Event' },
      file: null,
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; },
        };
      },
    };

    await addGalleryImage(req, res);

    assert.equal(statusSent, 400);
    assert.equal(jsonSent.success, false);
    assert.equal(jsonSent.message, 'Image file is required.');
  });
});

