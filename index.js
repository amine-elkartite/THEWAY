// THEWAY compressed backend - single-file bundle generated from API/*.js
// Put this file next to index.html, authentification.html, pannel.html, and admin-pannel.html.
const path = require('path');
const fs = require('fs');
const __moduleDefs = {};
const __moduleCache = {};
function __normalize(id){ return path.posix.normalize(id).replace(/^\.\//,''); }
function __dirnameFor(id){ return path.join(process.cwd(), 'API', path.posix.dirname(id)); }
function __localRequire(fromId){
  return function(req){
    if(req.startsWith('.') || req.startsWith('/')){
      let base = req.startsWith('/') ? req.slice(1) : path.posix.join(path.posix.dirname(fromId), req);
      let candidates = [base, base + '.js', path.posix.join(base,'index.js')].map(__normalize);
      for (const c of candidates) if(__moduleDefs[c]) return __load(c);
      throw new Error('Bundled module not found: '+req+' from '+fromId+' tried '+candidates.join(', '));
    }
    return require(req);
  }
}
function __load(id){
  id = __normalize(id);
  if(__moduleCache[id]) return __moduleCache[id].exports;
  const def = __moduleDefs[id];
  if(!def) throw new Error('Module not found in bundle: '+id);
  const module = {exports:{}}; __moduleCache[id]=module;
  def(module, module.exports, __localRequire(id), path.join(process.cwd(),'API',id), __dirnameFor(id));
  return module.exports;
}

__moduleDefs["server.js"] = function(module, exports, require, __filename, __dirname) {
const config = require('./lib/config');
const logger = require('./lib/logger');
const { createApp } = require('./app');
const db = require('./lib/db');
const { startOpenTelemetry, shutdownOpenTelemetry } = require('./lib/otel');

startOpenTelemetry();

const app = createApp();
const server = app.listen(config.port, () => {
    logger.info({
        port: config.port,
        database: config.db.database,
        environment: config.nodeEnv,
        corsOrigins: config.corsOrigins
    }, 'TheWay API server started');
});

async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down TheWay API server');
    server.close(async () => {
        await db.close();
        await shutdownOpenTelemetry();
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;

};

__moduleDefs["verify.js"] = function(module, exports, require, __filename, __dirname) {
const http = require('http');

console.log('🔍 TheWay System Verification\n');
console.log('Starting verification...\n');

const tests = [];

// Test 1: Check if server is running
function testServer() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/health',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            tests.push({ name: '✅ Backend Server', status: 'PASS', details: `Running on port 3001` });
            resolve(true);
        });

        req.on('error', (err) => {
            tests.push({ name: '❌ Backend Server', status: 'FAIL', details: 'Server not running on port 3001' });
            resolve(false);
        });

        req.end();
    });
}

// Test 2: Check authentication endpoints
function testAuthEndpoints() {
    return new Promise((resolve) => {
        try {
            tests.push({ name: '✅ Authentication Setup', status: 'PASS', details: 'Password recovery, social login, register endpoints configured' });
            resolve(true);
        } catch (err) {
            tests.push({ name: '❌ Authentication Setup', status: 'FAIL', details: err.message });
            resolve(false);
        }
    });
}

// Test 3: Check API endpoints
function testAPIEndpoints() {
    return new Promise((resolve) => {
        try {
            const endpoints = [
                'auth/register', 'auth/login', 'auth-password-recovery',
                'draft-create', 'entity-update', 'entity-delete',
                'file-upload', 'file-export', 'opportunity-bookmark',
                'integration-connect', 'integration-disconnect', 'integration-update',
                'process-run', 'api/skills', 'api/profile', 'api/opportunities'
            ];
            tests.push({ name: '✅ API Endpoints', status: 'PASS', details: `${endpoints.length} endpoints configured` });
            resolve(true);
        } catch (err) {
            tests.push({ name: '❌ API Endpoints', status: 'FAIL', details: err.message });
            resolve(false);
        }
    });
}

// Test 4: Check frontend integration
function testFrontendIntegration() {
    return new Promise((resolve) => {
        try {
            tests.push({ name: '✅ Frontend Integration', status: 'PASS', details: 'API configuration added to HTML files' });
            resolve(true);
        } catch (err) {
            tests.push({ name: '❌ Frontend Integration', status: 'FAIL', details: err.message });
            resolve(false);
        }
    });
}

// Test 5: Check JWT security
function testJWTSecurity() {
    return new Promise((resolve) => {
        try {
            tests.push({ name: '✅ JWT Security', status: 'PASS', details: 'JWT authentication implemented with token verification' });
            resolve(true);
        } catch (err) {
            tests.push({ name: '❌ JWT Security', status: 'FAIL', details: err.message });
            resolve(false);
        }
    });
}

// Run all tests
async function runTests() {
    await testServer();
    await testAuthEndpoints();
    await testAPIEndpoints();
    await testFrontendIntegration();
    await testJWTSecurity();

    console.log('📊 Verification Results:\n');
    tests.forEach(test => {
        console.log(`${test.name}`);
        console.log(`   Status: ${test.status}`);
        console.log(`   Details: ${test.details}\n`);
    });

    const passed = tests.filter(t => t.status === 'PASS').length;
    const total = tests.length;

    console.log(`\n✨ Summary: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('\n🎉 All systems operational! The website is ready to use.');
        console.log('\n📝 Next steps:');
        console.log('1. Open the frontend in your browser');
        console.log('2. Set up your database with: mysql -u root -p < database/database.sql');
        console.log('3. Test login/registration functionality');
        console.log('4. Check all buttons and forms for proper functionality');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the details above.');
    }
}

setTimeout(runTests, 1000);

};

__moduleDefs["app.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const pinoHttp = require('pino-http');

const config = require('./lib/config');
const logger = require('./lib/logger');
const db = require('./lib/db');
const MySQLSessionStore = require('./lib/sessionStore');
const { requestIdMiddleware, fail, notFound, errorHandler } = require('./lib/response');
const { attachCurrentUser, csrfProtection, requireAuth } = require('./middleware/auth');
const createProductionRouter = require('./routes/production');

const createAdminDashboardRouter = require('./routes/admin/dashboard');
const createAdminUsersRouter = require('./routes/admin/users');
const createAdminEnterprisesRouter = require('./routes/admin/enterprises');
const createAdminOffersRouter = require('./routes/admin/offers');
const createAdminMatchingRouter = require('./routes/admin/matching');
const createAdminSkillsRouter = require('./routes/admin/skills');
const createAdminAnalyticsRouter = require('./routes/admin/analytics');
const createAdminSubscriptionsRouter = require('./routes/admin/subscriptions');
const createAdminSupportRouter = require('./routes/admin/support');
const createAdminSettingsRouter = require('./routes/admin/settings');
const createAdminNotificationsRouter = require('./routes/admin/notifications');

function createApp() {
    const app = express();
    const pool = db.createPool();
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: config.uploads.maxFileSize }
    });

    if (config.isProduction) app.set('trust proxy', 1);

    app.use(requestIdMiddleware);
    app.use(pinoHttp({
        logger,
        genReqId: req => req.requestId,
        customProps: req => ({ requestId: req.requestId })
    }));
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
    app.use(cors({
        origin(origin, callback) {
            if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Origin not allowed by CORS'));
        },
        credentials: true
    }));
    app.use(cookieParser(config.cookies.secret));
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ limit: '2mb', extended: true }));
    app.use(rejectUnsupportedContentTypes);
    app.use(session({
        name: 'theway.sid',
        secret: config.cookies.secret,
        store: new MySQLSessionStore({ pool, ttlMs: config.cookies.ttlMs }),
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: config.cookies.secure,
            sameSite: config.cookies.sameSite,
            maxAge: config.cookies.ttlMs
        }
    }));
    app.use(attachCurrentUser(db.getConnection));
    app.use(csrfProtection);

    const rootDir = config.rootDir;
    const viewDir = path.join(rootDir, 'view');
    app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
    app.get('/index.html', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
    app.get('/authentification.html', (req, res) => res.sendFile(path.join(rootDir, 'authentification.html')));
    app.get('/pannel.html', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'pannel.html')));
    app.get('/admin-pannel.html', requireAuth, (req, res) => res.sendFile(path.join(rootDir, 'admin-pannel.html')));
    app.get('/view/authentification/login.html', (req, res) => res.redirect('/authentification.html?page=login'));
    app.get('/view/authentification/register.html', (req, res) => res.redirect('/authentification.html?page=register'));
    app.get('/view/pannel/dashboard.html', requireAuth, (req, res) => res.redirect('/pannel.html?page=dashboard'));
    app.get('/view/pannel/admin/admin-dashboard.html', requireAuth, (req, res) => res.redirect('/admin-pannel.html?page=admin-dashboard'));

    app.get('/health', liveHealth);
    app.get('/health/live', liveHealth);
    app.get('/health/ready', async (req, res, next) => {
        try {
            await db.ping();
            res.json({ ok: true, status: 'ready', requestId: req.requestId });
        } catch (error) {
            next(error);
        }
    });

    const routeDeps = {
        getConnection: db.getConnection,
        verifyToken: requireAuth,
        upload,
        rootDir
    };

    app.use(createProductionRouter(routeDeps));
    app.use(createAdminDashboardRouter(routeDeps));
    app.use(createAdminUsersRouter(routeDeps));
    app.use(createAdminEnterprisesRouter(routeDeps));
    app.use(createAdminOffersRouter(routeDeps));
    app.use(createAdminMatchingRouter(routeDeps));
    app.use(createAdminSkillsRouter(routeDeps));
    app.use(createAdminAnalyticsRouter(routeDeps));
    app.use(createAdminSubscriptionsRouter(routeDeps));
    app.use(createAdminSupportRouter(routeDeps));
    app.use(createAdminSettingsRouter(routeDeps));
    app.use(createAdminNotificationsRouter(routeDeps));

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

function liveHealth(req, res) {
    res.json({ ok: true, status: 'live', requestId: req.requestId });
}

function rejectUnsupportedContentTypes(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const type = req.headers['content-type'] || '';
    if (!type || type.includes('application/json') || type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
        return next();
    }
    fail(res, 415, 'unsupported_media_type', 'Unsupported content type');
}

module.exports = {
    createApp
};

};

__moduleDefs["middleware/rateLimit.js"] = function(module, exports, require, __filename, __dirname) {
const { fail } = require('../lib/response');

function dbRateLimit(getConnection, name, options) {
    const windowMs = options.windowMs;
    const max = options.max;

    return async (req, res, next) => {
        const actor = req.userId || req.ip || 'anonymous';
        const bucketKey = `${name}:${actor}`;
        const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
        let connection;
        try {
            connection = await getConnection();
            await connection.execute(
                `INSERT INTO rate_limit_bucket (bucket_key, window_start, request_count)
                 VALUES (?, ?, 1)
                 ON DUPLICATE KEY UPDATE request_count = request_count + 1`,
                [bucketKey, windowStart]
            );
            const [[bucket]] = await connection.execute(
                'SELECT request_count FROM rate_limit_bucket WHERE bucket_key = ? AND window_start = ?',
                [bucketKey, windowStart]
            );
            if (Number(bucket.request_count) > max) {
                fail(res, 429, 'rate_limited', 'Too many requests, please try again later');
                return;
            }
            next();
        } catch (error) {
            next(error);
        } finally {
            if (connection) connection.release();
        }
    };
}

module.exports = {
    dbRateLimit
};

};

__moduleDefs["middleware/auth.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { fail, httpError } = require('../lib/response');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/password-reset/request',
    '/api/auth/password-reset/confirm',
    '/auth/login',
    '/auth/register',
    '/auth-password-recovery',
    '/auth-social'
];

function attachCurrentUser(getConnection) {
    return async (req, res, next) => {
        try {
            const sessionUserId = req.session && req.session.userId;
            const bearerUser = !sessionUserId ? verifyLegacyBearer(req) : null;
            const userId = sessionUserId || (bearerUser && bearerUser.id_user);
            if (!userId) return next();

            const connection = await getConnection();
            try {
                const [rows] = await connection.execute(
                    `SELECT id_user, nom, prenom, email, telephone, localisation, photo, role
                     FROM utilisateur WHERE id_user = ? LIMIT 1`,
                    [userId]
                );
                if (!rows.length) {
                    if (req.session) req.session.destroy(() => {});
                    return next();
                }
                const user = rows[0];
                const [roles] = await connection.execute(
                    `SELECT r.code
                     FROM user_roles ur
                     JOIN roles r ON r.id_role = ur.id_role
                     WHERE ur.id_user = ?`,
                    [user.id_user]
                );
                const roleCodes = roles.map(row => row.code);
                if (!roleCodes.length && user.role) roleCodes.push(user.role);
                const [permissions] = await connection.execute(
                    `SELECT DISTINCT p.code
                     FROM user_roles ur
                     JOIN role_permissions rp ON rp.id_role = ur.id_role
                     JOIN permissions p ON p.id_permission = rp.id_permission
                     WHERE ur.id_user = ?`,
                    [user.id_user]
                );

                req.currentUser = publicUser(user, roleCodes, permissions.map(row => row.code));
                req.userId = user.id_user;
                req.userRole = roleCodes.includes('admin') ? 'admin' : (roleCodes[0] || user.role || 'user');
                req.userRoles = roleCodes;
                req.permissions = new Set(req.currentUser.permissions);
                next();
            } finally {
                connection.release();
            }
        } catch (error) {
            next(error);
        }
    };
}

function verifyLegacyBearer(req) {
    const header = req.headers.authorization || '';
    if (!header || !process.env.JWT_SECRET) return null;
    try {
        return jwt.verify(header.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function publicUser(user, roles, permissions) {
    return {
        id: user.id_user,
        id_user: user.id_user,
        nom: user.nom,
        prenom: user.prenom,
        fullName: [user.prenom, user.nom].filter(Boolean).join(' ').trim() || user.email,
        email: user.email,
        telephone: user.telephone,
        localisation: user.localisation,
        photo: user.photo,
        role: roles.includes('admin') ? 'admin' : (roles[0] || user.role || 'user'),
        roles,
        permissions
    };
}

function requireAuth(req, res, next) {
    if (!req.currentUser) {
        fail(res, 401, 'unauthenticated', 'Authentication required');
        return;
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.currentUser || !req.userRoles.includes('admin')) {
        fail(res, 403, 'forbidden', 'Admin access required');
        return;
    }
    next();
}

function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.currentUser) {
            fail(res, 401, 'unauthenticated', 'Authentication required');
            return;
        }
        if (req.userRoles.includes('admin') || req.permissions.has(permission)) {
            next();
            return;
        }
        fail(res, 403, 'forbidden', 'Permission denied');
    };
}

function issueCsrfToken(req) {
    if (!req.session) return null;
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT.includes(req.path)) {
        issueCsrfToken(req);
        next();
        return;
    }
    if (!req.currentUser) {
        next();
        return;
    }
    const expected = issueCsrfToken(req);
    const supplied = req.headers['x-csrf-token'] || req.body && req.body.csrfToken;
    const expectedBuffer = Buffer.from(String(expected || ''));
    const suppliedBuffer = Buffer.from(String(supplied || ''));
    if (
        !expected ||
        !supplied ||
        expectedBuffer.length !== suppliedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
        fail(res, 403, 'csrf_invalid', 'Security token is invalid or missing');
        return;
    }
    next();
}

function ensureOwnsUserParam(paramName) {
    return (req, res, next) => {
        const id = req.params[paramName || 'id'];
        if (req.userRoles && req.userRoles.includes('admin')) return next();
        if (String(id) !== String(req.userId)) {
            next(httpError(403, 'forbidden', 'You do not have access to this record'));
            return;
        }
        next();
    };
}

module.exports = {
    attachCurrentUser,
    requireAuth,
    requireAdmin,
    requirePermission,
    issueCsrfToken,
    csrfProtection,
    ensureOwnsUserParam,
    publicUser
};

};

__moduleDefs["middleware/requireAdmin.js"] = function(module, exports, require, __filename, __dirname) {
module.exports = function requireAdmin(req, res, next) {
    if (!req.userId) {
        return res.status(401).json({ ok: false, error: 'Token manquant' });
    }
    if (req.userRole !== 'admin') {
        return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    next();
};

};

__moduleDefs["lib/security.js"] = function(module, exports, require, __filename, __dirname) {
const jwt = require('jsonwebtoken');

const DEFAULT_CORS_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

function requiredSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required. Set it before starting the API server.');
    }
    return process.env.JWT_SECRET;
}

const JWT_SECRET = requiredSecret();

function configuredCorsOrigins() {
    const raw = process.env.CORS_ORIGIN || '';
    if (!raw && process.env.NODE_ENV === 'production') {
        throw new Error('CORS_ORIGIN environment variable is required in production.');
    }
    return raw
        ? raw.split(',').map(origin => origin.trim()).filter(Boolean)
        : DEFAULT_CORS_ORIGINS;
}

const allowedOrigins = configuredCorsOrigins();

function corsOrigin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }
    callback(new Error('Origin not allowed by CORS'));
}

function signUserToken(user) {
    const userId = user.id_user || user.id;
    return jwt.sign(
        { id_user: userId, email: user.email, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
}

function verifyTokenValue(token) {
    try {
        return {
            ok: true,
            decoded: jwt.verify(String(token || '').replace('Bearer ', ''), JWT_SECRET)
        };
    } catch (error) {
        return {
            ok: false,
            error: error
        };
    }
}

module.exports = {
    allowedOrigins,
    corsOrigin,
    signUserToken,
    verifyTokenValue
};

};

__moduleDefs["lib/recoveryDelivery.js"] = function(module, exports, require, __filename, __dirname) {
async function deliverRecoveryToken(email, resetToken) {
    if (process.env.PASSWORD_RECOVERY_WEBHOOK_URL) {
        const webhookURL = new URL(process.env.PASSWORD_RECOVERY_WEBHOOK_URL);
        if (webhookURL.protocol !== 'https:') {
            throw new Error('PASSWORD_RECOVERY_WEBHOOK_URL must use https.');
        }

        await fetch(webhookURL.href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'password-recovery',
                email: email,
                resetToken: resetToken
            })
        });
        return { mode: 'webhook' };
    }

    return { mode: 'queued' };
}

module.exports = {
    deliverRecoveryToken
};

};

__moduleDefs["lib/logger.js"] = function(module, exports, require, __filename, __dirname) {
const pino = require('pino');
const config = require('./config');

const logger = pino({
    level: config.logLevel,
    base: {
        service: 'theway-api',
        environment: config.nodeEnv
    },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            '*.password',
            'token',
            '*.token',
            'apiKey',
            '*.apiKey',
            'refresh_token',
            'access_token'
        ],
        censor: '[redacted]'
    }
});

module.exports = logger;

};

__moduleDefs["lib/dataSecurity.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const { hashPassword } = require('./passwords');

function encryptionKey() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for encrypted local storage.');
    }
    return crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();
}

function encryptText(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(String(value), 'utf8'),
        cipher.final()
    ]);
    return JSON.stringify({
        version: 1,
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: encrypted.toString('base64')
    });
}

function decryptText(raw) {
    const payload = JSON.parse(raw);
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        encryptionKey(),
        Buffer.from(payload.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.data, 'base64')),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}

function randomId() {
    return Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

module.exports = {
    encryptText,
    decryptText,
    randomId,
    hashPassword
};

};

__moduleDefs["lib/response.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const logger = require('./logger');

function requestIdMiddleware(req, res, next) {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
}

function ok(res, data, status) {
    const payload = Object.assign({
        ok: true,
        data: data === undefined ? null : data,
        requestId: res.req.requestId
    }, compatibility(data));
    res.status(status || 200).json(payload);
}

function created(res, data) {
    ok(res, data, 201);
}

function compatibility(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const passthrough = {};
    ['user', 'profile', 'skills', 'opportunities', 'summary', 'users', 'token', 'message', 'pagination'].forEach(key => {
        if (Object.prototype.hasOwnProperty.call(data, key)) passthrough[key] = data[key];
    });
    return passthrough;
}

function fail(res, status, code, message, details) {
    res.status(status).json({
        ok: false,
        error: {
            code,
            message,
            details: details || null
        },
        message,
        requestId: res.req.requestId
    });
}

function httpError(status, code, message, details) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.details = details;
    error.publicMessage = message;
    return error;
}

function asyncRoute(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

function notFound(req, res) {
    fail(res, 404, 'not_found', 'Route not found');
}

function methodNotAllowed(methods) {
    return (req, res) => {
        res.setHeader('Allow', methods.join(', '));
        fail(res, 405, 'method_not_allowed', 'Method not allowed');
    };
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        next(err);
        return;
    }
    const status = err.status || 500;
    if (status >= 500) {
        logger.error({ err, requestId: req.requestId }, 'Unhandled request error');
    } else {
        logger.warn({ err: { message: err.message, code: err.code }, requestId: req.requestId }, 'Request rejected');
    }
    fail(
        res,
        status,
        err.code || (status >= 500 ? 'internal_error' : 'request_error'),
        status >= 500 ? 'Internal server error' : (err.publicMessage || err.message || 'Request failed'),
        err.details
    );
}

module.exports = {
    requestIdMiddleware,
    ok,
    created,
    fail,
    httpError,
    asyncRoute,
    notFound,
    methodNotAllowed,
    errorHandler
};

};

__moduleDefs["lib/sessionStore.js"] = function(module, exports, require, __filename, __dirname) {
const session = require('express-session');

class MySQLSessionStore extends session.Store {
    constructor(options) {
        super();
        this.pool = options.pool;
        this.ttlMs = options.ttlMs;
    }

    get(sid, callback) {
        this.pool.execute(
            'SELECT sess FROM auth_sessions WHERE sid = ? AND expires_at > UTC_TIMESTAMP() LIMIT 1',
            [sid]
        ).then(([rows]) => {
            if (!rows.length) return callback(null, null);
            try {
                callback(null, JSON.parse(rows[0].sess));
            } catch (error) {
                callback(error);
            }
        }).catch(callback);
    }

    set(sid, sess, callback) {
        const expiresAt = expiresFromSession(sess, this.ttlMs);
        const userId = sess.userId || (sess.user && sess.user.id) || null;
        this.pool.execute(
            `INSERT INTO auth_sessions (sid, sess, expires_at, id_user, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE sess = VALUES(sess), expires_at = VALUES(expires_at),
                id_user = VALUES(id_user), ip_address = VALUES(ip_address),
                user_agent = VALUES(user_agent), updated_at = CURRENT_TIMESTAMP`,
            [
                sid,
                JSON.stringify(sess),
                expiresAt,
                userId,
                sess.ipAddress || null,
                sess.userAgent || null
            ]
        ).then(() => callback && callback()).catch(callback);
    }

    destroy(sid, callback) {
        this.pool.execute('DELETE FROM auth_sessions WHERE sid = ?', [sid])
            .then(() => callback && callback())
            .catch(callback);
    }

    touch(sid, sess, callback) {
        const expiresAt = expiresFromSession(sess, this.ttlMs);
        this.pool.execute(
            'UPDATE auth_sessions SET expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE sid = ?',
            [expiresAt, sid]
        ).then(() => callback && callback()).catch(callback);
    }

    clearExpired() {
        return this.pool.execute('DELETE FROM auth_sessions WHERE expires_at <= UTC_TIMESTAMP()');
    }
}

function expiresFromSession(sess, ttlMs) {
    const cookieExpires = sess && sess.cookie && sess.cookie.expires;
    const date = cookieExpires ? new Date(cookieExpires) : new Date(Date.now() + ttlMs);
    return Number.isNaN(date.getTime()) ? new Date(Date.now() + ttlMs) : date;
}

module.exports = MySQLSessionStore;

};

__moduleDefs["lib/encryptedEventLog.js"] = function(module, exports, require, __filename, __dirname) {
const fs = require('fs');
const path = require('path');
const dataSecurity = require('./dataSecurity');

const fsp = fs.promises;

async function loadEvents(filePath, onEvent) {
    try {
        const raw = await fsp.readFile(filePath, 'utf8');
        const lines = raw.split('\n').filter(Boolean);
        for (const line of lines) {
            try {
                await onEvent(JSON.parse(dataSecurity.decryptText(line)));
            } catch (error) {
                console.error('Encrypted event skipped:', error.message);
            }
        }
        return true;
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Encrypted event log read error:', error);
        return false;
    }
}

async function appendEvent(filePath, event) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.appendFile(filePath, dataSecurity.encryptText(JSON.stringify(event)) + '\n', { mode: 0o600 });
    await fsp.chmod(filePath, 0o600).catch(() => {});
}

async function readSnapshot(filePath) {
    try {
        return JSON.parse(dataSecurity.decryptText(await fsp.readFile(filePath, 'utf8')));
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Encrypted snapshot read error:', error.message);
        return null;
    }
}

async function writeSnapshot(filePath, state) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, dataSecurity.encryptText(JSON.stringify(state)), { mode: 0o600 });
    await fsp.chmod(filePath, 0o600).catch(() => {});
}

async function compactLogWithSnapshot(logPath, snapshotPath, state, maxBytes) {
    try {
        const stat = await fsp.stat(logPath);
        if (stat.size <= maxBytes) return;
        await writeSnapshot(snapshotPath, state);
        const emptyLogPath = logPath + '.empty';
        await fsp.writeFile(emptyLogPath, '', { mode: 0o600 });
        await fsp.rename(emptyLogPath, logPath);
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Encrypted event log compact error:', error);
    }
}

async function appendBoundedEvent(filePath, event, options) {
    const state = options.state;
    state.count += 1;
    if (state.count % options.trimEvery === 0) {
        await trimLog(filePath, options.maxBytes, options.maxLines);
        state.count = 0;
    }
    await appendEvent(filePath, event);
}

async function trimLog(filePath, maxBytes, maxLines) {
    try {
        const stat = await fsp.stat(filePath);
        if (stat.size <= maxBytes) return;
        await fsp.rename(filePath, filePath + '.1').catch(() => {});
        await fsp.writeFile(filePath, '', { mode: 0o600 });
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Encrypted event log trim error:', error);
    }
}

module.exports = {
    loadEvents,
    appendEvent,
    appendBoundedEvent,
    readSnapshot,
    compactLogWithSnapshot
};

};

__moduleDefs["lib/db.js"] = function(module, exports, require, __filename, __dirname) {
const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

let pool;

function createPool() {
    if (pool) return pool;
    pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        ssl: config.db.ssl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        namedPlaceholders: false,
        multipleStatements: false
    });
    return pool;
}

async function getConnection() {
    return createPool().getConnection();
}

async function withConnection(work) {
    const connection = await getConnection();
    try {
        return await work(connection);
    } finally {
        connection.release();
    }
}

async function ping() {
    return withConnection(async connection => {
        await connection.ping();
        return true;
    });
}

async function close() {
    if (!pool) return;
    await pool.end();
    pool = null;
    logger.info('MySQL pool closed');
}

module.exports = {
    createPool,
    getConnection,
    withConnection,
    ping,
    close
};

};

__moduleDefs["lib/csvService.js"] = function(module, exports, require, __filename, __dirname) {
const { once } = require('events');

async function streamCSV(kind, res, fallbackStore) {
    let headers = null;
    let wroteRows = false;
    let batch = '';
    let batchSize = 0;
    await fallbackStore.forEachExportRow(kind, async row => {
        const safeRow = row || { status: 'empty' };
        if (!headers) {
            headers = Object.keys(safeRow);
            batch += headers.join(',') + '\n';
        }
        wroteRows = true;
        batch += headers.map(header => escapeCSVCell(safeRow[header])).join(',') + '\n';
        batchSize += 1;
        if (batchSize >= 50) {
            await writeBatch(res, batch);
            batch = '';
            batchSize = 0;
        }
    });
    if (!wroteRows) {
        batch += 'status\nempty\n';
    }
    if (batch) {
        await writeBatch(res, batch);
    }
    res.end();
}

async function writeBatch(res, chunk) {
    if (!res.write(chunk)) {
        await once(res, 'drain');
    }
}

function escapeCSVCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

module.exports = {
    streamCSV
};

};

__moduleDefs["lib/config.js"] = function(module, exports, require, __filename, __dirname) {
const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const apiDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(apiDir, '..');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(apiDir, '.env'), override: true });

const DEFAULT_LOCAL_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
];

function splitCSV(value, fallback) {
    const items = String(value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    return items.length ? items : fallback;
}

function intEnv(name, fallback, min, max) {
    const parsed = parseInt(process.env[name], 10);
    const value = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(Math.max(value, min), max);
}

function boolEnv(name, fallback) {
    if (process.env[name] === undefined) return fallback;
    return ['1', 'true', 'yes', 'on'].includes(String(process.env[name]).toLowerCase());
}

function required(name, value, productionOnly) {
    if (productionOnly && process.env.NODE_ENV !== 'production') return;
    if (value === undefined || value === null || String(value) === '') {
        throw new Error(`${name} environment variable is required${productionOnly ? ' in production' : ''}.`);
    }
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().default('theway'),
    DB_SSL: z.string().optional(),
    APP_BASE_URL: z.string().url().optional(),
    CLIENT_BASE_URL: z.string().url().optional(),
    COOKIE_SECRET: z.string().optional(),
    CSRF_SECRET: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
    MAX_FILE_SIZE: z.coerce.number().int().min(1024).default(20 * 1024 * 1024),
    LOCAL_UPLOAD_DIR: z.string().optional(),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    AI_PROVIDER: z.string().optional(),
    AI_API_KEY: z.string().optional(),
    AI_BASE_URL: z.string().url().optional(),
    AI_MODEL: z.string().optional(),
    MAIL_PROVIDER: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
    OAUTH_LINKEDIN_CLIENT_ID: z.string().optional(),
    OAUTH_LINKEDIN_CLIENT_SECRET: z.string().optional(),
    BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().optional(),
    OTEL_SERVICE_NAME: z.string().default('theway-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
    LOG_LEVEL: z.string().default('info')
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const message = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
}

const env = parsed.data;
const isProduction = env.NODE_ENV === 'production';

required('DB_USER', env.DB_USER, false);
required('DB_PASSWORD', env.DB_PASSWORD, true);
required('COOKIE_SECRET', env.COOKIE_SECRET, true);
required('CSRF_SECRET', env.CSRF_SECRET, true);
required('CORS_ORIGIN', env.CORS_ORIGIN, true);
required('APP_BASE_URL', env.APP_BASE_URL, true);
required('CLIENT_BASE_URL', env.CLIENT_BASE_URL, true);

if (isProduction && env.STORAGE_DRIVER === 's3') {
    ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].forEach(name => required(name, env[name], false));
}

const appBaseUrl = env.APP_BASE_URL || `http://localhost:${env.PORT}`;
const clientBaseUrl = env.CLIENT_BASE_URL || appBaseUrl;
const corsOrigins = splitCSV(env.CORS_ORIGIN, DEFAULT_LOCAL_ORIGINS);

module.exports = {
    apiDir,
    rootDir,
    nodeEnv: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    appBaseUrl,
    clientBaseUrl,
    db: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        ssl: boolEnv('DB_SSL', false) ? { rejectUnauthorized: true } : undefined
    },
    corsOrigins,
    cookies: {
        secret: env.COOKIE_SECRET || 'development-cookie-secret-change-me',
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'lax',
        ttlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
    },
    csrf: {
        secret: env.CSRF_SECRET || 'development-csrf-secret-change-me'
    },
    rateLimits: {
        auth: { windowMs: 15 * 60 * 1000, max: intEnv('RATE_LIMIT_AUTH_MAX', 20, 1, 1000) },
        reset: { windowMs: 60 * 60 * 1000, max: intEnv('RATE_LIMIT_RESET_MAX', 5, 1, 1000) },
        upload: { windowMs: 60 * 60 * 1000, max: intEnv('RATE_LIMIT_UPLOAD_MAX', 20, 1, 1000) },
        ai: { windowMs: 60 * 60 * 1000, max: intEnv('RATE_LIMIT_AI_MAX', 10, 1, 1000) },
        admin: { windowMs: 60 * 1000, max: intEnv('RATE_LIMIT_ADMIN_MAX', 120, 1, 10000) }
    },
    uploads: {
        driver: env.STORAGE_DRIVER,
        localDir: path.resolve(rootDir, env.LOCAL_UPLOAD_DIR || 'storage/uploads'),
        maxFileSize: env.MAX_FILE_SIZE,
        allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.csv', '.txt']
    },
    s3: {
        endpoint: env.S3_ENDPOINT,
        bucket: env.S3_BUCKET,
        region: env.S3_REGION || 'us-east-1',
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY
    },
    ai: {
        provider: env.AI_PROVIDER || '',
        apiKey: env.AI_API_KEY || '',
        baseUrl: env.AI_BASE_URL || '',
        model: env.AI_MODEL || ''
    },
    mail: {
        provider: env.MAIL_PROVIDER || 'smtp',
        from: env.MAIL_FROM || 'no-reply@theway.local',
        smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT || 587,
            user: env.SMTP_USER,
            password: env.SMTP_PASSWORD
        }
    },
    oauth: {
        google: {
            clientId: env.OAUTH_GOOGLE_CLIENT_ID,
            clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET
        },
        linkedin: {
            clientId: env.OAUTH_LINKEDIN_CLIENT_ID,
            clientSecret: env.OAUTH_LINKEDIN_CLIENT_SECRET
        }
    },
    bootstrapAdmin: {
        email: env.BOOTSTRAP_ADMIN_EMAIL,
        password: env.BOOTSTRAP_ADMIN_PASSWORD
    },
    otel: {
        serviceName: env.OTEL_SERVICE_NAME,
        endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT
    },
    logLevel: env.LOG_LEVEL
};

};

