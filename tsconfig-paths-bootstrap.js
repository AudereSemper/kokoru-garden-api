// tsconfig-paths-bootstrap.js
import tsConfigPaths from 'tsconfig-paths';

tsConfigPaths.register({
  baseUrl: './dist',
  paths: {
    '@/*': ['src/*'],
    '@modules/*': ['src/modules/*'],
    '@shared/*': ['src/shared/*'],
    '@config/*': ['src/config/*'],
    '@database/*': ['src/database/*']
  }
});