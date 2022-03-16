export function main(){
    try {
        const hostname = 'wacca.marv-games.jp';
        if (location.hostname != hostname){
            throw new Error('invalid-hostname');
        }

        const loginPagePath = '/web/login';
        if (location.pathname.indexOf(loginPagePath) == 0) {
            throw new Error('not-logged-in');
        }
        
        const playResultsPath = '/web/music';
        if (location.pathname.indexOf(playResultsPath) != 0) {
            throw new Error('invalid-directory');
        }

        const songs = document.querySelectorAll('li.item');
        let scoresList = [];

        songs.forEach(e => {
            const title = e.querySelector('.playdata__score-list__song-info__name');
            const escapedTitle = title.innerText.replace(',', '__');
            const levels = e.querySelectorAll('.playdata__score-list__song-info__lv');
            const scores = e.querySelectorAll('.playdata__score-list__song-info__score');
            const pattern = /(NORMAL|HARD|EXPERT|INFERNO) [0-9]{1,2}\+*/;

            // NORMAL
            scoresList.push(
                [
                    escapedTitle,
                    levels[0].innerText.match(pattern)[0],
                    parseInt(scores[0].innerText.match(/[0-9]+/))
                ]
            );

            // HARD
            scoresList.push(
                [
                    escapedTitle,
                    levels[1].innerText.match(pattern)[0],
                    parseInt(scores[1].innerText.match(/[0-9]+/))
                ]
            );

            // EXPERT
            scoresList.push(
                [
                    escapedTitle,
                    levels[2].innerText.match(pattern)[0],
                    parseInt(scores[2].innerText.match(/[0-9]+/))
                ]
            );

            // INFERNO
            scoresList.push(
                [
                    escapedTitle,
                    levels[3].innerText.match(pattern)[0],
                    parseInt(scores[3].innerText.match(/[0-9]+/))
                ]
            );

        });

        scoresList.forEach((e, i) => {
            scoresList[i] = e.join(',');
        });

        const parentNode = document.querySelector('.playdata__score-list');
        const openMainPage = `javascript:setData=document.querySelector('#scoresList').value;if(navigator.clipboard==undefined){window.clipboardData.setData('Text',setData);}else{navigator.clipboard.writeText(setData);};window.open('https://bit.ly/3tiGGDb');`;
        const insertCode = 
        `<div style="text-align: left; font-size: 0.8em; padding: 20px">
            <p style="font-weight: bold; padding: 10px 0 10px;">WACCA RATING ANALYZER v1.01</p>
            <p>スコアの取得が完了しました。</p>
            <p>計算を開始するには、以下のボタンを押してください。</p>
            <p>The web program is now ready to run.</p>
            <p>To continue, press the button below.</p>
            <div style="padding: 10px 0 10px;">
                <button onclick="${openMainPage}">プログラムを開く / Open the Web Program</button>
            </div>
            <p>ブラウザーが取得したデータ:</p>
            <p>Data collected by the browser:</p>
            <textarea style="width: 100%; height: 100px;" id="scoresList" readonly>${scoresList.join('\n')}</textarea>
        </div>`;

        parentNode.insertAdjacentHTML('beforebegin', insertCode);
        location.href = '#isNormal';
        
    } catch (error) {
        switch (error.message) {
            case 'invalid-hostname':
                const invHostnameMsg = 'ここはWACCAのマイページではありません。\nWACCAのマイページへログインし、「プレイデータ」タブの中にある「楽曲スコア」ページで、改めて実行してください。\nThis is not WACCA\'s My Page.\nPlease log in to WACCA\'s My Page and run it again on the "Song Scores(楽曲スコア)" page in the "Play Data(プレイデータ)" tab.';
                const loginPageAddr = 'https://wacca.marv-games.jp/web/login';
                window.alert(invHostnameMsg);
                location.href = loginPageAddr;
                break;

            case 'not-logged-in':
                const loggedOutMsg = 'WACCAのマイページへログインしていないようです。\nWACCAのマイページへログインし、「プレイデータ」タブの中にある「楽曲スコア」ページで、改めて実行してください。\nIt seems that you have not logged in to WACCA\'s My Page.\nPlease log in to WACCA\'s My Page and run it again on the "Song Scores(楽曲スコア)" page in the "Play Data(プレイデータ)" tab.';
                window.alert(loggedOutMsg);
                break;
        
            case 'invalid-directory':
                const invDirectoryMsg = 'このページではブックマークレットを実行できません。このダイアログを閉じると「楽曲スコア」ページへ移動しますので、そこで改めて実行してください。\nThe bookmarklet cannot be run on this page. When you close this dialog, you will be redirected to the "Music Scores(楽曲スコア)" page, so please run it again there.';
                const playResultsAddr = 'https://wacca.marv-games.jp/web/music';
                window.alert(invDirectoryMsg);
                location.href = playResultsAddr;
                break;
        }
    }
};