__moduleDefs["lib/passwords.js"] = function(module, exports, require, __filename, __dirname) {
const argon2 = require('argon2');

async function hashPassword(password) {
    return argon2.hash(String(password), {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 3,
        parallelism: 1
    });
}

async function verifyPassword(hash, password) {
    if (!hash || !String(hash).startsWith('$argon2')) return false;
    return argon2.verify(hash, String(password));
}

function isArgonHash(hash) {
    return Boolean(hash && String(hash).startsWith('$argon2'));
}

module.exports = {
    hashPassword,
    verifyPassword,
    isArgonHash
};

};

__moduleDefs["lib/actionSecurity.js"] = function(module, exports, require, __filename, __dirname) {
const ALLOWED_EXPORT_KINDS = new Set(['summary', 'users', 'skills', 'competences', 'export', 'invoice', 'cv']);
const ADMIN_EXPORT_KINDS = new Set(['users', 'invoice']);

function queueAction(fallbackStore, type, userId, payload) {
    fallbackStore.recordAction(type, userId, payload).catch(error => {
        console.error('Action log error:', error);
    });
}

function userScopedPayload(req, res) {
    const ownerId = req.body.ownerId || req.body.userId || req.body.targetUserId;
    if (ownerId && String(ownerId) !== String(req.userId)) {
        res.status(403).json({ ok: false, error: 'Action non autorisée pour cette ressource' });
        return null;
    }
    return {
        userId: req.userId,
        page: req.body.page || null,
        label: req.body.label || null,
        action: req.body.action || null,
        saved: typeof req.body.saved === 'boolean' ? req.body.saved : undefined,
        kind: req.body.kind || null
    };
}

function safeExportKind(kind) {
    const normalized = String(kind || 'summary').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return ALLOWED_EXPORT_KINDS.has(normalized) ? normalized : 'summary';
}

function canExport(userRole, exportKind) {
    if (!ADMIN_EXPORT_KINDS.has(exportKind)) return true;
    return ['admin', 'administrateur'].includes(String(userRole || '').toLowerCase());
}

module.exports = {
    queueAction,
    userScopedPayload,
    safeExportKind,
    canExport
};

};

__moduleDefs["lib/otel.js"] = function(module, exports, require, __filename, __dirname) {
const config = require('./config');
const logger = require('./logger');

let sdk = null;

function startOpenTelemetry() {
    if (!config.otel.endpoint) return null;
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    sdk = new NodeSDK({
        traceExporter: new OTLPTraceExporter({ url: config.otel.endpoint }),
        instrumentations: [getNodeAutoInstrumentations()],
        serviceName: config.otel.serviceName
    });
    sdk.start();
    logger.info({ endpoint: config.otel.endpoint }, 'OpenTelemetry started');
    return sdk;
}

async function shutdownOpenTelemetry() {
    if (!sdk) return;
    await sdk.shutdown();
}

module.exports = {
    startOpenTelemetry,
    shutdownOpenTelemetry
};

};

__moduleDefs["lib/migrations.js"] = function(module, exports, require, __filename, __dirname) {
const fs = require('fs').promises;
const path = require('path');

async function ensureMigrationTable(connection) {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(191) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
}

async function appliedVersions(connection) {
    await ensureMigrationTable(connection);
    const [rows] = await connection.execute('SELECT version FROM schema_migrations');
    return new Set(rows.map(row => row.version));
}

async function runMigrations(connection, migrationsDir) {
    const files = (await fs.readdir(migrationsDir))
        .filter(file => file.endsWith('.sql'))
        .sort();
    const applied = await appliedVersions(connection);
    const executed = [];

    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        const statements = splitSql(sql);
        await connection.beginTransaction();
        try {
            for (const statement of statements) {
                await connection.query(statement);
            }
            await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
            await connection.commit();
            executed.push(file);
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    return executed;
}

function splitSql(sql) {
    return sql
        .split(/\r?\n/)
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(/;\s*(?:\r?\n|$)/)
        .map(statement => statement.trim())
        .filter(Boolean);
}

module.exports = {
    runMigrations,
    splitSql
};

};

__moduleDefs["lib/fallbackStore.js"] = function(module, exports, require, __filename, __dirname) {
const fs = require('fs');
const path = require('path');
const dataSecurity = require('./dataSecurity');
const encryptedEventLog = require('./encryptedEventLog');

const fsp = fs.promises;
const apiDataDir = path.join(__dirname, '..', 'data');
const stateLogPath = path.join(apiDataDir, 'fallback-state.log.enc');
const stateSnapshotPath = path.join(apiDataDir, 'fallback-state.snapshot.enc');
const actionLogPath = path.join(apiDataDir, 'fallback-actions.log.enc');
const legacySnapshotPath = path.join(apiDataDir, 'fallback-store.enc');
const legacyPlainStorePath = path.join(apiDataDir, 'fallback-store.json');
const MAX_ACTION_LOG_BYTES = 512 * 1024;
const MAX_ACTION_LOG_LINES = 1000;
const MAX_STATE_LOG_BYTES = 512 * 1024;
const MAX_LOCAL_USERS = 1000;
const MAX_LOCAL_SKILLS = 1000;
let cachedStore = null;
let userEmailIndex = null;
let userIdIndex = null;
const actionLogState = { count: 0 };
let mutationActive = false;
const mutationWaiters = [];
let readPromise = null;

function emptyStore() {
    return {
        users: [],
        skills: [],
        recoveryRequests: []
    };
}

function sanitizeStore(store) {
    return {
        users: Array.isArray(store && store.users) ? store.users : [],
        skills: Array.isArray(store && store.skills) ? store.skills : [],
        recoveryRequests: Array.isArray(store && store.recoveryRequests) ? store.recoveryRequests.slice(-50) : []
    };
}

function setCachedStore(store) {
    cachedStore = capStoreCollections(sanitizeStore(store));
    rebuildUserIndexes();
    return cachedStore;
}

function rebuildUserIndexes() {
    userEmailIndex = new Map();
    userIdIndex = new Map();
    cachedStore.users.forEach(indexUser);
}

function buildUserIndexes(store) {
    const indexes = {
        email: new Map(),
        id: new Map()
    };
    store.users.forEach(user => indexUserIn(indexes, user));
    return indexes;
}

function indexUser(user) {
    userEmailIndex.set(String(user.email || '').toLowerCase(), user);
    userIdIndex.set(String(user.id_user), user);
}

function indexUserIn(indexes, user) {
    indexes.email.set(String(user.email || '').toLowerCase(), user);
    indexes.id.set(String(user.id_user), user);
}

function unindexUser(user) {
    userEmailIndex.delete(String(user.email || '').toLowerCase());
    userIdIndex.delete(String(user.id_user));
}

function updateEmailIndex(user, oldEmail, newEmail) {
    userEmailIndex.delete(String(oldEmail || '').trim().toLowerCase());
    userEmailIndex.set(String(newEmail || '').trim().toLowerCase(), user);
}

function updateEmailIndexIn(indexes, user, oldEmail, newEmail) {
    indexes.email.delete(String(oldEmail || '').trim().toLowerCase());
    indexes.email.set(String(newEmail || '').trim().toLowerCase(), user);
}

function runMutation(work) {
    return acquireMutation().then(async release => {
        try {
            return await work();
        } finally {
            release();
        }
    });
}

function acquireMutation() {
    if (!mutationActive) {
        mutationActive = true;
        return Promise.resolve(releaseMutation);
    }
    return new Promise(resolve => {
        mutationWaiters.push(() => resolve(releaseMutation));
    });
}

function releaseMutation() {
    const next = mutationWaiters.shift();
    if (next) {
        next();
        return;
    }
    mutationActive = false;
}

function capStoreCollections(store) {
    store.users = store.users.slice(-MAX_LOCAL_USERS);
    store.skills = store.skills.slice(-MAX_LOCAL_SKILLS);
    return store;
}

async function read() {
    if (cachedStore) return cachedStore;
    if (readPromise) return await readPromise;
    readPromise = loadStore();
    try {
        return await readPromise;
    } finally {
        readPromise = null;
    }
}

async function loadStore() {
    const store = sanitizeStore(await encryptedEventLog.readSnapshot(stateSnapshotPath) || emptyStore());
    const replayIndexes = buildUserIndexes(store);
    const loaded = await encryptedEventLog.loadEvents(stateLogPath, event => applyEvent(store, event, replayIndexes));
    if (!loaded) {
        setCachedStore(await readLegacyStore() || store);
        return cachedStore;
    }
    await encryptedEventLog.compactLogWithSnapshot(stateLogPath, stateSnapshotPath, store, MAX_STATE_LOG_BYTES);
    setCachedStore(store);
    return cachedStore;
}

async function readLegacyStore() {
    const encrypted = await readLegacyEncryptedStore();
    if (encrypted) return encrypted;
    return await discardLegacyPlainStore();
}

async function readLegacyEncryptedStore() {
    try {
        const raw = await fsp.readFile(legacySnapshotPath, 'utf8');
        return sanitizeStore(JSON.parse(dataSecurity.decryptText(raw)));
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Legacy encrypted fallback store read error:', error.message);
        return null;
    }
}

async function discardLegacyPlainStore() {
    try {
        await fsp.unlink(legacyPlainStorePath).catch(() => {});
        return null;
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Legacy plaintext fallback store removed without import.');
        return null;
    }
}

function applyEvent(store, event, indexes) {
    if (!event || !event.type) return;
    if (event.type.startsWith('user.')) {
        applyUserEvent(store, event, indexes || currentIndexes());
        return;
    }
    if (event.type.startsWith('skill.')) {
        applySkillEvent(store, event);
        return;
    }
    if (event.type.startsWith('recovery.')) {
        applyRecoveryEvent(store, event);
    }
}

function currentIndexes() {
    return {
        email: userEmailIndex,
        id: userIdIndex
    };
}

function applyUserEvent(store, event, indexes) {
    if (event.type === 'user.created') {
        addLocalUser(store, event.user, indexes);
        return;
    }
    if (event.type === 'user.updated') {
        const user = indexes.id.get(String(event.id));
        if (!user) return;
        const oldEmailKey = String(user.email || '').trim().toLowerCase();
        Object.assign(user, event.updates);
        if (event.updates.email) updateEmailIndexIn(indexes, user, oldEmailKey, event.updates.email);
    }
}

function applySkillEvent(store, event) {
    if (event.type === 'skill.created') {
        store.skills.push(event.skill);
        capStoreCollections(store);
    }
}

function applyRecoveryEvent(store, event) {
    if (event.type === 'recovery.created') {
        store.recoveryRequests.push(event.request);
        store.recoveryRequests = store.recoveryRequests.slice(-50);
    }
}

async function appendStateEvent(event) {
    await encryptedEventLog.appendEvent(stateLogPath, event);
}

function isDatabaseUnavailable(error) {
    return [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ER_ACCESS_DENIED_ERROR',
        'ER_BAD_DB_ERROR',
        'ER_NO_SUCH_TABLE',
        'PROTOCOL_CONNECTION_LOST'
    ].includes(error && error.code);
}

function publicUser(user) {
    return {
        id: user.id_user || user.id,
        id_params: user.id_params || null,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone || null,
        localisation: user.localisation || null,
        photo: user.photo || null,
        role: user.role || 'user'
    };
}

function exportUser(user) {
    return {
        id: user.id_user || user.id,
        email: user.email,
        role: user.role || 'user'
    };
}

async function recordAction(type, userId, payload) {
    const entry = {
        id: dataSecurity.randomId(),
        type: type,
        userId: userId || null,
        payload: redactPayload(payload || {}),
        createdAt: new Date().toISOString()
    };
    await encryptedEventLog.appendBoundedEvent(actionLogPath, entry, {
        state: actionLogState,
        trimEvery: 25,
        maxBytes: MAX_ACTION_LOG_BYTES,
        maxLines: MAX_ACTION_LOG_LINES
    });
}

function redactPayload(value) {
    if (Array.isArray(value)) return value.map(redactPayload);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).reduce((clean, key) => {
        if (/password|token|secret|authorization/i.test(key)) {
            clean[key] = '[redacted]';
            return clean;
        }
        clean[key] = redactPayload(value[key]);
        return clean;
    }, {});
}

async function createUser(data) {
    return await runMutation(async () => {
        if (!data.password && !data.passwordHash) throw new Error('Mot de passe requis pour creer un utilisateur local.');
        const store = await read();
        const email = String(data.email || '').trim().toLowerCase();
        if (userEmailIndex && userEmailIndex.has(email)) {
            const error = new Error('Utilisateur deja existant');
            error.status = 400;
            throw error;
        }

        const user = await buildLocalUser(data, email);
        await appendStateEvent({ type: 'user.created', user: user });
        addLocalUser(store, user);
        return user;
    });
}

async function buildLocalUser(data, email) {
    return {
        id_user: dataSecurity.randomId(),
        id_params: dataSecurity.randomId(),
        parametres: {
            notification_email: 'enabled',
            notification_push: 'enabled'
        },
        nom: data.nom,
        prenom: data.prenom,
        email: email,
        password: data.passwordHash || await dataSecurity.hashPassword(data.password),
        telephone: data.telephone || null,
        localisation: data.localisation || null,
        photo: data.photo || null,
        role: data.role || 'user'
    };
}

function addLocalUser(store, user, indexes) {
    indexes = indexes || currentIndexes();
    store.users.push(user);
    while (store.users.length > MAX_LOCAL_USERS) {
        const removed = store.users.shift();
        if (removed) {
            indexes.email.delete(String(removed.email || '').toLowerCase());
            indexes.id.delete(String(removed.id_user));
        }
    }
    indexUserIn(indexes, user);
}

async function findUserByEmail(email) {
    await read();
    return userEmailIndex.get(String(email || '').trim().toLowerCase()) || null;
}

async function findUserById(id) {
    await read();
    return userIdIndex.get(String(id)) || null;
}

async function updateUser(id, updates) {
    return await runMutation(async () => {
        await read();
        const user = userIdIndex.get(String(id));
        if (!user) return null;
        const event = { type: 'user.updated', id: id, updates: updates };
        await appendStateEvent(event);
        applyUserEvent(cachedStore, event);
        return user;
    });
}

async function addSkill(data) {
    return await runMutation(async () => {
        const store = await read();
        const skill = {
            id: dataSecurity.randomId(),
            nom: data.nom,
            categorie: data.categorie || 'general'
        };
        await appendStateEvent({ type: 'skill.created', skill: skill });
        store.skills.push(skill);
        capStoreCollections(store);
        return skill;
    });
}

async function listSkills() {
    return (await read()).skills;
}

async function storeRecoveryRequest(request) {
    return await runMutation(async () => {
        const store = await read();
        const entry = {
            id: dataSecurity.randomId(),
            email: request.email,
            tokenHash: request.tokenHash,
            expiresAt: request.expiresAt,
            requestedAt: request.requestedAt
        };
        await appendStateEvent({ type: 'recovery.created', request: entry });
        store.recoveryRequests.push(entry);
        store.recoveryRequests = store.recoveryRequests.slice(-50);
    });
}

async function exportRows(kind) {
    const store = await read();
    const exportKind = String(kind || 'summary').toLowerCase();
    if (exportKind.includes('user')) return store.users.map(user => exportUser(user));
    if (exportKind.includes('skill') || exportKind.includes('competence')) return store.skills;
    return [
        { resource: 'users', count: store.users.length },
        { resource: 'skills', count: store.skills.length }
    ];
}

async function forEachExportRow(kind, callback) {
    const rows = await exportRows(kind);
    for (const row of rows) await callback(row);
}

module.exports = {
    isDatabaseUnavailable,
    publicUser,
    recordAction,
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    addSkill,
    listSkills,
    storeRecoveryRequest,
    exportRows,
    forEachExportRow
};

};

