// setup-project.js
// Run with: node setup-project.js

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'green') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`  ✓ Created: ${dir}`, 'blue');
  }
}

function createFile(filePath, content) {
  writeFileSync(filePath, content);
  log(`  ✓ Created: ${filePath}`, 'blue');
}

// Project structure
const projectStructure = {
  directories: [
    'src',
    'src/modules',
    'src/modules/auth',
    'src/modules/profiles',
    'src/modules/trees',
    'src/modules/photos',
    'src/modules/folders',
    'src/modules/species',
    'src/shared',
    'src/shared/utils',
    'src/shared/types',
    'src/shared/services',
    'src/shared/constants',
    'src/database',
    'src/database/schema',
    'src/database/migrations',
    'src/config',
    'src/plugins',
    'src/templates',
    'src/templates/emails',
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/fixtures'
  ]
};

// File contents
const packageJson = `{
  "name": "kokoru-garden-api",
  "version": "2.0.0",
  "description": "Kokoru Garden API - TypeScript + Fastify + Drizzle",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/database/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/database/seed.ts",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \\"src/**/*.ts\\""
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.0",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/session": "^10.7.0",
    "@fastify/swagger": "^8.14.0",
    "@fastify/swagger-ui": "^3.0.0",
    "argon2": "^0.31.2",
    "cloudinary": "^2.0.0",
    "dotenv": "^16.4.1",
    "drizzle-orm": "^0.33.0",
    "drizzle-zod": "^0.5.1",
    "fastify": "^4.26.0",
    "google-auth-library": "^9.6.3",
    "ioredis": "^5.3.2",
    "nanoid": "^5.0.4",
    "pg": "^8.11.3",
    "pino": "^8.17.2",
    "pino-pretty": "^10.3.1",
    "resend": "^3.1.0",
    "sharp": "^0.33.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/pg": "^8.10.9",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "drizzle-kit": "^0.24.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.4",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vitest": "^1.2.1"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}`;

const tsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@database/*": ["src/database/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}`;

const envExample = `# Environment
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database - PostgreSQL
DATABASE_URL=postgresql://bonsai_user:bonsai_pass@localhost:5432/bonsaitracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bonsaitracker
DB_USER=bonsai_user
DB_PASSWORD=bonsai_pass

# JWT Tokens
JWT_SECRET=your-jwt-secret-change-this
JWT_ACCESS_SECRET=your-access-secret-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_RESET_SECRET=your-reset-secret-change-this
JWT_EMAIL_SECRET=your-email-secret-change-this
JWT_EXPIRE=7d
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="Kokoru <hello@kokoru-garden.com>"
EMAIL_REPLY_TO=kokoru.garden@gmail.com
EMAIL_VERIFY_REQUIRED=true
EMAIL_RATE_LIMIT_ENABLED=true

# Resend API (alternativa per produzione)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URLs
FRONTEND_URL=http://localhost:3001,http://localhost:3000

# Session
SESSION_SECRET=your-session-secret-change-this

# Redis (optional - for caching)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug`;

const gitignore = `# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Database
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Testing
coverage/
.nyc_output/

# Temp
tmp/
temp/`;

const drizzleConfig = `import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});`;

const prettierConfig = `{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}`;

const eslintConfig = `{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}`;

const serverStub = `// src/server.ts
import { buildApp } from './app';
import { logger } from './shared/utils/logger';
import { testConnection, closeDatabase } from './database/connection';

const start = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Build Fastify app
    const app = await buildApp();
    
    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    logger.info(\`🚀 Server running at http://\${host}:\${port}\`);
    logger.info(\`📚 Swagger docs at http://\${host}:\${port}/docs\`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

start();`;

const appStub = `// src/app.ts
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  // await app.register(corsPlugin);
  // await app.register(authPlugin);
  // await app.register(swaggerPlugin);
  
  // Register routes
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}`;

const loggerStub = `// src/shared/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
    },
  },
});`;

const dbConnectionStub = `// src/database/connection.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { logger } from '@/shared/utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
  process.exit(-1);
});

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
  logger.info('Database connection pool closed');
}

export type Database = typeof db;`;

const schemaIndexStub = `// src/database/schema/index.ts
// Database schema will be added here
export {};`;

// Main execution
async function setup() {
  log('\n🚀 Kokoru Garden API - Project Setup\n', 'green');

  // Step 1: Create directories
  log('📁 Creating project structure...', 'yellow');
  projectStructure.directories.forEach(createDirectory);

  // Step 2: Create files
  log('\n📄 Creating configuration files...', 'yellow');
  createFile('package.json', packageJson);
  createFile('tsconfig.json', tsConfig);
  createFile('.env.example', envExample);
  createFile('.gitignore', gitignore);
  createFile('drizzle.config.ts', drizzleConfig);
  createFile('.prettierrc', prettierConfig);
  createFile('.eslintrc.json', eslintConfig);

  // Step 3: Create source files
  log('\n📝 Creating source files...', 'yellow');
  createFile('src/server.ts', serverStub);
  createFile('src/app.ts', appStub);
  createFile('src/shared/utils/logger.ts', loggerStub);
  createFile('src/database/connection.ts', dbConnectionStub);
  createFile('src/database/schema/index.ts', schemaIndexStub);

  // Step 4: Create empty index files for modules
  const modules = ['auth', 'profiles', 'trees', 'photos', 'folders', 'species'];
  modules.forEach(module => {
    createFile(`src/modules/${module}/index.ts`, '// TODO: Implement module');
  });

  // Step 5: Copy .env file
  if (!existsSync('.env')) {
    copyFileSync('.env.example', '.env');
    log('\n📋 Created .env from .env.example', 'blue');
  }

  log('\n✅ Project structure created successfully!\n', 'green');
  
  // Final instructions
  log('📦 Next steps:', 'yellow');
  console.log(`
  1. Install dependencies:
     ${colors.blue}pnpm install${colors.reset}
  
  2. Update .env with your database credentials
  
  3. Create database schema:
     - Add full schema to src/database/schema/index.ts
     - Run: ${colors.blue}pnpm db:generate${colors.reset}
     - Run: ${colors.blue}pnpm db:migrate${colors.reset}
  
  4. Start development server:
     ${colors.blue}pnpm dev${colors.reset}
  `);

  log('🎉 Happy coding!', 'green');
}

// Run setup
setup().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});