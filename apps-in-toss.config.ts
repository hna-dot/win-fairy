import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'win-fairy',
  brand: {
    primaryColor: '#c9a227',
  },
  webView: {},
  // 갤러리 저장을 위해 photos write 권한 필요
  permissions: [{ name: 'photos', access: 'write' }],
  webBundleDir: 'dist',
});