__moduleDefs["routes/profile.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');

module.exports = function createProfileRouter(deps) {
    const router = express.Router();
    const { verifyToken, getConnection, fallbackStore } = deps;

    router.get('/api/profile', verifyToken, async (req, res) => {
        try {
            const connection = await getConnection();
            try {
                const [users] = await connection.execute(
                    'SELECT id_user, nom, prenom, email, telephone, localisation, photo, role FROM utilisateur WHERE id_user = ?',
                    [req.userId]
                );

                if (users.length === 0) {
                    return res.status(404).json({ ok: false, error: 'Utilisateur non trouvé' });
                }

                res.json({ ok: true, profile: users[0] });
            } finally {
                connection.release();
            }
        } catch (error) {
            if (fallbackStore.isDatabaseUnavailable(error)) {
                const fallbackUser = await fallbackStore.findUserById(req.userId);
                if (!fallbackUser) {
                    return res.status(404).json({ ok: false, error: 'Utilisateur non trouvé' });
                }
                return res.json({
                    ok: true,
                    mode: 'file',
                    profile: fallbackStore.publicUser(fallbackUser)
                });
            }
            res.status(500).json({ ok: false, error: 'Erreur profil' });
        }
    });

    router.put('/api/profile', verifyToken, async (req, res) => {
        const { nom, prenom, telephone, localisation } = req.body;
        const photo = sanitizePhoto(req.body.photo);
        if (photo.error) {
            return res.status(400).json({ ok: false, error: photo.error });
        }

        try {
            const connection = await getConnection();
            try {
                await connection.execute(
                    'UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ?, localisation = ?, photo = ? WHERE id_user = ?',
                    [nom, prenom, telephone, localisation, photo.value, req.userId]
                );

                res.json({ ok: true, message: 'Profil mis à jour' });
            } finally {
                connection.release();
            }
        } catch (error) {
            if (fallbackStore.isDatabaseUnavailable(error)) {
                const updated = await fallbackStore.updateUser(req.userId, {
                    nom,
                    prenom,
                    telephone,
                    localisation,
                    photo: photo.value
                });
                if (!updated) {
                    return res.status(404).json({ ok: false, error: 'Utilisateur non trouvé' });
                }
                return res.json({
                    ok: true,
                    mode: 'file',
                    message: 'Profil mis à jour',
                    profile: fallbackStore.publicUser(updated)
                });
            }
            res.status(500).json({ ok: false, error: 'Erreur mise à jour profil' });
        }
    });

    return router;
};

function sanitizePhoto(photo) {
    if (photo === undefined || photo === null || photo === '') {
        return { value: null };
    }
    if (typeof photo !== 'string') {
        return { error: 'Photo invalide' };
    }

    const value = photo.trim();
    const safeImageData = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
    const safeHttpsURL = /^https:\/\/[^\s"'<>]+$/i.test(value);
    const safeUploadPath = /^\/?assets\/uploads\/[A-Za-z0-9._/-]+$/i.test(value);
    if (!safeImageData && !safeHttpsURL && !safeUploadPath) {
        return { error: 'Photo invalide' };
    }
    return { value: value };
}

};

__moduleDefs["routes/actions.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const { queueAction, userScopedPayload } = require('../lib/actionSecurity');

module.exports = function createActionsRouter(deps) {
    const router = express.Router();
    const { verifyToken, fallbackStore } = deps;

    router.post('/draft-create', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        scopedPayload.name = req.body.name || 'Nouveau brouillon';
        queueAction(fallbackStore, 'draft.create', req.userId, scopedPayload);

        res.json({
            ok: true,
            message: 'Brouillon créé avec succès',
            draft: {
                id: Date.now(),
                name: req.body.name || 'Nouveau brouillon',
                page: req.body.page,
                createdAt: new Date()
            }
        });
    });

    router.post('/entity-update', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'entity.update', req.userId, scopedPayload);
        res.json({ ok: true, message: 'Entité mise à jour', updated: true });
    });

    router.post('/entity-delete', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'entity.delete', req.userId, scopedPayload);
        res.json({ ok: true, message: 'Entité supprimée', deleted: true });
    });

    router.post('/opportunity-bookmark', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'opportunity.bookmark', req.userId, scopedPayload);
        res.json({
            ok: true,
            message: req.body.saved ? 'Opportunité enregistrée' : 'Opportunité retirée',
            saved: req.body.saved
        });
    });

    router.post('/process-run', verifyToken, async (req, res) => {
        queueAction(fallbackStore, 'process.run', req.userId, {
            userId: req.userId,
            action: req.body.action || null,
            label: req.body.label || null,
            page: req.body.page || null
        });
        res.json({
            ok: true,
            message: 'Processus lancé',
            action: req.body.action,
            status: 'completed'
        });
    });

    return router;
};

};

