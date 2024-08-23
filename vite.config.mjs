import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// vite의 defineConfig 함수를 이용해 설정을 정의한다.
export default defineConfig(() => {
    return {
        base: '',
        root: 'src',

        // 빌드 관련 설정 정의
        build: {
            assetsDir: '.',

            // rollupOptions는 번들러로 사용되는 rollup의 설정을 정의한다.
            rollupOptions: {
                input:{
                    main: resolve(__dirname, 'src/index.html'),
                },
                output: {
                    dir: resolve(__dirname, 'build'),
                    entryFileNames: '[name].js',
                }
            }
        },
    };
});