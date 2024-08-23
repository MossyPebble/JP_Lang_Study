const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const axios = require('axios');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 16 * 70,
        height: 9 * 70 + 20,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        title: '일본어 공부용',
    });

    mainWindow.setMenu(null);

    mainWindow.loadFile('src/index.html');
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.handle('get_csv_data', (event, filename) => {
    const csvPath = path.join(__dirname, filename + '.csv');
    const csv = fs.readFileSync(csvPath, 'utf-8');
    
    const allRows = csv.split('\n');
    const rowData = [];

    for (let singleRow = 0; singleRow < allRows.length; singleRow++) {
        const rowCells = allRows[singleRow].split(',');

        if (singleRow === 0) {
        continue;
        }

        rowData.push(rowCells);
    }

    return rowData;
});

ipcMain.handle('get_tsv_data', (event, filename) => {
    const tsvPath = path.join(__dirname, filename + '.tsv');
    const tsv = fs.readFileSync(tsvPath, 'utf-8');
    
    const allRows = tsv.split('\n');
    const rowData = [];

    for (let singleRow = 0; singleRow < allRows.length; singleRow++) {
        const rowCells = allRows[singleRow].split('\t');

        if (singleRow === 0) {
        continue;
        }

        rowData.push(rowCells);
    }

    return rowData;
});

ipcMain.handle('load_novel_data_from_address', async (event, number, index) => {

    /**
     * 소설 번호와 인덱스(에피소드 번호에 해당)를 받아서 해당 소설의 내용을 가져온다.
     * 하멜른에서만 작동함!
     * 
     * @param {number} number
     * @param {number} index
     */

    // excutible path를 설정
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });

    // 새 페이지 생성
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });

    // 헤더 설정
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
        Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' });
        Object.defineProperty(navigator, 'appCodeName', { get: () => 'Mozilla' });
        Object.defineProperty(navigator, 'appName', { get: () => 'Netscape' });
        Object.defineProperty(navigator, 'appVersion', { get: () => '5.0 (Windows)' });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    });

    // ?? 뭔지 모르겠음
    await page.evaluateOnNewDocument(() => {

        // navigator.webdriver는 본래 headless에서 true이지만, 임의로 false로 설정
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });

        // 임의의 플러그인 배열과 언어 설정을 사용함
        Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3],
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });

        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    });

    //사이트 접속 (원하는 URL로 변경하여 사용)
    await page.goto('https://syosetu.org/novel/' + number + '/' + index + '.html',{
        waitUntil: 'networkidle2'
    });

    await page.screenshot({ path: 'screenshot.png' });

    // 본문 요소가 나타날 때 까지 대기
    await page.waitForSelector('#honbun');

    // 본문이 id가 honbun인 div 태그에 들어있다.
    const honbun = await page.evaluate(() => {
        return document.getElementById('honbun').innerText;
    });
    console.log('Honbun loaded!' + honbun);

    // 제목은 href가 ./인 a 태그에 들어있다.
    const title = await page.evaluate(() => {
        return document.querySelector('a[href="./"]').innerText;
    });
    console.log('Title loaded!');

    // 작가는 //*[@id="maind"]/div[1]/p[1]/a의 xpath에 들어있다.
    const author = await page.evaluate(() => {
        return document.evaluate('//*[@id="maind"]/div[1]/p[1]/a', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText;
    });
    console.log('Author loaded!');

    // 브라우저 닫기
    await browser.close();

    return {
        title: title,
        author: author,
        content: honbun,
        index: index,
    };
});

ipcMain.handle('save_novel_data', async (event, data) => {
    const filename = data.title + '-' + data.index + '-' + data.author + '.txt';
    
    // data는 각 줄을 구분한 리스트, 텍스트 문서는 줄바꿈으로 구분
    const text = data.content.join('\n');

    fs.writeFileSync(filename, text);
    return filename;
});

ipcMain.handle('get_previous_translation_data', async (event, title, index, author) => {
    const filename = title + '-' + index + '-' + author + '.txt';
    try {
        const text = fs.readFileSync(filename, 'utf-8');
        return text.split('\n');
    }
    catch (error) {
        return [];
    }
});