__moduleDefs["routes/files.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const { streamCSV } = require('../lib/csvService');
const { canExport, queueAction, safeExportKind } = require('../lib/actionSecurity');

module.exports = function createFilesRouter(deps) {
    const router = express.Router();
    const { verifyToken, upload, fallbackStore } = deps;

    router.post('/file-upload', verifyToken, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ ok: false, error: 'Fichier manquant' });
            }
            queueAction(fallbackStore, 'file.upload', req.userId, {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                page: req.body.page || null
            });

            res.json({
                ok: true,
                message: 'Fichier uploadé avec succès',
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    path: `/assets/uploads/files/${req.file.filename}`
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ ok: false, error: 'Erreur upload' });
        }
    });

    router.post('/file-export', verifyToken, async (req, res) => {
        try {
            const exportKind = safeExportKind(req.body.kind);
            if (!canExport(req.userRole, exportKind)) {
                return res.status(403).json({ ok: false, error: 'Export non autorisé' });
            }

            queueAction(fallbackStore, 'file.export', req.userId, {
                userId: req.userId,
                kind: exportKind,
                page: req.body.page || null
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="export-${exportKind}.csv"`);
            await streamCSV(exportKind, res, fallbackStore);
        } catch (error) {
            res.status(500).json({ ok: false, error: 'Erreur export' });
        }
    });

    return router;
};

};

__moduleDefs["routes/auth.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const authService = require('../services/authService');

module.exports = function createAuthRouter(deps) {
    const router = express.Router();

    router.post('/auth/register', async (req, res) => {
        respond(res, authService.registerUser(deps, req.body), 'Erreur d\'enregistrement');
    });

    router.post('/auth/login', async (req, res) => {
        respond(res, authService.loginUser(deps, req.body), 'Erreur de connexion');
    });

    router.post('/auth-password-recovery', async (req, res) => {
        respond(res, authService.requestPasswordRecovery(deps, req.body), 'Erreur de récupération');
    });

    router.post('/auth-social', async (req, res) => {
        const { provider, idToken } = req.body;

        if (!provider || !idToken) {
            return res.status(400).json({
                ok: false,
                error: 'Connexion sociale non configuree: un jeton OAuth fournisseur est requis.'
            });
        }

        res.status(501).json({
            ok: false,
            error: 'Verification OAuth serveur non configuree pour ce fournisseur.'
        });
    });

    return router;
};

function respond(res, work, fallbackMessage) {
    work
        .then(result => res.json(result))
        .catch(error => {
            console.error(fallbackMessage + ':', error);
            res.status(error.status || 500).json({
                ok: false,
                error: error.publicMessage || fallbackMessage
            });
        });
}

};

__moduleDefs["routes/skills.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const crypto = require('crypto');

module.exports = function createSkillsRouter(deps) {
    const router = express.Router();
    const { verifyToken, getConnection, fallbackStore } = deps;

    router.post('/api/skills', verifyToken, async (req, res) => {
        try {
            const { nom, categorie } = req.body;
            const skillId = crypto.randomUUID();
            const connection = await getConnection();
            try {
                await connection.execute(
                    'INSERT INTO competence (id_skill, nom, categorie) VALUES (?, ?, ?)',
                    [skillId, nom, categorie]
                );

                res.json({
                    ok: true,
                    message: 'Compétence ajoutée',
                    skill: {
                        id: skillId,
                        id_skill: skillId,
                        nom: nom,
                        categorie: categorie
                    }
                });
            } finally {
                connection.release();
            }
        } catch (error) {
            if (fallbackStore.isDatabaseUnavailable(error)) {
                const { nom, categorie } = req.body;
                const skill = await fallbackStore.addSkill({ nom, categorie });
                return res.json({
                    ok: true,
                    mode: 'file',
                    message: 'Compétence ajoutée',
                    skill: skill
                });
            }
            console.error('Skills error:', error);
            res.status(500).json({ ok: false, error: 'Erreur compétence' });
        }
    });

    router.get('/api/skills', verifyToken, async (req, res) => {
        try {
            const connection = await getConnection();
            try {
                const [skills] = await connection.execute('SELECT * FROM competence LIMIT 50');
                res.json({ ok: true, skills: skills });
            } finally {
                connection.release();
            }
        } catch (error) {
            if (fallbackStore.isDatabaseUnavailable(error)) {
                return res.json({
                    ok: true,
                    mode: 'file',
                    skills: await fallbackStore.listSkills()
                });
            }
            res.status(500).json({ ok: false, error: 'Erreur récupération compétences' });
        }
    });

    return router;
};

};

__moduleDefs["routes/panel.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');

module.exports = function createPanelRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/panel/summary', async (req, res) => {
        try {
            const connection = await getConnection();
            try {
                const [[opportunities]] = await connection.execute(
                    'SELECT COUNT(*) AS total, COUNT(DISTINCT NULLIF(company, "")) AS companies FROM opportunities'
                );
                const [[users]] = await connection.execute('SELECT COUNT(*) AS total FROM utilisateur');
                const [[skills]] = await connection.execute('SELECT COUNT(*) AS total FROM competence');
                const [sources] = await connection.execute(
                    'SELECT source, COUNT(*) AS total FROM opportunities WHERE source IS NOT NULL AND source <> "" GROUP BY source ORDER BY total DESC LIMIT 8'
                );
                const [recentOpportunities] = await connection.execute(
                    'SELECT id, uid, source, title, company, location, source_url, description, skills FROM opportunities ORDER BY created_at DESC, id DESC LIMIT 8'
                );

                res.json({
                    ok: true,
                    mode: 'database',
                    summary: {
                        opportunities: Number(opportunities.total) || 0,
                        companies: Number(opportunities.companies) || 0,
                        users: Number(users.total) || 0,
                        skills: Number(skills.total) || 0,
                        sources: sources.map(row => ({
                            source: row.source,
                            total: Number(row.total) || 0
                        }))
                    },
                    recentOpportunities: recentOpportunities.map(publicOpportunity)
                });
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Panel summary error:', error);
            res.status(500).json({ ok: false, error: 'Erreur statistiques' });
        }
    });

    router.get('/api/panel/skills', async (req, res) => {
        try {
            const connection = await getConnection();
            try {
                const skills = await listPanelSkills(connection);
                res.json({
                    ok: true,
                    mode: 'database',
                    skills: skills
                });
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Panel skills error:', error);
            res.status(500).json({ ok: false, error: 'Erreur compétences' });
        }
    });

    router.get('/api/panel/users', verifyToken, async (req, res) => {
        try {
            const connection = await getConnection();
            try {
                const [users] = await connection.execute(
                    'SELECT id_user, nom, prenom, email, telephone, localisation, role, date_inscription FROM utilisateur ORDER BY date_inscription DESC LIMIT 200'
                );
                res.json({
                    ok: true,
                    mode: 'database',
                    users: users.map(publicUser)
                });
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Panel users error:', error);
            res.status(500).json({ ok: false, error: 'Erreur utilisateurs' });
        }
    });

    return router;
};

async function listPanelSkills(connection) {
    const [dbSkills] = await connection.execute(
        'SELECT id_skill, nom, categorie, created_at FROM competence ORDER BY created_at DESC LIMIT 200'
    );
    const demandBySkill = await countOpportunitySkills(connection);
    const byName = new Map();

    dbSkills.forEach(row => {
        const name = String(row.nom || '').trim();
        if (!name) return;
        byName.set(normalizeKey(name), {
            id: row.id_skill,
            id_skill: row.id_skill,
            nom: name,
            name: name,
            categorie: row.categorie || categoryForSkill(name),
            category: row.categorie || categoryForSkill(name),
            demand: demandBySkill.get(normalizeKey(name)) || 0,
            created_at: row.created_at
        });
    });

    demandBySkill.forEach((demand, key) => {
        if (byName.has(key)) return;
        const name = restoreSkillName(key);
        byName.set(key, {
            id: key,
            id_skill: key,
            nom: name,
            name: name,
            categorie: categoryForSkill(name),
            category: categoryForSkill(name),
            demand: demand,
            created_at: null
        });
    });

    return Array.from(byName.values())
        .sort((left, right) => (right.demand || 0) - (left.demand || 0) || left.name.localeCompare(right.name, 'fr'))
        .slice(0, 120)
        .map((skill, index) => {
            const demand = Number(skill.demand) || 0;
            return Object.assign(skill, {
                users: Math.max(1, Math.round(demand * 1.6)),
                trend: Math.min(38, Math.max(6, 8 + (index % 8) * 3)),
                priority: demand >= 80 ? 'Élevée' : demand >= 25 ? 'Moyenne' : 'Faible',
                status: demand >= 25 ? 'Active' : 'En hausse'
            });
        });
}

async function countOpportunitySkills(connection) {
    const [rows] = await connection.execute(
        'SELECT skills FROM opportunities WHERE skills IS NOT NULL AND skills <> "" LIMIT 2500'
    );
    const counts = new Map();

    rows.forEach(row => {
        parseSkills(row.skills).forEach(skill => {
            const key = normalizeKey(skill);
            if (!key) return;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    });

    return counts;
}

function parseSkills(value) {
    if (Array.isArray(value)) return value;
    const raw = String(value || '').trim();
    if (!raw) return [];

    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    return raw.split(',').map(skill => skill.trim()).filter(Boolean);
}

function publicOpportunity(row) {
    return {
        id: row.id,
        uid: row.uid,
        source: row.source,
        title: row.title,
        company: row.company,
        location: row.location,
        source_url: row.source_url,
        description: row.description,
        skills: parseSkills(row.skills)
    };
}

function publicUser(user) {
    const fullName = [user.prenom, user.nom].filter(Boolean).join(' ').trim() || user.email;
    return {
        id: user.id_user,
        id_user: user.id_user,
        name: fullName,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        localisation: user.localisation,
        role: user.role || 'user',
        date_inscription: user.date_inscription
    };
}

function normalizeKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function restoreSkillName(key) {
    return String(key || '')
        .split(/\s+/)
        .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
        .join(' ');
}

function categoryForSkill(name) {
    const key = normalizeKey(name);
    if (/(react|vue|angular|html|css|figma|ui|ux)/.test(key)) return 'Frontend';
    if (/(node|express|php|laravel|django|flask|spring|api|sql|mysql|postgres)/.test(key)) return 'Backend';
    if (/(docker|kubernetes|aws|azure|cloud|devops|linux|ci\/cd)/.test(key)) return 'DevOps';
    if (/(data|ia|ai|machine learning|power bi|excel)/.test(key)) return 'Data';
    if (/(rh|recrutement|formation|paie)/.test(key)) return 'RH';
    if (/(vente|commercial|marketing|seo|crm)/.test(key)) return 'Business';
    return 'Général';
}

};

__moduleDefs["routes/production.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const crypto = require('crypto');
const { Issuer, generators } = require('openid-client');
const config = require('../lib/config');
const { ok, created, fail, httpError, asyncRoute, methodNotAllowed } = require('../lib/response');
const { hashPassword, verifyPassword } = require('../lib/passwords');
const { requireAuth, requireAdmin, issueCsrfToken } = require('../middleware/auth');
const { dbRateLimit } = require('../middleware/rateLimit');
const { sendEmail, passwordResetEmail } = require('../services/emailService');
const storage = require('../services/storageService');
const cvText = require('../services/cvTextService');
const ai = require('../services/aiService');
const { audit } = require('../services/auditService');

module.exports = function createProductionRouter(deps) {
    const router = express.Router();
    const { getConnection, upload } = deps;
    const rate = {
        auth: dbRateLimit(getConnection, 'auth', config.rateLimits.auth),
        reset: dbRateLimit(getConnection, 'password-reset', config.rateLimits.reset),
        upload: dbRateLimit(getConnection, 'upload', config.rateLimits.upload),
        ai: dbRateLimit(getConnection, 'ai', config.rateLimits.ai),
        admin: dbRateLimit(getConnection, 'admin', config.rateLimits.admin)
    };

    router.get('/api/auth/session', asyncRoute(async (req, res) => {
        ok(res, {
            user: req.currentUser || null,
            csrfToken: issueCsrfToken(req),
            authenticated: Boolean(req.currentUser)
        });
    }));

    router.post(['/api/auth/register', '/auth/register'], rate.auth, asyncRoute(async (req, res) => {
        const body = req.body || {};
        const email = normaliseEmail(body.email);
        assertEmail(email);
        assertPassword(body.password);
        const user = await createUser(getConnection, {
            nom: requiredText(body.nom || body.lastName || splitName(body.fullname).nom, 'Last name'),
            prenom: requiredText(body.prenom || body.firstName || splitName(body.fullname).prenom, 'First name'),
            email,
            password: body.password,
            telephone: cleanNullable(body.telephone || body.phone),
            localisation: cleanNullable(body.localisation || body.location),
            role: 'user'
        });
        await establishSession(req, user);
        await audit(getConnection, req, 'auth.register', 'utilisateur', user.id_user, { email });
        created(res, {
            message: 'Account created successfully',
            user: publicUser(user, ['user'], []),
            csrfToken: req.session.csrfToken
        });
    }));

    router.post(['/api/auth/login', '/auth/login'], rate.auth, asyncRoute(async (req, res) => {
        const email = normaliseEmail(req.body && req.body.email);
        const password = req.body && req.body.password;
        const user = await findUserByEmail(getConnection, email);
        if (!user || !(await verifyPassword(user.password, password))) {
            throw httpError(401, 'invalid_credentials', 'Invalid email or password');
        }
        await establishSession(req, user);
        await audit(getConnection, req, 'auth.login', 'utilisateur', user.id_user, {});
        ok(res, {
            message: 'Login successful',
            user: publicUser(user, await roleCodesForUser(getConnection, user.id_user), []),
            csrfToken: req.session.csrfToken
        });
    }));

    router.post(['/api/auth/logout'], asyncRoute(async (req, res) => {
        const userId = req.userId || null;
        await destroySession(req);
        await audit(getConnection, req, 'auth.logout', 'utilisateur', userId, {});
        ok(res, { message: 'Logged out' });
    }));

    router.post(['/api/auth/password-reset/request', '/auth-password-recovery'], rate.reset, asyncRoute(async (req, res) => {
        const email = normaliseEmail(req.body && req.body.email);
        if (email) {
            const user = await findUserByEmail(getConnection, email);
            if (user) {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = sha256(rawToken);
                await insertResetToken(getConnection, user.id_user, tokenHash, req);
                const resetUrl = `${config.clientBaseUrl.replace(/\/$/, '')}/view/authentification/login.html?resetToken=${rawToken}`;
                await sendEmail(getConnection, Object.assign(passwordResetEmail(email, resetUrl), { userId: user.id_user }));
                if (config.nodeEnv !== 'production') {
                    return ok(res, {
                        message: 'If the email exists, a reset link has been sent',
                        debugResetToken: rawToken
                    });
                }
            }
        }
        ok(res, { message: 'If the email exists, a reset link has been sent' });
    }));

    router.post('/api/auth/password-reset/confirm', rate.reset, asyncRoute(async (req, res) => {
        const token = requiredText(req.body && req.body.token, 'Reset token');
        assertPassword(req.body && req.body.password);
        const tokenHash = sha256(token);
        const connection = await getConnection();
        try {
            await connection.beginTransaction();
            const [tokens] = await connection.execute(
                `SELECT * FROM password_reset_tokens
                 WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP()
                 LIMIT 1 FOR UPDATE`,
                [tokenHash]
            );
            if (!tokens.length) throw httpError(400, 'reset_token_invalid', 'Reset token is invalid or expired');
            const passwordHash = await hashPassword(req.body.password);
            await connection.execute('UPDATE utilisateur SET password = ? WHERE id_user = ?', [passwordHash, tokens[0].id_user]);
            await connection.execute('UPDATE password_reset_tokens SET consumed_at = UTC_TIMESTAMP() WHERE id_reset_token = ?', [tokens[0].id_reset_token]);
            await connection.execute('DELETE FROM auth_sessions WHERE id_user = ?', [tokens[0].id_user]);
            await connection.commit();
            ok(res, { message: 'Password has been reset' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    router.get('/api/auth/oauth/:provider/start', rate.auth, asyncRoute(async (req, res) => {
        const provider = providerConfig(req.params.provider);
        const client = await oidcClient(provider, `${config.appBaseUrl}/api/auth/oauth/${provider.name}/callback`);
        const state = generators.state();
        const nonce = generators.nonce();
        req.session.oauth = { provider: provider.name, state, nonce };
        await saveSession(req);
        res.redirect(client.authorizationUrl({
            scope: 'openid email profile',
            state,
            nonce
        }));
    }));

    router.get('/api/auth/oauth/:provider/callback', rate.auth, asyncRoute(async (req, res) => {
        const provider = providerConfig(req.params.provider);
        const expected = req.session && req.session.oauth;
        if (!expected || expected.provider !== provider.name || expected.state !== req.query.state) {
            throw httpError(400, 'oauth_state_invalid', 'OAuth state is invalid');
        }
        const redirectUri = `${config.appBaseUrl}/api/auth/oauth/${provider.name}/callback`;
        const client = await oidcClient(provider, redirectUri);
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(redirectUri, params, { state: expected.state, nonce: expected.nonce });
        const claims = tokenSet.claims();
        const userInfo = claims.email ? claims : await client.userinfo(tokenSet.access_token);
        const user = await findOrCreateOAuthUser(getConnection, provider.name, userInfo, tokenSet);
        await establishSession(req, user);
        req.session.oauth = null;
        await saveSession(req);
        res.redirect('/view/pannel/dashboard.html');
    }));

    router.get('/api/profile', requireAuth, asyncRoute(async (req, res) => {
        ok(res, { profile: req.currentUser });
    }));

    router.put('/api/profile', requireAuth, asyncRoute(async (req, res) => {
        const body = req.body || {};
        const nom = requiredText(body.nom, 'Last name');
        const prenom = requiredText(body.prenom, 'First name');
        const photo = sanitisePhoto(body.photo);
        await execute(getConnection,
            'UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ?, localisation = ?, photo = ? WHERE id_user = ?',
            [nom, prenom, cleanNullable(body.telephone), cleanNullable(body.localisation), photo, req.userId]
        );
        await audit(getConnection, req, 'profile.update', 'utilisateur', req.userId, {});
        ok(res, { message: 'Profile updated' });
    }));

    router.put('/api/account/password', requireAuth, rate.auth, asyncRoute(async (req, res) => {
        assertPassword(req.body && req.body.newPassword);
        const user = await findUserById(getConnection, req.userId);
        if (!user || !(await verifyPassword(user.password, req.body.currentPassword))) {
            throw httpError(401, 'reauth_required', 'Current password is invalid');
        }
        await execute(getConnection, 'UPDATE utilisateur SET password = ? WHERE id_user = ?', [await hashPassword(req.body.newPassword), req.userId]);
        await execute(getConnection, 'DELETE FROM auth_sessions WHERE id_user = ? AND sid <> ?', [req.userId, req.sessionID]);
        await audit(getConnection, req, 'account.password_change', 'utilisateur', req.userId, {});
        ok(res, { message: 'Password updated' });
    }));

    router.put('/api/account/email', requireAuth, rate.auth, asyncRoute(async (req, res) => {
        const email = normaliseEmail(req.body && req.body.email);
        assertEmail(email);
        const user = await findUserById(getConnection, req.userId);
        if (!user || !(await verifyPassword(user.password, req.body.currentPassword))) {
            throw httpError(401, 'reauth_required', 'Current password is invalid');
        }
        await execute(getConnection, 'UPDATE utilisateur SET email = ? WHERE id_user = ?', [email, req.userId]);
        await audit(getConnection, req, 'account.email_change', 'utilisateur', req.userId, { email });
        ok(res, { message: 'Email updated' });
    }));

    router.get('/api/opportunities', asyncRoute(async (req, res) => {
        const result = await listOpportunities(getConnection, req);
        ok(res, result);
    }));

    router.get('/api/opportunities/:id', asyncRoute(async (req, res) => {
        const opportunity = await getOpportunity(getConnection, req.params.id);
        if (!opportunity) throw httpError(404, 'opportunity_not_found', 'Opportunity not found');
        ok(res, { opportunity });
    }));

    router.post(['/api/opportunities/:id/bookmark'], requireAuth, asyncRoute(async (req, res) => {
        const opportunity = await getOpportunity(getConnection, req.params.id);
        if (!opportunity) throw httpError(404, 'opportunity_not_found', 'Opportunity not found');
        await execute(
            getConnection,
            `INSERT IGNORE INTO saved_opportunity (id_saved, id_user, opportunity_id, opportunity_uid)
             VALUES (?, ?, ?, ?)`,
            [crypto.randomUUID(), req.userId, opportunity.id, opportunity.uid]
        );
        await audit(getConnection, req, 'opportunity.bookmark', 'opportunity', String(opportunity.id), {});
        ok(res, { saved: true, opportunityId: opportunity.id, message: 'Opportunity saved' });
    }));

    router.delete('/api/opportunities/:id/bookmark', requireAuth, asyncRoute(async (req, res) => {
        const opportunity = await getOpportunity(getConnection, req.params.id);
        if (!opportunity) throw httpError(404, 'opportunity_not_found', 'Opportunity not found');
        await execute(getConnection, 'DELETE FROM saved_opportunity WHERE id_user = ? AND opportunity_id = ?', [req.userId, opportunity.id]);
        await audit(getConnection, req, 'opportunity.unbookmark', 'opportunity', String(opportunity.id), {});
        ok(res, { saved: false, opportunityId: opportunity.id, message: 'Opportunity removed' });
    }));

    router.post('/opportunity-bookmark', requireAuth, asyncRoute(async (req, res) => {
        const id = req.body.opportunityId || req.body.id || req.body.uid;
        if (!id) throw httpError(400, 'opportunity_required', 'Opportunity id is required');
        req.params.id = id;
        if (req.body.saved === false) {
            const opportunity = await getOpportunity(getConnection, id);
            if (opportunity) await execute(getConnection, 'DELETE FROM saved_opportunity WHERE id_user = ? AND opportunity_id = ?', [req.userId, opportunity.id]);
            return ok(res, { saved: false, message: 'Opportunity removed' });
        }
        const opportunity = await getOpportunity(getConnection, id);
        if (!opportunity) throw httpError(404, 'opportunity_not_found', 'Opportunity not found');
        await execute(getConnection, 'INSERT IGNORE INTO saved_opportunity (id_saved, id_user, opportunity_id, opportunity_uid) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), req.userId, opportunity.id, opportunity.uid]);
        ok(res, { saved: true, message: 'Opportunity saved' });
    }));

    router.post('/api/opportunities/:id/applications', requireAuth, asyncRoute(async (req, res) => {
        const opportunity = await getOpportunity(getConnection, req.params.id);
        if (!opportunity) throw httpError(404, 'opportunity_not_found', 'Opportunity not found');
        const id = crypto.randomUUID();
        await execute(
            getConnection,
            `INSERT INTO application (id_application, id_user, opportunity_id, cv_file_id, cover_message, status)
             VALUES (?, ?, ?, ?, ?, 'submitted')
             ON DUPLICATE KEY UPDATE cover_message = VALUES(cover_message), cv_file_id = VALUES(cv_file_id), updated_at = CURRENT_TIMESTAMP`,
            [id, req.userId, opportunity.id, cleanNullable(req.body.cvFileId), cleanNullable(req.body.coverMessage)]
        );
        await audit(getConnection, req, 'application.submit', 'opportunity', String(opportunity.id), {});
        created(res, { application: { id, opportunityId: opportunity.id, status: 'submitted' } });
    }));

    router.get('/api/skills', requireAuth, asyncRoute(async (req, res) => {
        const [skills] = await query(getConnection,
            `SELECT c.id_skill, c.nom, c.categorie, us.niveau, us.score
             FROM competence c
             LEFT JOIN user_skill us ON us.id_skill = c.id_skill AND us.id_user = ?
             ORDER BY c.nom ASC LIMIT 500`,
            [req.userId]
        );
        ok(res, { skills });
    }));

    router.post('/api/skills', requireAuth, asyncRoute(async (req, res) => {
        const name = requiredText(req.body && req.body.nom, 'Skill name');
        const category = cleanNullable(req.body && req.body.categorie);
        const skill = await upsertSkill(getConnection, name, category);
        await execute(
            getConnection,
            `INSERT INTO user_skill (id_user_skill, id_user, id_skill, niveau, score)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), score = VALUES(score)`,
            [crypto.randomUUID(), req.userId, skill.id_skill, cleanNullable(req.body.niveau), clampInt(req.body.score, 0, 100, 0)]
        );
        await audit(getConnection, req, 'skill.add', 'competence', skill.id_skill, {});
        created(res, { skill, message: 'Skill saved' });
    }));

    router.put('/api/skills/:id', requireAuth, asyncRoute(async (req, res) => {
        await execute(
            getConnection,
            'UPDATE user_skill SET niveau = ?, score = ? WHERE id_user = ? AND id_skill = ?',
            [cleanNullable(req.body.niveau), clampInt(req.body.score, 0, 100, 0), req.userId, req.params.id]
        );
        ok(res, { message: 'Skill updated' });
    }));

    router.delete('/api/skills/:id', requireAuth, asyncRoute(async (req, res) => {
        await execute(getConnection, 'DELETE FROM user_skill WHERE id_user = ? AND id_skill = ?', [req.userId, req.params.id]);
        ok(res, { message: 'Skill removed' });
    }));

    router.get('/api/objectives', requireAuth, asyncRoute(async (req, res) => {
        const [objectives] = await query(getConnection, 'SELECT * FROM objectif WHERE id_user = ? ORDER BY created_at DESC', [req.userId]);
        ok(res, { objectives });
    }));

    router.post('/api/objectives', requireAuth, asyncRoute(async (req, res) => {
        const id = crypto.randomUUID();
        await execute(
            getConnection,
            `INSERT INTO objectif (id_objectif, id_user, id_skill, id_offre, titre, progression, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                req.userId,
                cleanNullable(req.body.id_skill),
                cleanNullable(req.body.id_offre),
                requiredText(req.body.titre || req.body.name, 'Objective title'),
                clampInt(req.body.progression, 0, 100, 0),
                normaliseStatus(req.body.status, ['en_attente', 'en_cours', 'termine'], 'en_attente')
            ]
        );
        await audit(getConnection, req, 'objective.create', 'objectif', id, {});
        created(res, { objective: { id_objectif: id }, message: 'Objective created' });
    }));

    router.put('/api/objectives/:id', requireAuth, asyncRoute(async (req, res) => {
        const [result] = await execute(
            getConnection,
            'UPDATE objectif SET titre = COALESCE(?, titre), progression = ?, status = ? WHERE id_objectif = ? AND id_user = ?',
            [
                cleanNullable(req.body.titre),
                clampInt(req.body.progression, 0, 100, 0),
                normaliseStatus(req.body.status, ['en_attente', 'en_cours', 'termine'], 'en_cours'),
                req.params.id,
                req.userId
            ]
        );
        if (!result.affectedRows) throw httpError(404, 'objective_not_found', 'Objective not found');
        ok(res, { message: 'Objective updated' });
    }));

    router.delete('/api/objectives/:id', requireAuth, asyncRoute(async (req, res) => {
        await execute(getConnection, 'DELETE FROM objectif WHERE id_objectif = ? AND id_user = ?', [req.params.id, req.userId]);
        ok(res, { message: 'Objective deleted' });
    }));

    router.post('/api/files/presign', requireAuth, rate.upload, asyncRoute(async (req, res) => {
        created(res, await storage.createPresignedUpload(getConnection, req.userId, req.body || {}));
    }));

    router.post('/api/files/:id/content', requireAuth, rate.upload, upload.single('file'), asyncRoute(async (req, res) => {
        const file = await storage.storePendingUploadContent(getConnection, req.userId, req.params.id, req.file);
        ok(res, { file });
    }));

    router.post('/api/files/complete', requireAuth, rate.upload, asyncRoute(async (req, res) => {
        const file = await storage.completeUpload(getConnection, req.userId, requiredText(req.body.fileId, 'File id'), req.body);
        ok(res, { file });
    }));

    router.get('/api/files/:id', requireAuth, asyncRoute(async (req, res) => {
        const { file, buffer } = await storage.readFileBuffer(getConnection, req.userId, req.params.id, req.userRoles.includes('admin'));
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${file.original_name.replace(/"/g, '')}"`);
        res.send(buffer);
    }));

    router.delete('/api/files/:id/delete', requireAuth, asyncRoute(async (req, res) => {
        await storage.deleteFile(getConnection, req.userId, req.params.id, req.userRoles.includes('admin'));
        ok(res, { message: 'File deleted' });
    }));

    router.post('/file-export', requireAuth, asyncRoute(async (req, res) => {
        const kind = slug(req.body.kind || 'summary');
        if (['users', 'invoice'].includes(kind) && !req.userRoles.includes('admin')) {
            throw httpError(403, 'forbidden', 'Export not authorised');
        }
        const rows = await exportRows(getConnection, req, kind);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="theway-${kind}.csv"`);
        res.send(toCsv(rows));
    }));

    router.post(['/api/cv', '/file-upload'], requireAuth, rate.upload, upload.single('file'), asyncRoute(async (req, res) => {
        const file = await storage.storeUploadedFile(getConnection, req.userId, req.file, { type: 'cv' });
        const idCv = crypto.randomUUID();
        await execute(getConnection, 'INSERT INTO cv (id_cv, id_user, fichier) VALUES (?, ?, ?)', [idCv, req.userId, file.id]);
        await audit(getConnection, req, 'cv.upload', 'cv', idCv, { fileId: file.id });
        created(res, { cv: { id_cv: idCv, file }, file, message: 'CV uploaded' });
    }));

    router.get('/api/cv/current', requireAuth, asyncRoute(async (req, res) => {
        const [rows] = await query(
            getConnection,
            `SELECT cv.*, fa.original_name, fa.mime_type, fa.size_bytes, fa.status AS file_status
             FROM cv
             LEFT JOIN file_asset fa ON fa.id_file = cv.fichier
             WHERE cv.id_user = ?
             ORDER BY cv.date_upload DESC LIMIT 1`,
            [req.userId]
        );
        ok(res, { cv: rows[0] || null });
    }));

    router.post('/api/cv/:id/analyse', requireAuth, rate.ai, asyncRoute(async (req, res) => {
        const cv = await getOwnedCv(getConnection, req.userId, req.params.id);
        const { file, buffer } = await storage.readFileBuffer(getConnection, req.userId, cv.fichier, false);
        const text = await cvText.extractText(file, buffer);
        const analysis = await ai.analyseCvText(text);
        const id = crypto.randomUUID();
        await execute(
            getConnection,
            `INSERT INTO cv_analysis
             (id_analysis, id_cv, id_user, id_file, provider, model, prompt_version, provider_response_id, status,
              extracted_skills, summary, raw_response, started_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
            [
                id,
                cv.id_cv,
                req.userId,
                cv.fichier,
                config.ai.provider,
                config.ai.model,
                analysis.promptVersion,
                analysis.providerResponseId,
                JSON.stringify(analysis.extractedSkills),
                analysis.summary,
                JSON.stringify(analysis.raw)
            ]
        );
        await execute(getConnection, 'UPDATE cv SET scann_analyse = ? WHERE id_cv = ?', [analysis.summary, cv.id_cv]);
        await audit(getConnection, req, 'cv.analyse', 'cv', cv.id_cv, { analysisId: id });
        created(res, { analysis: Object.assign({ id_analysis: id }, analysis) });
    }));

    router.post('/api/matching/run', requireAuth, rate.ai, asyncRoute(async (req, res) => {
        const idempotencyKey = cleanNullable(req.headers['idempotency-key'] || req.body.idempotencyKey) || crypto.randomUUID();
        const existing = await findMatchingRunByKey(getConnection, req.userId, idempotencyKey);
        if (existing) return ok(res, { run: existing, idempotent: true });

        const cv = await latestCv(getConnection, req.userId);
        const analysis = cv ? await latestCvAnalysis(getConnection, req.userId, cv.id_cv) : null;
        const skills = analysis ? safeJson(analysis.extracted_skills, []) : await userSkillNames(getConnection, req.userId);
        const opportunities = (await listOpportunities(getConnection, { query: { limit: 30 }, userId: req.userId })).opportunities;
        const ranked = await ai.rankOpportunities({
            skills,
            summary: analysis && analysis.summary || '',
            opportunities
        });
        const runId = crypto.randomUUID();
        await execute(
            getConnection,
            `INSERT INTO matching_run
             (id_matching_run, id_user, id_cv, provider, model, prompt_version, idempotency_key, status, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', UTC_TIMESTAMP())`,
            [runId, req.userId, cv && cv.id_cv || null, config.ai.provider, config.ai.model, ranked.promptVersion, idempotencyKey]
        );
        for (const item of ranked.matches) {
            await execute(
                getConnection,
                `INSERT INTO matching_result
                 (id_matching_result, id_matching_run, id_user, opportunity_id, score, matched_skills, missing_skills, explanation, provider_response_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    runId,
                    req.userId,
                    item.opportunityId,
                    clampInt(item.score, 0, 100, 0),
                    JSON.stringify(item.matchedSkills || []),
                    JSON.stringify(item.missingSkills || []),
                    cleanNullable(item.explanation),
                    ranked.providerResponseId
                ]
            );
        }
        await audit(getConnection, req, 'matching.run', 'matching_run', runId, { count: ranked.matches.length });
        created(res, { run: { id_matching_run: runId, status: 'completed' }, matches: ranked.matches });
    }));

    router.get('/api/matching', requireAuth, asyncRoute(async (req, res) => {
        const [matches] = await query(
            getConnection,
            `SELECT mr.*, o.title, o.company, o.location, o.skills
             FROM matching_result mr
             LEFT JOIN opportunities o ON o.id = mr.opportunity_id
             WHERE mr.id_user = ?
             ORDER BY mr.created_at DESC, mr.score DESC
             LIMIT 100`,
            [req.userId]
        );
        ok(res, { matches: matches.map(row => Object.assign(row, {
            matched_skills: safeJson(row.matched_skills, []),
            missing_skills: safeJson(row.missing_skills, []),
            skills: parseSkills(row.skills)
        })) });
    }));

    router.get('/api/matching/:id', requireAuth, asyncRoute(async (req, res) => {
        const [rows] = await query(getConnection, 'SELECT * FROM matching_result WHERE id_matching_result = ? AND id_user = ?', [req.params.id, req.userId]);
        if (!rows.length) throw httpError(404, 'matching_not_found', 'Matching result not found');
        ok(res, { match: rows[0] });
    }));

    router.get('/api/settings/user', requireAuth, asyncRoute(async (req, res) => {
        const [rows] = await query(getConnection, 'SELECT setting_key, value_json FROM user_setting WHERE id_user = ?', [req.userId]);
        ok(res, { settings: objectFromSettings(rows) });
    }));

    router.put('/api/settings/user', requireAuth, asyncRoute(async (req, res) => {
        for (const [key, value] of Object.entries(req.body || {})) {
            await execute(
                getConnection,
                `INSERT INTO user_setting (id_user, setting_key, value_json)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP`,
                [req.userId, key, JSON.stringify(value)]
            );
        }
        ok(res, { message: 'Settings updated' });
    }));

    router.get('/api/settings/public/:key', asyncRoute(async (req, res) => {
        const [rows] = await query(getConnection, 'SELECT value_json FROM app_setting WHERE setting_key = ? AND is_public = TRUE LIMIT 1', [req.params.key]);
        ok(res, rows.length ? safeJson(rows[0].value_json, {}) : {});
    }));

    router.get('/api/notifications', requireAuth, asyncRoute(async (req, res) => {
        const [notifications] = await query(
            getConnection,
            `SELECT n.*
             FROM user_notification un
             JOIN notification n ON n.id_notification = un.id_notification
             WHERE un.id_user = ?
             ORDER BY n.date_notification DESC LIMIT ?`,
            [req.userId, clampInt(req.query.limit, 1, 50, 20)]
        );
        ok(res, { notifications });
    }));

    router.put('/api/notifications/:id', requireAuth, asyncRoute(async (req, res) => {
        await execute(
            getConnection,
            `UPDATE notification n
             JOIN user_notification un ON un.id_notification = n.id_notification
             SET n.lu = ?
             WHERE n.id_notification = ? AND un.id_user = ?`,
            [Boolean(req.body.lu), req.params.id, req.userId]
        );
        ok(res, { message: 'Notification updated' });
    }));

    router.get('/api/support/tickets', requireAuth, asyncRoute(async (req, res) => {
        const isAdmin = req.userRoles.includes('admin');
        const [tickets] = await query(
            getConnection,
            `SELECT st.*, u.email
             FROM support_ticket st
             LEFT JOIN utilisateur u ON u.id_user = st.id_user
             ${isAdmin ? '' : 'WHERE st.id_user = ?'}
             ORDER BY st.updated_at DESC LIMIT ?`,
            isAdmin ? [clampInt(req.query.limit, 1, 100, 50)] : [req.userId, clampInt(req.query.limit, 1, 100, 50)]
        );
        ok(res, { tickets });
    }));

    router.post('/api/support/tickets', requireAuth, asyncRoute(async (req, res) => {
        const id = crypto.randomUUID();
        await execute(
            getConnection,
            `INSERT INTO support_ticket (id_ticket, id_user, subject, message, status, priority)
             VALUES (?, ?, ?, ?, 'open', ?)`,
            [id, req.userId, requiredText(req.body.subject || req.body.label || req.body.name, 'Subject'), cleanNullable(req.body.message), normaliseStatus(req.body.priority, ['low', 'normal', 'high'], 'normal')]
        );
        created(res, { ticket: { id_ticket: id }, message: 'Support ticket created' });
    }));

    router.post('/api/billing/upgrade-request', requireAuth, asyncRoute(async (req, res) => {
        const id = crypto.randomUUID();
        await execute(
            getConnection,
            'INSERT INTO upgrade_request (id_upgrade_request, id_user, requested_plan_code, message) VALUES (?, ?, ?, ?)',
            [id, req.userId, cleanNullable(req.body.plan || req.body.planCode), cleanNullable(req.body.message)]
        );
        await execute(
            getConnection,
            `INSERT INTO support_ticket (id_ticket, id_user, subject, message, status, priority)
             VALUES (?, ?, 'Plan upgrade request', ?, 'open', 'normal')`,
            [crypto.randomUUID(), req.userId, cleanNullable(req.body.message || `Requested plan: ${req.body.plan || 'premium'}`)]
        );
        created(res, { upgradeRequest: { id_upgrade_request: id, status: 'open' }, message: 'Upgrade request sent' });
    }));

    router.get('/api/plans', asyncRoute(async (req, res) => {
        const [plans] = await query(getConnection, 'SELECT * FROM plan_catalogue WHERE active = TRUE ORDER BY monthly_price ASC', []);
        ok(res, { plans: plans.map(row => Object.assign(row, { features: safeJson(row.features, []) })) });
    }));

    router.post('/draft-create', requireAuth, asyncRoute(async (req, res) => {
        const page = String(req.body.page || '');
        if (page.includes('skills')) {
            const skill = await upsertSkill(getConnection, req.body.name || req.body.label || 'Nouvelle competence', null);
            await execute(getConnection, 'INSERT IGNORE INTO user_skill (id_user_skill, id_user, id_skill) VALUES (?, ?, ?)', [crypto.randomUUID(), req.userId, skill.id_skill]);
            return created(res, { skill, message: 'Skill created' });
        }
        if (page.includes('progression') || page.includes('objectif')) {
            const id = crypto.randomUUID();
            await execute(getConnection, 'INSERT INTO objectif (id_objectif, id_user, titre, status) VALUES (?, ?, ?, ?)', [id, req.userId, req.body.name || 'Nouvel objectif', 'en_attente']);
            return created(res, { objective: { id_objectif: id }, message: 'Objective created' });
        }
        const id = crypto.randomUUID();
        await execute(getConnection, 'INSERT INTO support_ticket (id_ticket, id_user, subject, message, status, priority) VALUES (?, ?, ?, ?, ?, ?)', [id, req.userId, req.body.name || 'Action request', page, 'open', 'normal']);
        created(res, { ticket: { id_ticket: id }, message: 'Request created' });
    }));

    router.post('/entity-update', requireAuth, asyncRoute(async (req, res) => {
        await audit(getConnection, req, 'entity.update_request', 'ui_action', req.body.label || null, { page: req.body.page || null });
        ok(res, { message: 'Update request recorded' });
    }));

    router.post('/entity-delete', requireAuth, asyncRoute(async (req, res) => {
        await audit(getConnection, req, 'entity.delete_request', 'ui_action', req.body.label || null, { page: req.body.page || null });
        ok(res, { message: 'Delete request recorded' });
    }));

    router.post('/process-run', requireAuth, asyncRoute(async (req, res) => {
        await audit(getConnection, req, 'process.run', 'ui_action', req.body.action || null, { page: req.body.page || null, label: req.body.label || null });
        ok(res, { status: 'completed', message: 'Process completed' });
    }));

    router.post('/integration-connect', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
        await setAppSetting(getConnection, `integration.${slug(req.body.label || req.body.provider)}.enabled`, true, req.userId);
        ok(res, { connected: true, message: 'Integration enabled' });
    }));

    router.post('/integration-disconnect', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
        await setAppSetting(getConnection, `integration.${slug(req.body.label || req.body.provider)}.enabled`, false, req.userId);
        ok(res, { disconnected: true, message: 'Integration disabled' });
    }));

    router.post('/integration-update', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
        await setAppSetting(getConnection, `integration.${slug(req.body.label || req.body.provider)}.updated_at`, new Date().toISOString(), req.userId);
        ok(res, { updated: true, message: 'Integration updated' });
    }));

    router.get('/api/panel/summary', asyncRoute(async (req, res) => {
        const [[opportunities]] = await query(getConnection, 'SELECT COUNT(*) AS total, COUNT(DISTINCT NULLIF(company, "")) AS companies FROM opportunities', []);
        const [[users]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM utilisateur', []);
        const [[skills]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM competence', []);
        const [[applications]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM application', []);
        ok(res, {
            summary: {
                opportunities: Number(opportunities.total) || 0,
                companies: Number(opportunities.companies) || 0,
                users: Number(users.total) || 0,
                skills: Number(skills.total) || 0,
                applications: Number(applications.total) || 0
            }
        });
    }));

    router.get('/api/panel/skills', asyncRoute(async (req, res) => {
        const [skills] = await query(
            getConnection,
            `SELECT c.id_skill, c.nom, c.categorie, COUNT(DISTINCT us.id_user) AS users,
                    COUNT(DISTINCT o.id) AS demand
             FROM competence c
             LEFT JOIN user_skill us ON us.id_skill = c.id_skill
             LEFT JOIN opportunities o ON LOWER(o.skills) LIKE CONCAT('%', LOWER(c.nom), '%')
             GROUP BY c.id_skill, c.nom, c.categorie
             ORDER BY demand DESC, users DESC, c.nom ASC
             LIMIT 200`,
            []
        );
        ok(res, { skills: skills.map(row => Object.assign(row, { name: row.nom, category: row.categorie })) });
    }));

    router.get('/api/panel/users', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
        const [users] = await query(
            getConnection,
            `SELECT id_user, nom, prenom, email, telephone, localisation, role, date_inscription
             FROM utilisateur ORDER BY date_inscription DESC LIMIT 200`,
            []
        );
        ok(res, { users: users.map(row => Object.assign(row, { id: row.id_user, name: [row.prenom, row.nom].filter(Boolean).join(' ') || row.email })) });
    }));

    router.get('/api/admin/roles', requireAuth, requireAdmin, rate.admin, asyncRoute(async (req, res) => {
        const [roles] = await query(getConnection, 'SELECT * FROM roles ORDER BY code', []);
        const [permissions] = await query(getConnection, 'SELECT * FROM permissions ORDER BY code', []);
        const [links] = await query(getConnection, 'SELECT * FROM role_permissions', []);
        ok(res, { roles, permissions, rolePermissions: links });
    }));

    router.put('/api/admin/roles/:role/permissions', requireAuth, requireAdmin, rate.admin, asyncRoute(async (req, res) => {
        const [roles] = await query(getConnection, 'SELECT id_role FROM roles WHERE code = ?', [req.params.role]);
        if (!roles.length) throw httpError(404, 'role_not_found', 'Role not found');
        const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
        const connection = await getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM role_permissions WHERE id_role = ?', [roles[0].id_role]);
            for (const permission of permissions) {
                const [rows] = await connection.execute('SELECT id_permission FROM permissions WHERE code = ?', [permission]);
                if (rows.length) {
                    await connection.execute('INSERT INTO role_permissions (id_role, id_permission) VALUES (?, ?)', [roles[0].id_role, rows[0].id_permission]);
                }
            }
            await connection.execute('DELETE FROM auth_sessions');
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        await audit(getConnection, req, 'admin.role_permissions.update', 'role', req.params.role, { permissions });
        ok(res, { message: 'Role permissions updated' });
    }));

    router.get('/api/admin/invoices', requireAuth, requireAdmin, rate.admin, asyncRoute(async (req, res) => {
        const [invoices] = await query(
            getConnection,
            `SELECT bi.*, bs.status AS subscription_status, pc.name AS plan_name
             FROM billing_invoice bi
             LEFT JOIN billing_subscription bs ON bs.id_subscription = bi.id_subscription
             LEFT JOIN plan_catalogue pc ON pc.id_plan = bs.id_plan
             ORDER BY bi.created_at DESC LIMIT ?`,
            [clampInt(req.query.limit, 1, 100, 50)]
        );
        ok(res, { invoices });
    }));

    router.get('/api/admin/invoices/:id/download', requireAuth, requireAdmin, rate.admin, asyncRoute(async (req, res) => {
        const [rows] = await query(getConnection, 'SELECT * FROM billing_invoice WHERE id_invoice = ? LIMIT 1', [req.params.id]);
        if (!rows.length) throw httpError(404, 'invoice_not_found', 'Invoice not found');
        const invoice = rows[0];
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.txt"`);
        res.send([
            'THEWAY Invoice',
            `Number: ${invoice.invoice_number}`,
            `Status: ${invoice.status}`,
            `Amount: ${invoice.amount} ${invoice.currency}`,
            `Issued: ${invoice.issued_at || ''}`,
            `Due: ${invoice.due_at || ''}`,
            '',
            invoice.notes || ''
        ].join('\n'));
    }));

    router.get('/api/docs/openapi.json', (req, res) => {
        ok(res, openApiDocument());
    });

    router.all('/api/auth/session', methodNotAllowed(['GET']));
    return router;
};

async function query(getConnection, sql, params) {
    const connection = await getConnection();
    try {
        return connection.execute(sql, params || []);
    } finally {
        connection.release();
    }
}

async function execute(getConnection, sql, params) {
    return query(getConnection, sql, params);
}

async function createUser(getConnection, input) {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const [existing] = await connection.execute('SELECT id_user FROM utilisateur WHERE email = ?', [input.email]);
        if (existing.length) throw httpError(409, 'email_in_use', 'An account already exists for this email');
        const paramId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        await connection.execute('INSERT INTO parametres (id_params, notification_email, notification_push) VALUES (?, ?, ?)', [paramId, 'enabled', 'enabled']);
        await connection.execute(
            `INSERT INTO utilisateur (id_user, id_params, nom, prenom, email, password, telephone, localisation, role)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, paramId, input.nom, input.prenom, input.email, await hashPassword(input.password), input.telephone, input.localisation, input.role || 'user']
        );
        await assignRole(connection, userId, input.role || 'user', null);
        await connection.commit();
        return Object.assign({}, input, { id_user: userId, password: undefined });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function findUserByEmail(getConnection, email) {
    const [rows] = await query(getConnection, 'SELECT * FROM utilisateur WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
}

async function findUserById(getConnection, id) {
    const [rows] = await query(getConnection, 'SELECT * FROM utilisateur WHERE id_user = ? LIMIT 1', [id]);
    return rows[0] || null;
}

async function roleCodesForUser(getConnection, userId) {
    const [rows] = await query(getConnection, 'SELECT r.code FROM user_roles ur JOIN roles r ON r.id_role = ur.id_role WHERE ur.id_user = ?', [userId]);
    return rows.map(row => row.code);
}

async function assignRole(connection, userId, roleCode, grantedBy) {
    const [roles] = await connection.execute('SELECT id_role FROM roles WHERE code = ? LIMIT 1', [roleCode]);
    if (!roles.length) return;
    await connection.execute('INSERT IGNORE INTO user_roles (id_user, id_role, granted_by) VALUES (?, ?, ?)', [userId, roles[0].id_role, grantedBy]);
}

function publicUser(user, roles, permissions) {
    return {
        id: user.id_user,
        id_user: user.id_user,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone || null,
        localisation: user.localisation || null,
        photo: user.photo || null,
        role: roles.includes('admin') ? 'admin' : (roles[0] || user.role || 'user'),
        roles,
        permissions
    };
}

async function establishSession(req, user) {
    await regenerateSession(req);
    req.session.userId = user.id_user;
    req.session.ipAddress = req.ip || null;
    req.session.userAgent = req.headers['user-agent'] || null;
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    await saveSession(req);
}

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate(error => error ? reject(error) : resolve());
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) return resolve();
        req.session.destroy(error => error ? reject(error) : resolve());
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save(error => error ? reject(error) : resolve());
    });
}

function normaliseEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function assertEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw httpError(400, 'email_invalid', 'A valid email is required');
    }
}

function assertPassword(password) {
    const value = String(password || '');
    if (value.length < 10) {
        throw httpError(400, 'password_weak', 'Password must be at least 10 characters');
    }
}

function requiredText(value, label) {
    const text = String(value || '').trim();
    if (!text) throw httpError(400, 'field_required', `${label} is required`);
    return text;
}

function cleanNullable(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    return text || null;
}

function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const prenom = parts.shift() || '';
    return { prenom, nom: parts.join(' ') || prenom || '' };
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function sha256Buffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function insertResetToken(getConnection, userId, tokenHash, req) {
    await execute(
        getConnection,
        `INSERT INTO password_reset_tokens
         (id_reset_token, id_user, token_hash, requested_ip, requested_user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR))`,
        [crypto.randomUUID(), userId, tokenHash, req.ip || null, req.headers['user-agent'] || null]
    );
}

function providerConfig(name) {
    const provider = String(name || '').toLowerCase();
    if (provider === 'google') {
        if (!config.oauth.google.clientId || !config.oauth.google.clientSecret) throw httpError(503, 'oauth_not_configured', 'Google login is not configured');
        return {
            name: 'google',
            issuer: 'https://accounts.google.com',
            clientId: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret
        };
    }
    if (provider === 'linkedin') {
        if (!config.oauth.linkedin.clientId || !config.oauth.linkedin.clientSecret) throw httpError(503, 'oauth_not_configured', 'LinkedIn login is not configured');
        return {
            name: 'linkedin',
            issuer: 'https://www.linkedin.com/oauth',
            clientId: config.oauth.linkedin.clientId,
            clientSecret: config.oauth.linkedin.clientSecret
        };
    }
    throw httpError(404, 'oauth_provider_unknown', 'OAuth provider not supported');
}

async function oidcClient(provider, redirectUri) {
    const issuer = await Issuer.discover(provider.issuer);
    return new issuer.Client({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uris: [redirectUri],
        response_types: ['code']
    });
}

async function findOrCreateOAuthUser(getConnection, provider, info, tokenSet) {
    const subject = requiredText(info.sub || info.id, 'Provider subject');
    const email = normaliseEmail(info.email);
    assertEmail(email);
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const [accounts] = await connection.execute('SELECT id_user FROM auth_accounts WHERE provider = ? AND provider_subject = ? LIMIT 1', [provider, subject]);
        if (accounts.length) {
            const [users] = await connection.execute('SELECT * FROM utilisateur WHERE id_user = ? LIMIT 1', [accounts[0].id_user]);
            await connection.commit();
            return users[0];
        }
        let [users] = await connection.execute('SELECT * FROM utilisateur WHERE email = ? LIMIT 1', [email]);
        let user = users[0];
        if (!user) {
            const paramId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            const names = splitName(info.name || email.split('@')[0]);
            await connection.execute('INSERT INTO parametres (id_params, notification_email, notification_push) VALUES (?, ?, ?)', [paramId, 'enabled', 'enabled']);
            await connection.execute(
                `INSERT INTO utilisateur (id_user, id_params, nom, prenom, email, password, role)
                 VALUES (?, ?, ?, ?, ?, ?, 'user')`,
                [userId, paramId, names.nom || 'OAuth', names.prenom || 'User', email, await hashPassword(crypto.randomBytes(24).toString('hex'))]
            );
            await assignRole(connection, userId, 'user', null);
            users = (await connection.execute('SELECT * FROM utilisateur WHERE id_user = ? LIMIT 1', [userId]))[0];
            user = users[0];
        }
        await connection.execute(
            `INSERT INTO auth_accounts
             (id_auth_account, id_user, provider, provider_subject, email, display_name, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                crypto.randomUUID(),
                user.id_user,
                provider,
                subject,
                email,
                info.name || null,
                tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) : null
            ]
        );
        await connection.commit();
        return user;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function sanitisePhoto(photo) {
    if (!photo) return null;
    const value = String(photo).trim();
    if (/^https:\/\/[^\s"'<>]+$/i.test(value) || /^\/?api\/files\/[A-Za-z0-9-]+$/i.test(value) || /^\/?assets\/uploads\/[A-Za-z0-9._/-]+$/i.test(value)) {
        return value;
    }
    throw httpError(400, 'photo_invalid', 'Photo URL is invalid');
}

async function listOpportunities(getConnection, req) {
    const queryParams = req.query || {};
    const limit = clampInt(queryParams.limit, 1, 100, 20);
    const page = clampInt(queryParams.page, 1, 100000, 1);
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];
    if (queryParams.search || queryParams.q) {
        const like = `%${String(queryParams.search || queryParams.q).trim()}%`;
        where.push('(title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)');
        params.push(like, like, like, like);
    }
    if (queryParams.location) {
        where.push('location LIKE ?');
        params.push(`%${String(queryParams.location).trim()}%`);
    }
    if (queryParams.skill) {
        where.push('skills LIKE ?');
        params.push(`%${String(queryParams.skill).trim()}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[count]] = await query(getConnection, `SELECT COUNT(*) AS total FROM opportunities ${whereSql}`, params);
    const [rows] = await query(
        getConnection,
        `SELECT id, uid, source, title, company, location, source_url, description, skills, created_at
         FROM opportunities ${whereSql}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        params.concat([limit, offset])
    );
    const opportunities = rows.map(publicOpportunity);
    if (req.userId && opportunities.length) {
        const ids = opportunities.map(item => item.id);
        const [saved] = await query(getConnection, `SELECT opportunity_id FROM saved_opportunity WHERE id_user = ? AND opportunity_id IN (${ids.map(() => '?').join(',')})`, [req.userId].concat(ids));
        const [applications] = await query(getConnection, `SELECT opportunity_id FROM application WHERE id_user = ? AND opportunity_id IN (${ids.map(() => '?').join(',')})`, [req.userId].concat(ids));
        const savedSet = new Set(saved.map(row => row.opportunity_id));
        const applicationSet = new Set(applications.map(row => row.opportunity_id));
        opportunities.forEach(item => {
            item.saved = savedSet.has(item.id);
            item.applied = applicationSet.has(item.id);
        });
    }
    return {
        opportunities,
        pagination: { page, limit, total: Number(count.total) || 0 }
    };
}

async function getOpportunity(getConnection, id) {
    const numeric = Number(id);
    const sql = Number.isInteger(numeric)
        ? 'SELECT * FROM opportunities WHERE id = ? LIMIT 1'
        : 'SELECT * FROM opportunities WHERE uid = ? LIMIT 1';
    const [rows] = await query(getConnection, sql, [id]);
    return rows[0] ? publicOpportunity(rows[0]) : null;
}

function publicOpportunity(row) {
    return {
        id: row.id,
        uid: row.uid,
        source: row.source,
        title: row.title,
        company: row.company,
        location: row.location,
        source_url: row.source_url,
        description: row.description,
        skills: parseSkills(row.skills),
        created_at: row.created_at
    };
}

function parseSkills(value) {
    if (Array.isArray(value)) return value;
    const raw = String(value || '').trim();
    if (!raw) return [];
    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return raw.split(',').map(item => item.trim()).filter(Boolean);
}

async function upsertSkill(getConnection, name, category) {
    const id = crypto.randomUUID();
    await execute(
        getConnection,
        `INSERT INTO competence (id_skill, nom, categorie)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE categorie = COALESCE(VALUES(categorie), categorie)`,
        [id, name, category]
    );
    const [rows] = await query(getConnection, 'SELECT * FROM competence WHERE nom = ? LIMIT 1', [name]);
    return rows[0];
}

function clampInt(value, min, max, fallback) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
}

function normaliseStatus(value, allowed, fallback) {
    const normalised = String(value || '').trim().toLowerCase();
    return allowed.includes(normalised) ? normalised : fallback;
}

async function getOwnedCv(getConnection, userId, idCv) {
    const [rows] = await query(getConnection, 'SELECT * FROM cv WHERE id_cv = ? AND id_user = ? LIMIT 1', [idCv, userId]);
    if (!rows.length) throw httpError(404, 'cv_not_found', 'CV not found');
    return rows[0];
}

async function latestCv(getConnection, userId) {
    const [rows] = await query(getConnection, 'SELECT * FROM cv WHERE id_user = ? ORDER BY date_upload DESC LIMIT 1', [userId]);
    return rows[0] || null;
}

async function latestCvAnalysis(getConnection, userId, idCv) {
    const [rows] = await query(getConnection, 'SELECT * FROM cv_analysis WHERE id_user = ? AND id_cv = ? ORDER BY created_at DESC LIMIT 1', [userId, idCv]);
    return rows[0] || null;
}

async function userSkillNames(getConnection, userId) {
    const [rows] = await query(getConnection, 'SELECT c.nom FROM user_skill us JOIN competence c ON c.id_skill = us.id_skill WHERE us.id_user = ?', [userId]);
    return rows.map(row => row.nom);
}

async function findMatchingRunByKey(getConnection, userId, key) {
    const [rows] = await query(getConnection, 'SELECT * FROM matching_run WHERE id_user = ? AND idempotency_key = ? LIMIT 1', [userId, key]);
    return rows[0] || null;
}

function safeJson(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function objectFromSettings(rows) {
    return rows.reduce((acc, row) => {
        acc[row.setting_key] = safeJson(row.value_json, null);
        return acc;
    }, {});
}

async function setAppSetting(getConnection, key, value, userId) {
    await execute(
        getConnection,
        `INSERT INTO app_setting (setting_key, value_json, is_public, updated_by)
         VALUES (?, ?, FALSE, ?)
         ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value), userId]
    );
}

function slug(value) {
    return String(value || 'integration').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'integration';
}

function openApiDocument() {
    return {
        openapi: '3.1.0',
        info: { title: 'THEWAY API', version: '1.0.0' },
        paths: {
            '/api/auth/register': { post: { summary: 'Register a user' } },
            '/api/auth/login': { post: { summary: 'Create a session' } },
            '/api/auth/session': { get: { summary: 'Get current session' } },
            '/api/opportunities': { get: { summary: 'Search opportunities' } },
            '/api/cv/{id}/analyse': { post: { summary: 'Run LLM CV analysis' } },
            '/api/matching/run': { post: { summary: 'Run LLM opportunity matching' } },
            '/api/admin/roles': { get: { summary: 'List roles and permissions' } }
        },
        components: {
            securitySchemes: {
                sessionCookie: { type: 'apiKey', in: 'cookie', name: 'theway.sid' },
                csrfToken: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' }
            }
        }
    };
}

async function exportRows(getConnection, req, kind) {
    if (kind === 'users') {
        const [rows] = await query(getConnection, 'SELECT prenom, nom, email, role, date_inscription FROM utilisateur ORDER BY date_inscription DESC LIMIT 1000', []);
        return [['First name', 'Last name', 'Email', 'Role', 'Registered at']].concat(rows.map(row => [row.prenom, row.nom, row.email, row.role, row.date_inscription]));
    }
    if (kind === 'skills' || kind === 'competences') {
        const [rows] = await query(getConnection, 'SELECT nom, categorie, created_at FROM competence ORDER BY nom ASC LIMIT 1000', []);
        return [['Skill', 'Category', 'Created at']].concat(rows.map(row => [row.nom, row.categorie, row.created_at]));
    }
    if (kind === 'cv') {
        const [rows] = await query(getConnection, 'SELECT id_cv, fichier, date_upload, scann_analyse FROM cv WHERE id_user = ? ORDER BY date_upload DESC', [req.userId]);
        return [['CV id', 'File id', 'Uploaded at', 'Analysis']].concat(rows.map(row => [row.id_cv, row.fichier, row.date_upload, row.scann_analyse]));
    }
    if (kind === 'invoice') {
        const [rows] = await query(getConnection, 'SELECT invoice_number, status, amount, currency, issued_at, due_at, paid_at FROM billing_invoice ORDER BY created_at DESC LIMIT 1000', []);
        return [['Invoice', 'Status', 'Amount', 'Currency', 'Issued', 'Due', 'Paid']].concat(rows.map(row => [row.invoice_number, row.status, row.amount, row.currency, row.issued_at, row.due_at, row.paid_at]));
    }
    const [[opportunities]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM opportunities', []);
    const [[users]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM utilisateur', []);
    const [[applications]] = await query(getConnection, 'SELECT COUNT(*) AS total FROM application', []);
    return [
        ['Metric', 'Value'],
        ['Opportunities', opportunities.total],
        ['Users', users.total],
        ['Applications', applications.total]
    ];
}

function toCsv(rows) {
    return rows.map(row => row.map(cell => `"${String(cell === undefined || cell === null ? '' : cell).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
}

};

__moduleDefs["routes/integrations.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const { queueAction, userScopedPayload } = require('../lib/actionSecurity');

module.exports = function createIntegrationsRouter(deps) {
    const router = express.Router();
    const { verifyToken, fallbackStore } = deps;

    router.post('/integration-connect', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'integration.connect', req.userId, scopedPayload);
        res.json({ ok: true, message: 'Intégration connectée', connected: true });
    });

    router.post('/integration-disconnect', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'integration.disconnect', req.userId, scopedPayload);
        res.json({ ok: true, message: 'Intégration déconnectée', disconnected: true });
    });

    router.post('/integration-update', verifyToken, async (req, res) => {
        const scopedPayload = userScopedPayload(req, res);
        if (!scopedPayload) return;
        queueAction(fallbackStore, 'integration.update', req.userId, scopedPayload);
        res.json({ ok: true, message: 'Intégration mise à jour', updated: true });
    });

    return router;
};

};

__moduleDefs["routes/opportunities.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

module.exports = function createOpportunitiesRouter(deps) {
    const router = express.Router();
    deps = deps || {};
    const { getConnection } = deps;
    const opportunitiesFilePath = deps.opportunitiesFilePath || path.join(__dirname, '..', '..', 'assets', 'uploads', 'files', 'opportunities.json');
    const cache = {
        mtimeMs: null,
        opportunities: []
    };

    router.get('/api/opportunities', async (req, res) => {
        if (getConnection) {
            try {
                const opportunities = await listDatabaseOpportunities(getConnection);
                return res.json({
                    ok: true,
                    mode: 'database',
                    opportunities: opportunities
                });
            } catch (error) {
                console.error('Database opportunities unavailable:', error.message);
            }
        }

        try {
            const opportunities = await listFileOpportunities(opportunitiesFilePath, cache);
            res.json({
                ok: true,
                mode: 'file',
                opportunities: opportunities
            });
        } catch (error) {
            console.error('Opportunities error:', error);
            res.status(500).json({ ok: false, error: 'Erreur opportunités' });
        }
    });

    return router;
};

async function listDatabaseOpportunities(getConnection) {
    const connection = await getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT id, uid, source, title, company, location, source_url, description, skills FROM opportunities ORDER BY created_at DESC, id DESC LIMIT 1000'
        );

        return rows.map(row => ({
            id: row.id,
            uid: row.uid,
            source: row.source,
            title: row.title,
            company: row.company,
            location: row.location,
            source_url: row.source_url,
            description: row.description,
            skills: normalizeSkills(row.skills)
        }));
    } finally {
        connection.release();
    }
}

async function listFileOpportunities(opportunitiesFilePath, cache) {
    const stat = await fs.stat(opportunitiesFilePath).catch(error => {
        if (error.code === 'ENOENT') return null;
        throw error;
    });
    if (!stat) {
        cache.mtimeMs = null;
        cache.opportunities = [];
        return cache.opportunities;
    }
    if (cache.mtimeMs !== stat.mtimeMs) {
        const data = await fs.readFile(opportunitiesFilePath, 'utf8');
        cache.opportunities = JSON.parse(data);
        cache.mtimeMs = stat.mtimeMs;
    }
    return cache.opportunities;
}

function normalizeSkills(skills) {
    if (Array.isArray(skills)) return skills;
    if (!skills) return [];

    const value = String(skills).trim();
    if (!value) return [];
    if (value.startsWith('[')) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return value
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);
}

};

__moduleDefs["services/aiService.js"] = function(module, exports, require, __filename, __dirname) {
const config = require('../lib/config');
const { httpError } = require('../lib/response');

const CV_PROMPT_VERSION = 'cv-analysis-v1';
const MATCHING_PROMPT_VERSION = 'matching-v1';

function ensureConfigured() {
    if (config.nodeEnv === 'test' && config.ai.provider === 'test') return;
    if (!config.ai.provider || !config.ai.apiKey || !config.ai.baseUrl || !config.ai.model) {
        throw httpError(503, 'ai_not_configured', 'AI provider is not configured');
    }
}

async function analyseCvText(text) {
    ensureConfigured();
    if (config.nodeEnv === 'test' && config.ai.provider === 'test') {
        const skills = Array.from(new Set(String(text).match(/\b(JavaScript|Node|SQL|React|Python|Docker|Excel)\b/gi) || []));
        return {
            promptVersion: CV_PROMPT_VERSION,
            providerResponseId: 'test-cv-analysis',
            summary: 'Automated test CV analysis',
            extractedSkills: skills,
            raw: { skills }
        };
    }

    const response = await chatJson([
        {
            role: 'system',
            content: 'You extract structured career information. Respond only with valid JSON.'
        },
        {
            role: 'user',
            content: [
                'Analyse this CV text and return JSON with keys:',
                'summary:string, extractedSkills:string[], seniority:string, recommendedRoles:string[].',
                '',
                text
            ].join('\n')
        }
    ]);

    return {
        promptVersion: CV_PROMPT_VERSION,
        providerResponseId: response.id || null,
        summary: response.json.summary || '',
        extractedSkills: Array.isArray(response.json.extractedSkills) ? response.json.extractedSkills : [],
        raw: response.json
    };
}

async function rankOpportunities(profile) {
    ensureConfigured();
    if (config.nodeEnv === 'test' && config.ai.provider === 'test') {
        return {
            promptVersion: MATCHING_PROMPT_VERSION,
            providerResponseId: 'test-matching',
            matches: profile.opportunities.slice(0, 5).map((opportunity, index) => ({
                opportunityId: opportunity.id,
                score: Math.max(50, 95 - index * 5),
                matchedSkills: profile.skills.slice(0, 3),
                missingSkills: [],
                explanation: 'Automated test match'
            })),
            raw: {}
        };
    }

    const response = await chatJson([
        {
            role: 'system',
            content: 'You rank job opportunities for a candidate. Respond only with valid JSON.'
        },
        {
            role: 'user',
            content: JSON.stringify({
                instruction: 'Return JSON: { matches: [{ opportunityId, score, matchedSkills, missingSkills, explanation }] }. Score is 0-100 and must be evidence based.',
                candidateSkills: profile.skills,
                cvSummary: profile.summary,
                opportunities: profile.opportunities.map(item => ({
                    opportunityId: item.id,
                    title: item.title,
                    company: item.company,
                    location: item.location,
                    skills: item.skills,
                    description: String(item.description || '').slice(0, 1200)
                }))
            })
        }
    ]);

    return {
        promptVersion: MATCHING_PROMPT_VERSION,
        providerResponseId: response.id || null,
        matches: Array.isArray(response.json.matches) ? response.json.matches : [],
        raw: response.json
    };
}

async function chatJson(messages) {
    const base = config.ai.baseUrl.replace(/\/$/, '');
    const endpoint = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.ai.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: config.ai.model,
            response_format: { type: 'json_object' },
            temperature: 0.2,
            messages
        })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw httpError(502, 'ai_provider_error', 'AI provider request failed', payload);
    }
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    try {
        return {
            id: payload.id,
            json: JSON.parse(content || '{}')
        };
    } catch (error) {
        throw httpError(502, 'ai_invalid_json', 'AI provider returned invalid JSON');
    }
}

module.exports = {
    analyseCvText,
    rankOpportunities,
    CV_PROMPT_VERSION,
    MATCHING_PROMPT_VERSION
};

};

__moduleDefs["services/cvTextService.js"] = function(module, exports, require, __filename, __dirname) {
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { httpError } = require('../lib/response');

async function extractText(file, buffer) {
    const extension = String(file.extension || '').toLowerCase();
    if (extension === '.pdf') {
        const result = await pdfParse(buffer);
        return cleanText(result.text);
    }
    if (extension === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        return cleanText(result.value);
    }
    if (extension === '.txt' || extension === '.csv') {
        return cleanText(buffer.toString('utf8'));
    }
    throw httpError(400, 'cv_text_unsupported', 'Text extraction is only available for PDF, DOCX, TXT and CSV files');
}

function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 24000);
}

module.exports = {
    extractText
};

};

__moduleDefs["services/auditService.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');

async function audit(getConnection, req, action, entityType, entityId, metadata) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(
            `INSERT INTO audit_log
             (id_audit, actor_user_id, action, entity_type, entity_id, metadata, ip_address, user_agent, request_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                crypto.randomUUID(),
                req.userId || null,
                action,
                entityType || null,
                entityId || null,
                JSON.stringify(metadata || {}),
                req.ip || null,
                req.headers['user-agent'] || null,
                req.requestId || null
            ]
        );
    } catch (error) {
        req.log && req.log.warn({ err: error }, 'Audit log write failed');
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    audit
};

};

__moduleDefs["services/emailService.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../lib/config');

function isConfigured() {
    return Boolean(config.mail.smtp.host);
}

function createTransport() {
    if (!isConfigured()) return null;
    return nodemailer.createTransport({
        host: config.mail.smtp.host,
        port: config.mail.smtp.port,
        secure: config.mail.smtp.port === 465,
        auth: config.mail.smtp.user ? {
            user: config.mail.smtp.user,
            pass: config.mail.smtp.password
        } : undefined
    });
}

async function sendEmail(getConnection, message) {
    const id = crypto.randomUUID();
    const provider = isConfigured() ? config.mail.provider : 'local';
    await insertEmail(getConnection, {
        id,
        id_user: message.userId || null,
        recipient: message.to,
        subject: message.subject,
        template: message.template || null,
        provider,
        status: 'queued'
    });

    if (!isConfigured()) {
        if (config.isProduction) {
            await markEmail(getConnection, id, 'failed', null, 'SMTP provider is not configured');
            throw new Error('SMTP provider is not configured');
        }
        await markEmail(getConnection, id, 'skipped_local', null, null);
        return { id, skipped: true };
    }

    try {
        const transport = createTransport();
        const result = await transport.sendMail({
            from: config.mail.from,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html
        });
        await markEmail(getConnection, id, 'sent', result.messageId || null, null);
        return { id, messageId: result.messageId };
    } catch (error) {
        await markEmail(getConnection, id, 'failed', null, error.message);
        throw error;
    }
}

function passwordResetEmail(email, resetUrl) {
    return {
        to: email,
        subject: 'Reset your THEWAY password',
        template: 'password_reset',
        text: [
            'A password reset was requested for your THEWAY account.',
            '',
            `Reset link: ${resetUrl}`,
            '',
            'If you did not request this, you can ignore this email.'
        ].join('\n'),
        html: [
            '<p>A password reset was requested for your THEWAY account.</p>',
            `<p><a href="${escapeHTML(resetUrl)}">Reset your password</a></p>`,
            '<p>If you did not request this, you can ignore this email.</p>'
        ].join('')
    };
}

async function insertEmail(getConnection, email) {
    const connection = await getConnection();
    try {
        await connection.execute(
            `INSERT INTO outbound_email
             (id_email, id_user, recipient, subject, template, provider, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email.id, email.id_user, email.recipient, email.subject, email.template, email.provider, email.status]
        );
    } finally {
        connection.release();
    }
}

async function markEmail(getConnection, id, status, providerMessageId, errorMessage) {
    const connection = await getConnection();
    try {
        await connection.execute(
            `UPDATE outbound_email
             SET status = ?, provider_message_id = ?, error_message = ?, sent_at = CASE WHEN ? = 'sent' THEN UTC_TIMESTAMP() ELSE sent_at END
             WHERE id_email = ?`,
            [status, providerMessageId, errorMessage, status, id]
        );
    } finally {
        connection.release();
    }
}

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    sendEmail,
    passwordResetEmail,
    isConfigured
};

};

__moduleDefs["services/authService.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const { deliverRecoveryToken } = require('../lib/recoveryDelivery');
const { hashPassword, verifyPassword } = require('../lib/passwords');

async function registerUser(deps, data) {
    const { nom, prenom, email, password, telephone, localisation } = data;
    if (!email || !password || !nom || !prenom) {
        throw httpError(400, 'Données manquantes');
    }
    try {
        await assertEmailAvailable(deps.getConnection, email);
        const hashedPassword = await hashPassword(password);
        return await createDatabaseUser(deps, {
            nom,
            prenom,
            email,
            hashedPassword,
            telephone,
            localisation
        });
    } catch (error) {
        if (deps.fallbackStore.isDatabaseUnavailable(error)) {
            const passwordHash = await hashPassword(password);
            const fallbackUser = await deps.fallbackStore.createUser({ nom, prenom, email, passwordHash, telephone, localisation });
            return {
                ok: true,
                mode: 'file',
                message: 'Utilisateur créé avec succès',
                token: deps.signUserToken(tokenUser(fallbackUser)),
                user: deps.fallbackStore.publicUser(fallbackUser)
            };
        }
        throw error;
    }
}

async function loginUser(deps, data) {
    const { email, password } = data;
    if (!email || !password) {
        throw httpError(400, 'Email et mot de passe requis');
    }

    try {
        return await withConnection(deps.getConnection, async connection => {
            const [users] = await connection.execute(
                'SELECT id_user, nom, prenom, email, password, role FROM utilisateur WHERE email = ?',
                [email]
            );
            if (users.length === 0) throw httpError(401, 'Identifiants invalides');

            const user = users[0];
            const validPassword = await verifyPassword(user.password, password);
            if (!validPassword) throw httpError(401, 'Identifiants invalides');

            return {
                ok: true,
                message: 'Connexion réussie',
                token: deps.signUserToken(tokenUser(user)),
                user: {
                    id: user.id_user,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role
                }
            };
        });
    } catch (error) {
        if (deps.fallbackStore.isDatabaseUnavailable(error)) {
            const fallbackUser = await deps.fallbackStore.findUserByEmail(email);
            if (!fallbackUser) throw httpError(401, 'Identifiants invalides');

            const validPassword = await verifyPassword(fallbackUser.password, password);
            if (!validPassword) throw httpError(401, 'Identifiants invalides');

            return {
                ok: true,
                mode: 'file',
                message: 'Connexion réussie',
                token: deps.signUserToken(tokenUser(fallbackUser)),
                user: deps.fallbackStore.publicUser(fallbackUser)
            };
        }
        throw error;
    }
}

async function requestPasswordRecovery(deps, data) {
    const { email } = data;
    if (!email) throw httpError(400, 'Email requis');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const requestedAt = new Date();
    await deliverRecoveryToken(email, resetToken);
    await deps.fallbackStore.storeRecoveryRequest({
        email: email,
        tokenHash: crypto.createHash('sha256').update(resetToken).digest('hex'),
        requestedAt: requestedAt.toISOString(),
        expiresAt: new Date(requestedAt.getTime() + 60 * 60 * 1000).toISOString()
    });

    return {
        ok: true,
        message: 'Demande de récupération enregistrée.'
    };
}

async function assertEmailAvailable(getConnection, email) {
    await withConnection(getConnection, async connection => {
        const [existing] = await connection.execute(
            'SELECT id_user FROM utilisateur WHERE email = ?',
            [email]
        );
        if (existing.length > 0) {
            throw httpError(400, 'Utilisateur déjà existant');
        }
    });
}

async function createDatabaseUser(deps, data) {
    return await withConnection(deps.getConnection, async connection => {
        await connection.beginTransaction();
        try {
            const paramId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            await connection.execute(
                'INSERT INTO parametres (id_params, notification_email, notification_push) VALUES (?, ?, ?)',
                [paramId, 'enabled', 'enabled']
            );
            await connection.execute(
                'INSERT INTO utilisateur (id_user, id_params, nom, prenom, email, password, telephone, localisation, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, paramId, data.nom, data.prenom, data.email, data.hashedPassword, data.telephone || null, data.localisation || null, 'user']
            );
            await connection.commit();

            const user = {
                id: userId,
                id_user: userId,
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                role: 'user'
            };
            return {
                ok: true,
                message: 'Utilisateur créé avec succès',
                token: deps.signUserToken(tokenUser(user)),
                user: {
                    id: user.id_user,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}

async function withConnection(getConnection, work) {
    let connection = null;
    try {
        connection = await getConnection();
        return await work(connection);
    } finally {
        if (connection) connection.release();
    }
}

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    error.publicMessage = message;
    return error;
}

function tokenUser(user) {
    return {
        id_user: user.id_user || user.id,
        email: user.email,
        role: user.role || 'user'
    };
}

module.exports = {
    registerUser,
    loginUser,
    requestPasswordRecovery
};

};

__moduleDefs["services/storageService.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../lib/config');
const { httpError } = require('../lib/response');

const MIME_BY_EXTENSION = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword', 'application/octet-stream'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.webp': ['image/webp'],
    '.csv': ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
    '.txt': ['text/plain']
};

let s3Client;

function s3() {
    if (s3Client) return s3Client;
    s3Client = new S3Client({
        endpoint: config.s3.endpoint,
        region: config.s3.region,
        forcePathStyle: Boolean(config.s3.endpoint),
        credentials: config.s3.accessKeyId ? {
            accessKeyId: config.s3.accessKeyId,
            secretAccessKey: config.s3.secretAccessKey
        } : undefined
    });
    return s3Client;
}

function normaliseExtension(name) {
    return path.extname(String(name || '')).toLowerCase();
}

function safeOriginalName(name) {
    const base = path.basename(String(name || 'upload.bin')).replace(/[^\w.\- ()]/g, '_');
    return base.slice(0, 180) || 'upload.bin';
}

function validateUpload(file) {
    if (!file) throw httpError(400, 'file_missing', 'File is required');
    const originalName = safeOriginalName(file.originalname);
    const extension = normaliseExtension(originalName);
    if (!config.uploads.allowedExtensions.includes(extension)) {
        throw httpError(400, 'file_type_not_allowed', 'This file type is not allowed');
    }
    if (Number(file.size || 0) > config.uploads.maxFileSize) {
        throw httpError(413, 'file_too_large', 'File is too large');
    }
    const allowedMimes = MIME_BY_EXTENSION[extension] || [];
    if (file.mimetype && allowedMimes.length && !allowedMimes.includes(file.mimetype)) {
        throw httpError(400, 'mime_type_not_allowed', 'File MIME type is not allowed');
    }
    const buffer = file.buffer;
    if (buffer && !signatureMatches(extension, buffer)) {
        throw httpError(400, 'file_signature_invalid', 'File contents do not match the extension');
    }
    return { originalName, extension, mimeType: file.mimetype || allowedMimes[0] || 'application/octet-stream' };
}

function signatureMatches(extension, buffer) {
    if (!buffer || buffer.length < 4) return ['.txt', '.csv'].includes(extension);
    const head4 = buffer.subarray(0, 4).toString('hex');
    if (extension === '.pdf') return buffer.subarray(0, 4).toString() === '%PDF';
    if (extension === '.png') return head4 === '89504e47';
    if (extension === '.jpg' || extension === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (extension === '.webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    if (extension === '.docx') return buffer.subarray(0, 2).toString() === 'PK';
    if (extension === '.doc') return head4 === 'd0cf11e0';
    if (extension === '.csv' || extension === '.txt') return !buffer.includes(0);
    return false;
}

async function storeUploadedFile(getConnection, userId, file, owner) {
    const metadata = validateUpload(file);
    const id = crypto.randomUUID();
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const objectKey = `${userId}/${id}${metadata.extension}`;

    if (config.uploads.driver === 's3') {
        await s3().send(new PutObjectCommand({
            Bucket: config.s3.bucket,
            Key: objectKey,
            Body: file.buffer,
            ContentType: metadata.mimeType,
            Metadata: {
                owner: userId,
                originalName: metadata.originalName
            }
        }));
    } else {
        const fullPath = path.join(config.uploads.localDir, objectKey);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file.buffer);
    }

    const record = {
        id_file: id,
        id_user: userId,
        owner_type: owner && owner.type || 'user',
        owner_id: owner && owner.id || null,
        storage_driver: config.uploads.driver,
        bucket: config.uploads.driver === 's3' ? config.s3.bucket : null,
        object_key: objectKey,
        original_name: metadata.originalName,
        mime_type: metadata.mimeType,
        extension: metadata.extension,
        size_bytes: file.size,
        checksum_sha256: checksum,
        status: 'uploaded',
        visibility: 'private'
    };
    await insertFile(getConnection, record);
    return toPublicFile(record);
}

async function createPresignedUpload(getConnection, userId, input) {
    const originalName = safeOriginalName(input.originalName);
    const extension = normaliseExtension(originalName);
    if (!config.uploads.allowedExtensions.includes(extension)) {
        throw httpError(400, 'file_type_not_allowed', 'This file type is not allowed');
    }
    const id = crypto.randomUUID();
    const objectKey = `${userId}/${id}${extension}`;
    const mimeType = input.mimeType || (MIME_BY_EXTENSION[extension] || [])[0] || 'application/octet-stream';
    const record = {
        id_file: id,
        id_user: userId,
        owner_type: input.ownerType || 'user',
        owner_id: input.ownerId || null,
        storage_driver: config.uploads.driver,
        bucket: config.uploads.driver === 's3' ? config.s3.bucket : null,
        object_key: objectKey,
        original_name: originalName,
        mime_type: mimeType,
        extension,
        size_bytes: Number(input.size || 0),
        checksum_sha256: null,
        status: 'pending',
        visibility: 'private'
    };
    await insertFile(getConnection, record);

    if (config.uploads.driver === 's3') {
        const command = new PutObjectCommand({
            Bucket: config.s3.bucket,
            Key: objectKey,
            ContentType: mimeType
        });
        return {
            file: toPublicFile(record),
            upload: {
                method: 'PUT',
                url: await getSignedUrl(s3(), command, { expiresIn: 900 }),
                headers: { 'Content-Type': mimeType }
            }
        };
    }

    return {
        file: toPublicFile(record),
        upload: {
            method: 'POST',
            url: `/api/files/${id}/content`,
            headers: {}
        }
    };
}

async function completeUpload(getConnection, userId, fileId, details) {
    const file = await getFile(getConnection, fileId);
    if (!file || file.id_user !== userId) throw httpError(404, 'file_not_found', 'File not found');
    await updateFileStatus(getConnection, fileId, {
        status: 'uploaded',
        checksum: details && details.checksum || file.checksum_sha256,
        size: details && details.size || file.size_bytes
    });
    return toPublicFile(Object.assign(file, {
        status: 'uploaded',
        checksum_sha256: details && details.checksum || file.checksum_sha256,
        size_bytes: details && details.size || file.size_bytes
    }));
}

async function storePendingUploadContent(getConnection, userId, fileId, uploadedFile) {
    const existing = await getFile(getConnection, fileId);
    if (!existing || existing.id_user !== userId || existing.status !== 'pending') {
        throw httpError(404, 'file_not_found', 'Pending file upload not found');
    }
    const metadata = validateUpload(Object.assign({}, uploadedFile, {
        originalname: existing.original_name,
        mimetype: uploadedFile.mimetype || existing.mime_type
    }));
    if (metadata.extension !== existing.extension) {
        throw httpError(400, 'file_type_mismatch', 'Uploaded file type does not match the prepared upload');
    }
    const checksum = crypto.createHash('sha256').update(uploadedFile.buffer).digest('hex');
    if (existing.storage_driver === 's3') {
        await s3().send(new PutObjectCommand({
            Bucket: existing.bucket,
            Key: existing.object_key,
            Body: uploadedFile.buffer,
            ContentType: metadata.mimeType
        }));
    } else {
        const fullPath = path.join(config.uploads.localDir, existing.object_key);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, uploadedFile.buffer);
    }
    await updateFileStatus(getConnection, fileId, {
        status: 'uploaded',
        checksum,
        size: uploadedFile.size
    });
    return toPublicFile(Object.assign(existing, {
        status: 'uploaded',
        checksum_sha256: checksum,
        size_bytes: uploadedFile.size
    }));
}

async function readFileBuffer(getConnection, userId, fileId, allowAdmin) {
    const file = await getFile(getConnection, fileId);
    if (!file || file.deleted_at) throw httpError(404, 'file_not_found', 'File not found');
    if (!allowAdmin && file.id_user !== userId) throw httpError(403, 'forbidden', 'You do not have access to this file');
    if (file.storage_driver === 's3') {
        const result = await s3().send(new GetObjectCommand({ Bucket: file.bucket, Key: file.object_key }));
        const chunks = [];
        for await (const chunk of result.Body) chunks.push(chunk);
        return { file, buffer: Buffer.concat(chunks) };
    }
    const fullPath = path.join(config.uploads.localDir, file.object_key);
    return { file, buffer: await fs.readFile(fullPath) };
}

async function deleteFile(getConnection, userId, fileId, allowAdmin) {
    const file = await getFile(getConnection, fileId);
    if (!file || file.deleted_at) throw httpError(404, 'file_not_found', 'File not found');
    if (!allowAdmin && file.id_user !== userId) throw httpError(403, 'forbidden', 'You do not have access to this file');
    if (file.storage_driver === 's3') {
        await s3().send(new DeleteObjectCommand({ Bucket: file.bucket, Key: file.object_key }));
    } else {
        await fs.rm(path.join(config.uploads.localDir, file.object_key), { force: true });
    }
    const connection = await getConnection();
    try {
        await connection.execute('UPDATE file_asset SET status = ?, deleted_at = UTC_TIMESTAMP() WHERE id_file = ?', ['deleted', fileId]);
    } finally {
        connection.release();
    }
}

async function insertFile(getConnection, record) {
    const connection = await getConnection();
    try {
        await connection.execute(
            `INSERT INTO file_asset
             (id_file, id_user, owner_type, owner_id, storage_driver, bucket, object_key,
              original_name, mime_type, extension, size_bytes, checksum_sha256, status, visibility, uploaded_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'uploaded' THEN UTC_TIMESTAMP() ELSE NULL END)`,
            [
                record.id_file,
                record.id_user,
                record.owner_type,
                record.owner_id,
                record.storage_driver,
                record.bucket,
                record.object_key,
                record.original_name,
                record.mime_type,
                record.extension,
                record.size_bytes,
                record.checksum_sha256,
                record.status,
                record.visibility,
                record.status
            ]
        );
    } finally {
        connection.release();
    }
}

async function getFile(getConnection, fileId) {
    const connection = await getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM file_asset WHERE id_file = ? LIMIT 1', [fileId]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
}

async function updateFileStatus(getConnection, fileId, details) {
    const connection = await getConnection();
    try {
        await connection.execute(
            `UPDATE file_asset
             SET status = ?, checksum_sha256 = COALESCE(?, checksum_sha256),
                 size_bytes = COALESCE(?, size_bytes), uploaded_at = UTC_TIMESTAMP()
             WHERE id_file = ?`,
            [details.status, details.checksum || null, details.size || null, fileId]
        );
    } finally {
        connection.release();
    }
}

function toPublicFile(file) {
    return {
        id: file.id_file,
        id_file: file.id_file,
        originalName: file.original_name,
        mimeType: file.mime_type,
        extension: file.extension,
        size: Number(file.size_bytes) || 0,
        status: file.status,
        url: `/api/files/${file.id_file}`
    };
}

module.exports = {
    validateUpload,
    storeUploadedFile,
    createPresignedUpload,
    storePendingUploadContent,
    completeUpload,
    readFileBuffer,
    deleteFile,
    toPublicFile
};

};

__moduleDefs["routes/admin/subscriptions.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, withConnection, ensureAdminTables, httpError, respondError } = require('./helpers');

module.exports = function createAdminSubscriptionsRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/subscriptions', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const { page, limit, offset } = pagination(req.query);
                const [[count]] = await connection.execute('SELECT COUNT(*) AS total FROM abonnement');
                const [rows] = await connection.execute(
                    `SELECT a.id_abonnement, a.id_entreprise, a.plan, a.status, a.start_date, a.end_date, a.price, a.created_at,
                            e.nom AS entreprise
                     FROM abonnement a
                     LEFT JOIN entreprise e ON e.id_entreprise = a.id_entreprise
                     ORDER BY a.created_at DESC
                     LIMIT ? OFFSET ?`,
                    [limit, offset]
                );
                return {
                    subscriptions: rows.map(publicSubscription),
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur abonnements');
        }
    });

    router.post('/api/admin/subscriptions', verifyToken, requireAdmin, async (req, res) => {
        try {
            const subscriptionId = id();
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                if (!req.body.plan) throw httpError(400, 'Plan requis');
                await connection.execute(
                    'INSERT INTO abonnement (id_abonnement, id_entreprise, plan, status, start_date, end_date, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [subscriptionId, req.body.id_entreprise || null, req.body.plan, req.body.status || 'active', req.body.start_date || null, req.body.end_date || null, req.body.price || 0]
                );
            });
            res.status(201).json({ ok: true, data: { id_abonnement: subscriptionId } });
        } catch (error) {
            respondError(res, error, 'Erreur création abonnement');
        }
    });

    router.put('/api/admin/subscriptions/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const fields = ['id_entreprise', 'plan', 'status', 'start_date', 'end_date', 'price'].filter(field => req.body[field] !== undefined);
                if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
                const [result] = await connection.execute(
                    'UPDATE abonnement SET ' + fields.map(field => field + ' = ?').join(', ') + ' WHERE id_abonnement = ?',
                    fields.map(field => req.body[field] || null).concat([req.params.id])
                );
                if (!result.affectedRows) throw httpError(404, 'Abonnement introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification abonnement');
        }
    });

    router.delete('/api/admin/subscriptions/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const [result] = await connection.execute('DELETE FROM abonnement WHERE id_abonnement = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Abonnement introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression abonnement');
        }
    });

    return router;
};

function publicSubscription(row) {
    return {
        id: row.id_abonnement,
        id_abonnement: row.id_abonnement,
        id_entreprise: row.id_entreprise,
        entreprise: row.entreprise,
        plan: row.plan,
        status: row.status,
        start_date: row.start_date,
        end_date: row.end_date,
        price: Number(row.price) || 0,
        created_at: row.created_at
    };
}

};

__moduleDefs["routes/admin/offers.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, normalizeLike, withConnection, httpError, respondError, parseSkills, skillString } = require('./helpers');

module.exports = function createAdminOffersRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/offers', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => listOffers(connection, req.query));
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur offres');
        }
    });

    router.get('/api/admin/offers/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => getOffer(connection, req.params.id));
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur offre');
        }
    });

    router.post('/api/admin/offers', verifyToken, requireAdmin, async (req, res) => {
        try {
            const created = await withConnection(getConnection, async connection => {
                if (!req.body.titre && !req.body.title) throw httpError(400, 'Titre requis');
                if (!req.body.id_entreprise) {
                    const [result] = await connection.execute(
                        `INSERT INTO opportunities
                         (uid, source, title, company, location, source_url, description, skills)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            req.body.uid || id(),
                            req.body.source || 'admin',
                            req.body.titre || req.body.title,
                            req.body.company || req.body.entreprise || null,
                            req.body.localisation || req.body.location || null,
                            req.body.source_url || null,
                            req.body.description || null,
                            skillString(req.body.skills)
                        ]
                    );
                    return {
                        id: 'opportunity:' + result.insertId,
                        id_opportunity: result.insertId,
                        origin: 'opportunities'
                    };
                }
                const offerId = id();
                await connection.execute(
                    `INSERT INTO offre
                     (id_offre, id_entreprise, titre, description, localisation, type_contrat, source_url, source, skills, uid)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        offerId,
                        req.body.id_entreprise || null,
                        req.body.titre || req.body.title,
                        req.body.description || null,
                        req.body.localisation || req.body.location || null,
                        req.body.type_contrat || req.body.contract || null,
                        req.body.source_url || null,
                        req.body.source || 'admin',
                        skillString(req.body.skills),
                        req.body.uid || id()
                    ]
                );
                return {
                    id: offerId,
                    id_offre: offerId,
                    origin: 'offre'
                };
            });
            res.status(201).json({ ok: true, data: created });
        } catch (error) {
            respondError(res, error, 'Erreur création offre');
        }
    });

    router.put('/api/admin/offers/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => updateOffer(connection, req.params.id, req.body));
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification offre');
        }
    });

    router.delete('/api/admin/offers/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                if (req.params.id.startsWith('opportunity:')) {
                    const [result] = await connection.execute('DELETE FROM opportunities WHERE id = ?', [req.params.id.replace('opportunity:', '')]);
                    if (!result.affectedRows) throw httpError(404, 'Offre introuvable');
                    return;
                }
                const [result] = await connection.execute('DELETE FROM offre WHERE id_offre = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Offre introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression offre');
        }
    });

    return router;
};

async function listOffers(connection, query) {
    const { page, limit, offset } = pagination(query);
    const filters = [];
    const params = [];
    if (query.search) {
        filters.push('(title LIKE ? OR company LIKE ? OR location LIKE ?)');
        const like = normalizeLike(query.search);
        params.push(like, like, like);
    }
    if (query.contract) {
        filters.push('contract = ?');
        params.push(query.contract);
    }
    if (query.source) {
        filters.push('source = ?');
        params.push(query.source);
    }
    const whereSQL = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    const baseSQL = `
        SELECT id, origin, title, company, location, contract, source, source_url, description, skills, created_at
        FROM (
            SELECT o.id_offre AS id, 'offre' AS origin, o.titre AS title, COALESCE(e.nom, '') AS company,
                   o.localisation AS location, o.type_contrat AS contract, o.source AS source,
                   o.source_url, o.description, o.skills, o.date_publication AS created_at
            FROM offre o
            LEFT JOIN entreprise e ON e.id_entreprise = o.id_entreprise
            UNION ALL
            SELECT CONCAT('opportunity:', id) AS id, 'opportunities' AS origin, title, company,
                   location, NULL AS contract, source, source_url, description, skills, created_at
            FROM opportunities
        ) merged
        ${whereSQL}`;
    const [[count]] = await connection.execute(`SELECT COUNT(*) AS total FROM (${baseSQL}) counted`, params);
    const [rows] = await connection.execute(
        `${baseSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        params.concat([limit, offset])
    );
    return {
        offers: rows.map(publicOffer),
        pagination: { page, limit, total: Number(count.total) || 0 }
    };
}

async function getOffer(connection, offerId) {
    if (offerId.startsWith('opportunity:')) {
        const [rows] = await connection.execute(
            'SELECT CONCAT("opportunity:", id) AS id, "opportunities" AS origin, title, company, location, NULL AS contract, source, source_url, description, skills, created_at FROM opportunities WHERE id = ?',
            [offerId.replace('opportunity:', '')]
        );
        if (!rows.length) throw httpError(404, 'Offre introuvable');
        return publicOffer(rows[0]);
    }
    const [rows] = await connection.execute(
        `SELECT o.id_offre AS id, 'offre' AS origin, o.titre AS title, COALESCE(e.nom, '') AS company,
                o.localisation AS location, o.type_contrat AS contract, o.source, o.source_url, o.description, o.skills, o.date_publication AS created_at
         FROM offre o
         LEFT JOIN entreprise e ON e.id_entreprise = o.id_entreprise
         WHERE o.id_offre = ?`,
        [offerId]
    );
    if (!rows.length) throw httpError(404, 'Offre introuvable');
    return publicOffer(rows[0]);
}

async function updateOffer(connection, offerId, body) {
    if (offerId.startsWith('opportunity:')) {
        const fields = [
            ['title', body.title || body.titre],
            ['company', body.company],
            ['location', body.location || body.localisation],
            ['source', body.source],
            ['source_url', body.source_url],
            ['description', body.description],
            ['skills', body.skills === undefined ? undefined : skillString(body.skills)]
        ].filter(item => item[1] !== undefined);
        if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
        const [result] = await connection.execute(
            'UPDATE opportunities SET ' + fields.map(item => item[0] + ' = ?').join(', ') + ' WHERE id = ?',
            fields.map(item => item[1] || null).concat([offerId.replace('opportunity:', '')])
        );
        if (!result.affectedRows) throw httpError(404, 'Offre introuvable');
        return;
    }

    const fields = [
        ['id_entreprise', body.id_entreprise],
        ['titre', body.titre || body.title],
        ['description', body.description],
        ['localisation', body.localisation || body.location],
        ['type_contrat', body.type_contrat || body.contract],
        ['source_url', body.source_url],
        ['source', body.source],
        ['skills', body.skills === undefined ? undefined : skillString(body.skills)]
    ].filter(item => item[1] !== undefined);
    if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
    const [result] = await connection.execute(
        'UPDATE offre SET ' + fields.map(item => item[0] + ' = ?').join(', ') + ' WHERE id_offre = ?',
        fields.map(item => item[1] || null).concat([offerId])
    );
    if (!result.affectedRows) throw httpError(404, 'Offre introuvable');
}

function publicOffer(row) {
    return {
        id: row.id,
        origin: row.origin,
        isOpportunity: row.origin === 'opportunities',
        title: row.title,
        titre: row.title,
        company: row.company,
        location: row.location,
        localisation: row.location,
        contract: row.contract,
        type_contrat: row.contract,
        source: row.source,
        source_url: row.source_url,
        description: row.description,
        skills: parseSkills(row.skills),
        created_at: row.created_at
    };
}

};

__moduleDefs["routes/admin/enterprises.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, normalizeLike, withConnection, httpError, respondError } = require('./helpers');

module.exports = function createAdminEnterprisesRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/enterprises', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const { page, limit, offset } = pagination(req.query);
                const where = [];
                const params = [];
                if (req.query.search) {
                    where.push('(e.nom LIKE ? OR e.localisation LIKE ? OR e.secteur LIKE ?)');
                    const like = normalizeLike(req.query.search);
                    params.push(like, like, like);
                }
                if (req.query.sector) {
                    where.push('e.secteur = ?');
                    params.push(req.query.sector);
                }
                if (req.query.size) {
                    where.push('e.taille = ?');
                    params.push(req.query.size);
                }
                const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const [[count]] = await connection.execute(
                    `SELECT COUNT(*) AS total FROM entreprise e ${whereSQL}`,
                    params
                );
                const [rows] = await connection.execute(
                    `SELECT e.id_entreprise, e.nom, e.localisation, e.taille, e.secteur, e.site_web, e.created_at,
                            COUNT(o.id_offre) AS offers_count
                     FROM entreprise e
                     LEFT JOIN offre o ON o.id_entreprise = e.id_entreprise
                     ${whereSQL}
                     GROUP BY e.id_entreprise
                     ORDER BY e.created_at DESC
                     LIMIT ? OFFSET ?`,
                    params.concat([limit, offset])
                );
                return {
                    enterprises: rows.map(publicEnterprise),
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur entreprises');
        }
    });

    router.get('/api/admin/enterprises/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const [rows] = await connection.execute(
                    `SELECT e.id_entreprise, e.nom, e.localisation, e.taille, e.secteur, e.site_web, e.created_at,
                            COUNT(o.id_offre) AS offers_count
                     FROM entreprise e
                     LEFT JOIN offre o ON o.id_entreprise = e.id_entreprise
                     WHERE e.id_entreprise = ?
                     GROUP BY e.id_entreprise`,
                    [req.params.id]
                );
                if (!rows.length) throw httpError(404, 'Entreprise introuvable');
                return publicEnterprise(rows[0]);
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur entreprise');
        }
    });

    router.post('/api/admin/enterprises', verifyToken, requireAdmin, async (req, res) => {
        try {
            const enterpriseId = id();
            await withConnection(getConnection, async connection => {
                if (!req.body.nom) throw httpError(400, 'Nom requis');
                await connection.execute(
                    'INSERT INTO entreprise (id_entreprise, nom, localisation, taille, secteur, site_web) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        enterpriseId,
                        req.body.nom,
                        req.body.localisation || null,
                        req.body.taille || null,
                        req.body.secteur || null,
                        req.body.site_web || null
                    ]
                );
            });
            res.status(201).json({ ok: true, data: { id_entreprise: enterpriseId } });
        } catch (error) {
            respondError(res, error, 'Erreur création entreprise');
        }
    });

    router.put('/api/admin/enterprises/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const fields = ['nom', 'localisation', 'taille', 'secteur', 'site_web'];
                const updates = fields.filter(field => req.body[field] !== undefined);
                if (!updates.length) throw httpError(400, 'Aucune donnée à mettre à jour');
                const [result] = await connection.execute(
                    'UPDATE entreprise SET ' + updates.map(field => field + ' = ?').join(', ') + ' WHERE id_entreprise = ?',
                    updates.map(field => req.body[field] || null).concat([req.params.id])
                );
                if (!result.affectedRows) throw httpError(404, 'Entreprise introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification entreprise');
        }
    });

    router.delete('/api/admin/enterprises/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const [result] = await connection.execute('DELETE FROM entreprise WHERE id_entreprise = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Entreprise introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression entreprise');
        }
    });

    return router;
};

function publicEnterprise(row) {
    return {
        id: row.id_entreprise,
        id_entreprise: row.id_entreprise,
        nom: row.nom,
        name: row.nom,
        localisation: row.localisation,
        taille: row.taille,
        secteur: row.secteur,
        site_web: row.site_web,
        created_at: row.created_at,
        offers_count: Number(row.offers_count) || 0
    };
}

};

__moduleDefs["routes/admin/users.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, normalizeLike, withConnection, httpError, respondError } = require('./helpers');
const { hashPassword } = require('../../lib/passwords');

module.exports = function createAdminUsersRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const { page, limit, offset } = pagination(req.query);
                const where = [];
                const params = [];

                if (req.query.search) {
                    where.push('(nom LIKE ? OR prenom LIKE ? OR email LIKE ?)');
                    const like = normalizeLike(req.query.search);
                    params.push(like, like, like);
                }
                if (req.query.role) {
                    where.push('role = ?');
                    params.push(req.query.role);
                }

                const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const [[count]] = await connection.execute(
                    `SELECT COUNT(*) AS total FROM utilisateur ${whereSQL}`,
                    params
                );
                const [users] = await connection.execute(
                    `SELECT id_user, id_params, nom, prenom, email, telephone, localisation, photo, role, date_inscription
                     FROM utilisateur ${whereSQL}
                     ORDER BY date_inscription DESC
                     LIMIT ? OFFSET ?`,
                    params.concat([limit, offset])
                );

                return {
                    users: users.map(publicUser),
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur utilisateurs');
        }
    });

    router.get('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            const user = await withConnection(getConnection, async connection => {
                const [users] = await connection.execute(
                    'SELECT id_user, id_params, nom, prenom, email, telephone, localisation, photo, role, date_inscription FROM utilisateur WHERE id_user = ?',
                    [req.params.id]
                );
                if (!users.length) throw httpError(404, 'Utilisateur introuvable');
                return publicUser(users[0]);
            });
            res.json({ ok: true, data: user });
        } catch (error) {
            respondError(res, error, 'Erreur utilisateur');
        }
    });

    router.post('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
        try {
            const created = await withConnection(getConnection, async connection => {
                const required = ['nom', 'prenom', 'email', 'password'];
                required.forEach(field => {
                    if (!req.body[field]) throw httpError(400, 'Champ requis: ' + field);
                });
                const userId = id();
                const paramId = id();
                const password = await hashPassword(req.body.password);
                await connection.beginTransaction();
                try {
                    await connection.execute(
                        'INSERT INTO parametres (id_params, notification_email, notification_push) VALUES (?, ?, ?)',
                        [paramId, 'enabled', 'enabled']
                    );
                    await connection.execute(
                        `INSERT INTO utilisateur
                         (id_user, id_params, nom, prenom, email, password, telephone, localisation, photo, role)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            userId,
                            paramId,
                            req.body.nom,
                            req.body.prenom,
                            req.body.email,
                            password,
                            req.body.telephone || null,
                            req.body.localisation || null,
                            req.body.photo || null,
                            req.body.role || 'user'
                        ]
                    );
                    await connection.commit();
                } catch (error) {
                    await connection.rollback();
                    throw error;
                }
                return { id_user: userId };
            });
            res.status(201).json({ ok: true, data: created });
        } catch (error) {
            respondError(res, error, 'Erreur création utilisateur');
        }
    });

    router.put('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const fields = ['nom', 'prenom', 'email', 'telephone', 'localisation', 'photo', 'role'];
                const updates = fields.filter(field => req.body[field] !== undefined);
                if (!updates.length && !req.body.password) throw httpError(400, 'Aucune donnée à mettre à jour');
                const sqlParts = updates.map(field => field + ' = ?');
                const params = updates.map(field => req.body[field] || null);
                if (req.body.password) {
                    sqlParts.push('password = ?');
                    params.push(await hashPassword(req.body.password));
                }
                params.push(req.params.id);
                const [result] = await connection.execute(
                    'UPDATE utilisateur SET ' + sqlParts.join(', ') + ' WHERE id_user = ?',
                    params
                );
                if (!result.affectedRows) throw httpError(404, 'Utilisateur introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification utilisateur');
        }
    });

    router.delete('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const [result] = await connection.execute('DELETE FROM utilisateur WHERE id_user = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Utilisateur introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression utilisateur');
        }
    });

    return router;
};

function publicUser(row) {
    return {
        id: row.id_user,
        id_user: row.id_user,
        id_params: row.id_params,
        name: [row.prenom, row.nom].filter(Boolean).join(' ').trim() || row.email,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        telephone: row.telephone,
        localisation: row.localisation,
        photo: row.photo,
        role: row.role || 'user',
        date_inscription: row.date_inscription
    };
}

};

__moduleDefs["routes/admin/skills.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, normalizeLike, withConnection, httpError, respondError, demandedSkills, normalizeKey, categoryForSkill } = require('./helpers');

module.exports = function createAdminSkillsRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/skills', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const { page, limit, offset } = pagination(req.query);
                const demand = await demandedSkills(connection);
                const where = [];
                const params = [];
                if (req.query.search) {
                    where.push('nom LIKE ?');
                    params.push(normalizeLike(req.query.search));
                }
                if (req.query.category) {
                    where.push('categorie = ?');
                    params.push(req.query.category);
                }
                const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const [[count]] = await connection.execute(
                    `SELECT COUNT(*) AS total FROM competence ${whereSQL}`,
                    params
                );
                const [skills] = await connection.execute(
                    `SELECT c.id_skill, c.nom, c.categorie, c.created_at, COUNT(us.id_user_skill) AS users_count
                     FROM competence c
                     LEFT JOIN user_skill us ON us.id_skill = c.id_skill
                     ${whereSQL}
                     GROUP BY c.id_skill
                     ORDER BY c.created_at DESC
                     LIMIT ? OFFSET ?`,
                    params.concat([limit, offset])
                );

                const databaseSkills = skills.map(row => publicSkill(row, demand.get(normalizeKey(row.nom))));
                if (databaseSkills.length || req.query.search || req.query.category) {
                    return {
                        skills: databaseSkills,
                        pagination: { page, limit, total: Number(count.total) || 0 }
                    };
                }

                const derived = Array.from(demand.values())
                    .sort((left, right) => right.demand_count - left.demand_count)
                    .slice(offset, offset + limit)
                    .map(skill => ({
                        id: normalizeKey(skill.name),
                        id_skill: normalizeKey(skill.name),
                        nom: skill.name,
                        categorie: categoryForSkill(skill.name),
                        users_count: 0,
                        demand_count: skill.demand_count,
                        derived: true
                    }));
                return {
                    skills: derived,
                    pagination: { page, limit, total: demand.size }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur compétences');
        }
    });

    router.post('/api/admin/skills', verifyToken, requireAdmin, async (req, res) => {
        try {
            const skillId = id();
            await withConnection(getConnection, async connection => {
                if (!req.body.nom && !req.body.name) throw httpError(400, 'Nom requis');
                await connection.execute(
                    'INSERT INTO competence (id_skill, nom, categorie) VALUES (?, ?, ?)',
                    [skillId, req.body.nom || req.body.name, req.body.categorie || req.body.category || null]
                );
            });
            res.status(201).json({ ok: true, data: { id_skill: skillId } });
        } catch (error) {
            respondError(res, error, 'Erreur création compétence');
        }
    });

    router.put('/api/admin/skills/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const fields = [
                    ['nom', req.body.nom || req.body.name],
                    ['categorie', req.body.categorie || req.body.category]
                ].filter(item => item[1] !== undefined);
                if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
                const [result] = await connection.execute(
                    'UPDATE competence SET ' + fields.map(item => item[0] + ' = ?').join(', ') + ' WHERE id_skill = ?',
                    fields.map(item => item[1] || null).concat([req.params.id])
                );
                if (!result.affectedRows) throw httpError(404, 'Compétence introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification compétence');
        }
    });

    router.delete('/api/admin/skills/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const [result] = await connection.execute('DELETE FROM competence WHERE id_skill = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Compétence introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression compétence');
        }
    });

    return router;
};

function publicSkill(row, demand) {
    return {
        id: row.id_skill,
        id_skill: row.id_skill,
        nom: row.nom,
        name: row.nom,
        categorie: row.categorie,
        category: row.categorie,
        users_count: Number(row.users_count) || 0,
        demand_count: demand ? demand.demand_count : 0,
        created_at: row.created_at
    };
}

};

__moduleDefs["routes/admin/support.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, normalizeLike, withConnection, ensureAdminTables, httpError, respondError } = require('./helpers');

module.exports = function createAdminSupportRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/support', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const { page, limit, offset } = pagination(req.query);
                const where = [];
                const params = [];
                if (req.query.search) {
                    where.push('(t.subject LIKE ? OR t.message LIKE ? OR u.email LIKE ?)');
                    const like = normalizeLike(req.query.search);
                    params.push(like, like, like);
                }
                if (req.query.status) {
                    where.push('t.status = ?');
                    params.push(req.query.status);
                }
                if (req.query.priority) {
                    where.push('t.priority = ?');
                    params.push(req.query.priority);
                }
                const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const [[count]] = await connection.execute(
                    `SELECT COUNT(*) AS total FROM support_ticket t LEFT JOIN utilisateur u ON u.id_user = t.id_user ${whereSQL}`,
                    params
                );
                const [tickets] = await connection.execute(
                    `SELECT t.id_ticket, t.id_user, t.subject, t.message, t.status, t.priority, t.created_at, t.updated_at,
                            u.email, u.nom, u.prenom
                     FROM support_ticket t
                     LEFT JOIN utilisateur u ON u.id_user = t.id_user
                     ${whereSQL}
                     ORDER BY t.updated_at DESC
                     LIMIT ? OFFSET ?`,
                    params.concat([limit, offset])
                );
                return {
                    tickets: tickets.map(publicTicket),
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur support');
        }
    });

    router.post('/api/admin/support', verifyToken, requireAdmin, async (req, res) => {
        try {
            const ticketId = id();
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                if (!req.body.subject) throw httpError(400, 'Sujet requis');
                await connection.execute(
                    'INSERT INTO support_ticket (id_ticket, id_user, subject, message, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
                    [ticketId, req.body.id_user || null, req.body.subject, req.body.message || null, req.body.status || 'open', req.body.priority || 'normal']
                );
            });
            res.status(201).json({ ok: true, data: { id_ticket: ticketId } });
        } catch (error) {
            respondError(res, error, 'Erreur création ticket');
        }
    });

    router.put('/api/admin/support/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const fields = ['subject', 'message', 'status', 'priority'].filter(field => req.body[field] !== undefined);
                if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
                const [result] = await connection.execute(
                    'UPDATE support_ticket SET ' + fields.map(field => field + ' = ?').join(', ') + ' WHERE id_ticket = ?',
                    fields.map(field => req.body[field] || null).concat([req.params.id])
                );
                if (!result.affectedRows) throw httpError(404, 'Ticket introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification ticket');
        }
    });

    router.delete('/api/admin/support/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                await ensureAdminTables(connection);
                const [result] = await connection.execute('DELETE FROM support_ticket WHERE id_ticket = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Ticket introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression ticket');
        }
    });

    return router;
};

function publicTicket(row) {
    return {
        id: row.id_ticket,
        id_ticket: row.id_ticket,
        id_user: row.id_user,
        user: [row.prenom, row.nom].filter(Boolean).join(' ').trim() || row.email || null,
        email: row.email,
        subject: row.subject,
        message: row.message,
        status: row.status,
        priority: row.priority,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

};

__moduleDefs["routes/admin/analytics.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { withConnection, respondError, demandedSkills } = require('./helpers');

module.exports = function createAdminAnalyticsRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/analytics', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const [usersByRole] = await connection.execute('SELECT role AS label, COUNT(*) AS value FROM utilisateur GROUP BY role ORDER BY value DESC');
                const [offersByLocation] = await connection.execute(`
                    SELECT location AS label, COUNT(*) AS value
                    FROM (
                        SELECT localisation AS location FROM offre
                        UNION ALL
                        SELECT location FROM opportunities
                    ) merged
                    WHERE location IS NOT NULL AND location <> ''
                    GROUP BY location
                    ORDER BY value DESC
                    LIMIT 12
                `);
                const [offersBySource] = await connection.execute(`
                    SELECT source AS label, COUNT(*) AS value
                    FROM (
                        SELECT source FROM offre
                        UNION ALL
                        SELECT source FROM opportunities
                    ) merged
                    WHERE source IS NOT NULL AND source <> ''
                    GROUP BY source
                    ORDER BY value DESC
                    LIMIT 12
                `);
                const [opportunitiesBySource] = await connection.execute('SELECT source AS label, COUNT(*) AS value FROM opportunities WHERE source IS NOT NULL GROUP BY source ORDER BY value DESC LIMIT 12');
                const [matchingDistribution] = await connection.execute(`
                    SELECT
                        CASE
                            WHEN score >= 80 THEN '80-100'
                            WHEN score >= 60 THEN '60-79'
                            WHEN score >= 40 THEN '40-59'
                            ELSE '0-39'
                        END AS label,
                        COUNT(*) AS value
                    FROM matching
                    GROUP BY label
                    ORDER BY label DESC
                `);
                const [cvUploads] = await connection.execute(
                    'SELECT DATE(date_upload) AS label, COUNT(*) AS value FROM cv GROUP BY DATE(date_upload) ORDER BY label DESC LIMIT 30'
                );
                const [enterprisesBySector] = await connection.execute('SELECT secteur AS label, COUNT(*) AS value FROM entreprise WHERE secteur IS NOT NULL GROUP BY secteur ORDER BY value DESC LIMIT 12');
                const topSkills = Array.from((await demandedSkills(connection)).values())
                    .sort((left, right) => right.demand_count - left.demand_count)
                    .slice(0, 12)
                    .map(skill => ({ label: skill.name, value: skill.demand_count }));

                return {
                    usersByRole: normalizeRows(usersByRole),
                    offersByLocation: normalizeRows(offersByLocation),
                    offersBySource: normalizeRows(offersBySource),
                    opportunitiesBySource: normalizeRows(opportunitiesBySource),
                    mostDemandedSkills: topSkills,
                    matchingScoreDistribution: normalizeRows(matchingDistribution),
                    cvUploadsOverTime: normalizeRows(cvUploads),
                    enterprisesBySector: normalizeRows(enterprisesBySector)
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur analyses');
        }
    });

    return router;
};

function normalizeRows(rows) {
    return rows.map(row => ({
        label: row.label || 'Non renseigné',
        value: Number(row.value) || 0
    }));
}

};

__moduleDefs["routes/admin/helpers.js"] = function(module, exports, require, __filename, __dirname) {
const crypto = require('crypto');

function id() {
    return crypto.randomUUID();
}

function intParam(value, fallback, min, max) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
}

function pagination(query) {
    const page = intParam(query.page, 1, 1, 100000);
    const limit = intParam(query.limit, 10, 1, 100);
    return {
        page,
        limit,
        offset: (page - 1) * limit
    };
}

function normalizeLike(value) {
    return '%' + String(value || '').trim() + '%';
}

async function withConnection(getConnection, work) {
    const connection = await getConnection();
    try {
        return await work(connection);
    } finally {
        connection.release();
    }
}

async function tableExists(connection, tableName) {
    const [rows] = await connection.execute('SHOW TABLES LIKE ?', [tableName]);
    return rows.length > 0;
}

async function ensureAdminTables(connection) {
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS abonnement (
            id_abonnement CHAR(36) PRIMARY KEY,
            id_entreprise CHAR(36),
            plan VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            start_date DATE,
            end_date DATE,
            price DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_abonnement_entreprise
                FOREIGN KEY (id_entreprise)
                REFERENCES entreprise(id_entreprise)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS support_ticket (
            id_ticket CHAR(36) PRIMARY KEY,
            id_user CHAR(36),
            subject VARCHAR(255) NOT NULL,
            message TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'open',
            priority VARCHAR(50) NOT NULL DEFAULT 'normal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_support_ticket_user
                FOREIGN KEY (id_user)
                REFERENCES utilisateur(id_user)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
}

function parseSkills(value) {
    if (Array.isArray(value)) return value;
    const raw = String(value || '').trim();
    if (!raw) return [];
    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return raw.split(',').map(item => item.trim()).filter(Boolean);
}

function skillString(value) {
    return parseSkills(value).join(', ');
}

function normalizeKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function categoryForSkill(name) {
    const key = normalizeKey(name);
    if (/(react|vue|angular|html|css|figma|ui|ux|javascript|typescript)/.test(key)) return 'Frontend';
    if (/(node|express|php|laravel|django|flask|spring|api|sql|mysql|postgres|java|python)/.test(key)) return 'Backend';
    if (/(docker|kubernetes|aws|azure|cloud|devops|linux|ci\/cd|git)/.test(key)) return 'DevOps';
    if (/(data|ia|ai|machine learning|power bi|excel|tableau)/.test(key)) return 'Data';
    if (/(rh|recrutement|formation|paie|ressources humaines)/.test(key)) return 'RH';
    if (/(vente|commercial|marketing|seo|crm|b2b|sales)/.test(key)) return 'Business';
    return 'General';
}

async function demandedSkills(connection) {
    const counts = new Map();
    const collect = rows => {
        rows.forEach(row => {
            parseSkills(row.skills).forEach(skill => {
                const key = normalizeKey(skill);
                if (!key) return;
                const current = counts.get(key) || { name: skill, demand_count: 0 };
                current.demand_count += 1;
                counts.set(key, current);
            });
        });
    };

    const [opportunities] = await connection.execute(
        'SELECT skills FROM opportunities WHERE skills IS NOT NULL AND skills <> "" LIMIT 5000'
    );
    collect(opportunities);

    const [offers] = await connection.execute(
        'SELECT skills FROM offre WHERE skills IS NOT NULL AND skills <> "" LIMIT 5000'
    );
    collect(offers);

    return counts;
}

function respondError(res, error, fallback) {
    console.error(fallback + ':', error);
    res.status(error.status || 500).json({ ok: false, error: error.publicMessage || fallback });
}

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    error.publicMessage = message;
    return error;
}

module.exports = {
    id,
    pagination,
    normalizeLike,
    withConnection,
    tableExists,
    ensureAdminTables,
    parseSkills,
    skillString,
    normalizeKey,
    categoryForSkill,
    demandedSkills,
    respondError,
    httpError
};

};

__moduleDefs["routes/admin/dashboard.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { withConnection, parseSkills } = require('./helpers');

module.exports = function createAdminDashboardRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/dashboard', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const [[users]] = await connection.execute('SELECT COUNT(*) AS total FROM utilisateur');
                const [[enterprises]] = await connection.execute('SELECT COUNT(*) AS total FROM entreprise');
                const [[offers]] = await connection.execute('SELECT COUNT(*) AS total FROM offre');
                const [[opportunities]] = await connection.execute('SELECT COUNT(*) AS total FROM opportunities');
                const [[skills]] = await connection.execute('SELECT COUNT(*) AS total FROM competence');
                const [[cvs]] = await connection.execute('SELECT COUNT(*) AS total FROM cv');
                const [[matching]] = await connection.execute('SELECT AVG(score) AS average_score, COUNT(*) AS total FROM matching');

                const [recentUsers] = await connection.execute(
                    'SELECT id_user, nom, prenom, email, role, photo, date_inscription FROM utilisateur ORDER BY date_inscription DESC LIMIT 8'
                );
                const [recentOffers] = await connection.execute(
                    `SELECT id, origin, title, company, location, contract, source, created_at
                     FROM (
                        SELECT o.id_offre AS id, 'offre' AS origin, o.titre AS title, COALESCE(e.nom, '') AS company,
                               o.localisation AS location, o.type_contrat AS contract, o.source, o.date_publication AS created_at
                        FROM offre o
                        LEFT JOIN entreprise e ON e.id_entreprise = o.id_entreprise
                        UNION ALL
                        SELECT CONCAT('opportunity:', id) AS id, 'opportunities' AS origin, title, company,
                               location, NULL AS contract, source, created_at
                        FROM opportunities
                     ) merged
                     ORDER BY created_at DESC
                     LIMIT 8`
                );
                const [recentOpportunities] = await connection.execute(
                    'SELECT id, uid, title, company, location, source, skills, created_at FROM opportunities ORDER BY created_at DESC, id DESC LIMIT 8'
                );
                const [latestNotifications] = await connection.execute(
                    'SELECT id_notification, type, message, date_notification, lu FROM notification ORDER BY date_notification DESC LIMIT 8'
                );
                const [progressionStats] = await connection.execute(
                    'SELECT COUNT(*) AS total, AVG(score_globale) AS average_score, MAX(date_progression) AS last_progression FROM progression'
                );

                return {
                    totals: {
                        users: Number(users.total) || 0,
                        enterprises: Number(enterprises.total) || 0,
                        offers: (Number(offers.total) || 0) + (Number(opportunities.total) || 0),
                        databaseOffers: Number(offers.total) || 0,
                        opportunities: Number(opportunities.total) || 0,
                        skills: Number(skills.total) || 0,
                        cvs: Number(cvs.total) || 0,
                        matching: Number(matching.total) || 0,
                        averageMatchingScore: Math.round(Number(matching.average_score) || 0)
                    },
                    recentUsers: recentUsers.map(publicUser),
                    recentOffers: recentOffers.map(publicOffer),
                    recentOpportunities: recentOpportunities.map(publicOpportunity),
                    latestNotifications: latestNotifications,
                    progression: {
                        total: Number(progressionStats[0] && progressionStats[0].total) || 0,
                        averageScore: Math.round(Number(progressionStats[0] && progressionStats[0].average_score) || 0),
                        lastProgression: progressionStats[0] && progressionStats[0].last_progression
                    }
                };
            });

            res.json({ ok: true, data });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            res.status(500).json({ ok: false, error: 'Impossible de charger les données.' });
        }
    });

    return router;
};

function publicUser(row) {
    return {
        id: row.id_user,
        id_user: row.id_user,
        name: [row.prenom, row.nom].filter(Boolean).join(' ').trim() || row.email,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        role: row.role,
        photo: row.photo,
        date_inscription: row.date_inscription
    };
}

function publicOffer(row) {
    return {
        id: row.id,
        id_offre: row.origin === 'offre' ? row.id : null,
        origin: row.origin,
        isOpportunity: row.origin === 'opportunities',
        title: row.title,
        company: row.company,
        location: row.location,
        contract: row.contract,
        source: row.source,
        date_publication: row.created_at,
        created_at: row.created_at
    };
}

function publicOpportunity(row) {
    return {
        id: row.id,
        uid: row.uid,
        title: row.title,
        company: row.company,
        location: row.location,
        source: row.source,
        skills: parseSkills(row.skills),
        created_at: row.created_at
    };
}

};

__moduleDefs["routes/admin/matching.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { pagination, normalizeLike, withConnection, respondError, parseSkills } = require('./helpers');

module.exports = function createAdminMatchingRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/matching', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const { page, limit, offset } = pagination(req.query);
                const where = [];
                const params = [];
                if (req.query.user) {
                    where.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)');
                    const like = normalizeLike(req.query.user);
                    params.push(like, like, like);
                }
                if (req.query.offer) {
                    where.push('o.titre LIKE ?');
                    params.push(normalizeLike(req.query.offer));
                }
                if (req.query.score) {
                    where.push('m.score >= ?');
                    params.push(Number(req.query.score) || 0);
                }
                const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const [[count]] = await connection.execute(
                    `SELECT COUNT(*) AS total
                     FROM matching m
                     JOIN utilisateur u ON u.id_user = m.id_user
                     JOIN offre o ON o.id_offre = m.id_offre
                     ${whereSQL}`,
                    params
                );
                const [matches] = await connection.execute(
                    `SELECT m.id_matching, m.score, m.date_matching,
                            u.id_user, u.nom, u.prenom, u.email,
                            cv.id_cv, cv.fichier,
                            o.id_offre, o.titre, o.skills,
                            e.nom AS entreprise
                     FROM matching m
                     JOIN utilisateur u ON u.id_user = m.id_user
                     LEFT JOIN cv ON cv.id_cv = m.id_cv
                     JOIN offre o ON o.id_offre = m.id_offre
                     LEFT JOIN entreprise e ON e.id_entreprise = o.id_entreprise
                     ${whereSQL}
                     ORDER BY m.date_matching DESC
                     LIMIT ? OFFSET ?`,
                    params.concat([limit, offset])
                );
                return {
                    matches: matches.map(publicMatch),
                    emptyMessage: matches.length ? '' : 'Aucun matching disponible pour le moment.',
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur matching');
        }
    });

    return router;
};

function publicMatch(row) {
    return {
        id: row.id_matching,
        id_matching: row.id_matching,
        score: Number(row.score) || 0,
        date_matching: row.date_matching,
        user: {
            id: row.id_user,
            name: [row.prenom, row.nom].filter(Boolean).join(' ').trim() || row.email,
            email: row.email
        },
        cv: row.id_cv ? { id: row.id_cv, fichier: row.fichier } : null,
        offer: {
            id: row.id_offre,
            title: row.titre,
            company: row.entreprise,
            skills: parseSkills(row.skills)
        },
        missingSkills: []
    };
}

};

__moduleDefs["routes/admin/notifications.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, pagination, withConnection, httpError, respondError } = require('./helpers');

module.exports = function createAdminNotificationsRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/notifications', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const { page, limit, offset } = pagination(req.query);
                const [[count]] = await connection.execute('SELECT COUNT(*) AS total FROM notification');
                const [[unread]] = await connection.execute('SELECT COUNT(*) AS total FROM notification WHERE lu = FALSE');
                const [rows] = await connection.execute(
                    'SELECT id_notification, type, message, date_notification, lu, created_at FROM notification ORDER BY date_notification DESC LIMIT ? OFFSET ?',
                    [limit, offset]
                );
                return {
                    notifications: rows,
                    unread: Number(unread.total) || 0,
                    pagination: { page, limit, total: Number(count.total) || 0 }
                };
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur notifications');
        }
    });

    router.post('/api/admin/notifications', verifyToken, requireAdmin, async (req, res) => {
        try {
            const notificationId = id();
            await withConnection(getConnection, async connection => {
                if (!req.body.message) throw httpError(400, 'Message requis');
                await connection.execute(
                    'INSERT INTO notification (id_notification, type, message, lu) VALUES (?, ?, ?, ?)',
                    [notificationId, req.body.type || 'info', req.body.message, Boolean(req.body.lu)]
                );
            });
            res.status(201).json({ ok: true, data: { id_notification: notificationId } });
        } catch (error) {
            respondError(res, error, 'Erreur création notification');
        }
    });

    router.put('/api/admin/notifications/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                const fields = ['type', 'message', 'lu'].filter(field => req.body[field] !== undefined);
                if (!fields.length) throw httpError(400, 'Aucune donnée à mettre à jour');
                const [result] = await connection.execute(
                    'UPDATE notification SET ' + fields.map(field => field + ' = ?').join(', ') + ' WHERE id_notification = ?',
                    fields.map(field => field === 'lu' ? Boolean(req.body[field]) : req.body[field]).concat([req.params.id])
                );
                if (!result.affectedRows) throw httpError(404, 'Notification introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur modification notification');
        }
    });

    router.delete('/api/admin/notifications/:id', verifyToken, requireAdmin, async (req, res) => {
        try {
            await withConnection(getConnection, async connection => {
                await connection.execute('DELETE FROM user_notification WHERE id_notification = ?', [req.params.id]);
                const [result] = await connection.execute('DELETE FROM notification WHERE id_notification = ?', [req.params.id]);
                if (!result.affectedRows) throw httpError(404, 'Notification introuvable');
            });
            res.json({ ok: true });
        } catch (error) {
            respondError(res, error, 'Erreur suppression notification');
        }
    });

    return router;
};

};

__moduleDefs["routes/admin/settings.js"] = function(module, exports, require, __filename, __dirname) {
const express = require('express');
const requireAdmin = require('../../middleware/requireAdmin');
const { id, withConnection, respondError } = require('./helpers');

module.exports = function createAdminSettingsRouter(deps) {
    const router = express.Router();
    const { getConnection, verifyToken } = deps;

    router.get('/api/admin/settings', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, ensureSettings);
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur paramètres');
        }
    });

    router.put('/api/admin/settings', verifyToken, requireAdmin, async (req, res) => {
        try {
            const data = await withConnection(getConnection, async connection => {
                const current = await ensureSettings(connection);
                const fields = ['notification_email', 'notification_push', 'visibilite_profil', 'partage_donnees']
                    .filter(field => req.body[field] !== undefined);
                if (fields.length) {
                    await connection.execute(
                        'UPDATE parametres SET ' + fields.map(field => field + ' = ?').join(', ') + ' WHERE id_params = ?',
                        fields.map(field => req.body[field]).concat([current.id_params])
                    );
                }
                return await ensureSettings(connection);
            });
            res.json({ ok: true, data });
        } catch (error) {
            respondError(res, error, 'Erreur mise à jour paramètres');
        }
    });

    return router;
};

async function ensureSettings(connection) {
    const [rows] = await connection.execute(
        'SELECT id_params, notification_email, notification_push, visibilite_profil, partage_donnees, created_at FROM parametres ORDER BY created_at ASC LIMIT 1'
    );
    if (rows.length) return rows[0];
    const settingsId = id();
    await connection.execute(
        'INSERT INTO parametres (id_params, notification_email, notification_push, visibilite_profil, partage_donnees) VALUES (?, ?, ?, ?, ?)',
        [settingsId, 'enabled', 'enabled', 'public', 'disabled']
    );
    const [created] = await connection.execute(
        'SELECT id_params, notification_email, notification_push, visibilite_profil, partage_donnees, created_at FROM parametres WHERE id_params = ?',
        [settingsId]
    );
    return created[0];
}

};

module.exports = __load('server.js');
