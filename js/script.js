// Initialize with user settings.
function initialize() {
    try {
        const datasetParam = document.querySelector('html').dataset.dataset;
        const xhr = new XMLHttpRequest();

        xhr.open('get', `https://shimmand.github.io/wacca-rating-analyzer/assets/dataset.csv?date=${datasetParam}`, true);
        xhr.send(null);
        xhr.onload = () => {
            const response = xhr.responseText;
            const datasetArr = response
                .split('\n')
                .filter(line => line.length > 0)
                .map(line => `[${line}]`);
            const scriptCode = `
                function getChartTable() {
                    return [
                        ${datasetArr.join(',\n')}
                    ];
                }`.replaceAll(/(^ {16}|^\n)/gm, '');
            const scriptElm = document.createElement('script');
            
            scriptElm.innerHTML = scriptCode;
            document.body.appendChild(scriptElm);

            // Generate a dataset table.
            generateDatasetTable();

            // Restore the language settings.
            switch (localStorage.getItem('rating-analyzer-lang')) {
                case 'japanese':
                    switchToJapanese();
                    break;

                case 'english':
                    switchToEnglish();
                    break;
            
                default:
                    switchToJapanese();
                    break;
            }

            // Restore the fixed display state of columns.
            const stickyCheckboxes = document.querySelectorAll('#column-sticky-toggle');
            switch (localStorage.getItem('rating-analyzer-table-fixed')) {
                case 'true':
                    stickyCheckboxes.forEach(input => input.checked = true);
                    break;

                case 'false':
                    stickyCheckboxes.forEach(input => input.checked = false);
                    break;
            
                default:
                    break;
            }

            // Restore the display state of "genre" columns.
            const genreCheckboxes = document.querySelectorAll('#column-genre-toggle');
            switch (localStorage.getItem('rating-analyzer-column-genre')) {
                case 'true':
                    genreCheckboxes.forEach(input => input.checked = true);
                    toggleColumnVisibility('genre', true);
                    break;

                case 'false':
                    genreCheckboxes.forEach(input => input.checked = false);
                    toggleColumnVisibility('genre', false);
                    break;
            
                default:
                    break;
            }

            // Restore the display state of English song titles.
            const altTitleCheckboxes = document.querySelectorAll('#alt-title-toggle');
            switch (localStorage.getItem('rating-analyzer-alt-title')) {
                case 'true':
                    altTitleCheckboxes.forEach(input => input.checked = true);
                    toggleDisplayState('alt-title', true);
                    break;

                case 'false':
                    altTitleCheckboxes.forEach(input => input.checked = false);
                    toggleDisplayState('alt-title', false);
                    break;
            
                default:
                    break;
            }

            // Restore the selected state of the type filter.
            const types = ['targets', 'candidates', 'others'];
            types.forEach(type => {
                const checkboxes = document.querySelectorAll(`.rating-${type}-toggle`);

                switch (localStorage.getItem(`rating-analyzer-filter-type-${type}`)) {
                case 'true':
                    checkboxes.forEach(input => input.checked = true);
                    break;

                case 'false':
                    checkboxes.forEach(input => input.checked = false);
                    break;
            
                default:
                    break;
                }
            })
            
            // Restore the selected state of the difficulty filter.
            const difficulties = ['normal', 'hard', 'expert', 'inferno'];
            difficulties.forEach(difficulty => {
                const checkboxes = document.querySelectorAll(`.difficulty-${difficulty}-toggle`);

                switch (localStorage.getItem(`rating-analyzer-filter-difficulty-${difficulty}`)) {
                case 'true':
                    checkboxes.forEach(input => input.checked = true);
                    break;

                case 'false':
                    checkboxes.forEach(input => input.checked = false);
                    break;
            
                default:
                    break;
                }
            })

            // Restore the page display scale.
            const scale = document.querySelector('#select-disp-scale');
            scale.value = localStorage.getItem('rating-analyzer-display-scale') || '100';
            changeDisplayScale();

            // Remove the badge if the latest news has been read.
            switch (localStorage.getItem('rating-analyzer-last-visited')) {
                case getLastUpdate():
                    break;

                default:
                    document.querySelector('#news').classList.remove('border-start-0');
                    document.querySelector('#news-badge').classList.remove('d-none');
                    break;
            }

            // Run the analyze function if the program is in restore mode.
            switch (localStorage.getItem('rating-analyzer-analyze-mode')) {
                case 'true':
                    startAnalyze();
                    break;

                case 'false':
                    break;
            
                default:
                    break;
            }

            // Run the restore function if the program is in restore mode.
            switch (localStorage.getItem('rating-analyzer-restore-mode')) {
                case 'true':
                    restorePrevData();
                    break;

                case 'false':
                    break;
            
                default:
                    break;
            }

            switchLoadingView(false);
        };

    } catch (error) {
        switchLoadingView(false);
        return false;
    }
}


function getLastUpdate() {
    return document.querySelector('html').dataset.update;
}


// Paste the clipboard contents into the textarea.
function paste() {
    const playdata = document.querySelector('#playdata');

    if (playdata.classList.contains('is-invalid')){
        playdata.classList.remove('is-invalid');
    }
    
    document.querySelectorAll('.error-feedback-1').forEach(div => {
        if (!div.classList.contains('d-none')) {
            div.classList.add('d-none')
        }
    });
    
    playdata.focus();
    
    const promise = navigator.clipboard.readText();

    promise.then(clipText => {
        playdata.value = clipText;
    }, _reason => {
        showDeniedWarning();
    });

    const helpBtn = document.querySelector('#btn-does-not-work-modal');
    
    if (helpBtn.classList.contains('d-none')) {
        helpBtn.classList.remove('d-none');
    }
}

// Display a message when access to the clipboard is denied.
function showDeniedWarning() {
    const playdata = document.querySelector('#playdata');

    if (!playdata.classList.contains('is-invalid')) {
        playdata.classList.add('is-invalid');
    }
    
    document.querySelectorAll('.error-feedback-1').forEach(div => {
        if (!div.classList.contains('d-none')) {
            div.classList.add('d-none')
        }
    });

    document.querySelectorAll('#warning-denied')[0].classList.remove('d-none');
}

// Analyze play results based on text in the text area.
function analyze(){
    const playdata = document.querySelector('#playdata');
    const charts = playdata.value.split('\n');

    let isClear = true;

    if (playdata.value.length == 0) {
        isClear = false;

        if (!playdata.classList.contains('is-invalid')) {
            playdata.classList.add('is-invalid');
        }

        document.querySelectorAll('.error-feedback-1').forEach(div => {
            if (!div.classList.contains('d-none')) {
                div.classList.add('d-none')
            }
        });

        document.querySelectorAll('#warning-empty')[0].classList.remove('d-none');

    } else {
        const searchPattern = /[^,]+,(NORMAL|HARD|EXPERT|INFERNO) [0-9]{1,2}\+?,[0-9]{1,7}/g;
        const testResult = charts.map(chart => chart.match(searchPattern) == chart);
        
        if (!testResult.indexOf(false)){
            isClear = false;

            if (!playdata.classList.contains('is-invalid')){
                playdata.classList.add('is-invalid');
            }
            
            document.querySelectorAll('.error-feedback-1').forEach(div => {
                if (!div.classList.contains('d-none')){
                    div.classList.add('d-none')
                }
            });

            document.querySelectorAll('#warning-invalid')[0].classList.remove('d-none');
        }
    }

    if (isClear){
        const scoresTables = document.querySelectorAll('.scoresTable');

        scoresTables.forEach(table => table.innerHTML = '');

        if (playdata.classList.contains('is-invalid')) {
            playdata.classList.remove('is-invalid');
        }

        let chartsListNew = [];
        let chartsListOld = [];

        charts.forEach(chart => {

            // [0: song-title, 1: chart-level, 2: score]
            const data = chart.split(',');

            // Restore escaped commas here when getting scores.
            const title = data[0].replace('__', ',');

            const level = data[1];
            const score = data[2];

            const rating = getChartConstants(title, level);

            if ((level != 'INFERNO 0') && (rating != null)) {
                let difficulty = '';

                if (level.indexOf('NORMAL') == 0) difficulty = 'normal';
                if (level.indexOf('HARD') == 0) difficulty = 'hard';
                if (level.indexOf('EXPERT') == 0) difficulty = 'expert';
                if (level.indexOf('INFERNO') == 0) difficulty = 'inferno';

                const multipliers = getMultiplierTable();
                let multiplier = 0;

                for (let i = 0; i < multipliers.length; i++) {
                    if (multiplier == 0) {
                        if (multipliers[i][0] <= Number(score)) multiplier = multipliers[i][1];
                    }
                }

                const maxBadgeCode = '<div class="badge badge-max border bg-secondary">MAX</div>';
                const adjustedRating = (multiplier * rating).toFixed(3);
                const upperRating = (multiplier < 4 ? (4 * rating).toFixed(3) : maxBadgeCode);
                const chartData = [title, difficulty, level, score, rating, multiplier, adjustedRating, upperRating];

                if (isThisChartNewer(title, level)) {
                    chartsListNew.push(chartData);
                } else {
                    chartsListOld.push(chartData);
                }
            }
        });

        chartsListNew.sort(function (a, b) { return (b[6] - a[6])} );
        chartsListOld.sort(function (a, b) { return (b[6] - a[6])} );

        // [0: newer-charts, 1: older-charts]
        const chartsLists = [chartsListNew, chartsListOld];

        const statsGraphs = document.querySelectorAll('.stats-graph');
        const rateGraph = document.querySelector('.rate-graph');
        const summedRateCurrents = document.querySelectorAll('.summedRateCurrent');
        const summedRateUppers = document.querySelectorAll('.summedRateUpper');
        const summarySubtotals = ['summary-subtotal-newer', 'summary-subtotal-older'];
        const targetsName = ['new', 'old'];
        const targetsLength = [15, 35];
        let varSingleRateLowers = [0, 0];
        let varSummedRateCurrents = [0, 0];
        let varSummedRateUppers = [0, 0];

        // Border by class
        // [(*)0: plain, (*)1: navy, (*)2: yellow, (*)3: red, (*)4: purple, (*)5: blue, (*)6: silver, (*)7: gold, 8: rainbow]
        let varClassRanges = [300, 300, 400, 300, 300, 300, 300, 300, 0];

        // Modifier values based on score
        // [0: 950k, 1: 960k, 2: 970k, 3: 980k, 4: 990k]
        const targetMultipliers = [3.00, 3.25, 3.50, 3.75, 4.00];

        chartsLists.forEach((chartsList, listIndex) => {

            // Calculate the maximum rating.
            // slice: Duplicate the chart list
            // sort: Sort in descending order by chart constant
            // slice: Filter by number of rating targets
            // reduce: Total the chart constants multiplied by 4
            varSummedRateUppers[listIndex] =
            chartsList
                .slice()
                .sort(function(a, b){return (b[4] - a[4])})
                .slice(0, targetsLength[listIndex])
                .reduce((sum, e) => sum + Number(e[4]), 0) * 4;

            // Array for graphs
            // [0: <950k, 1: 950k, 2: 960k, 3: 970k, 4: 980k, 5: 990k]
            let stats = [0, 0, 0, 0, 0, 0];

            chartsList.forEach((chart, index) => {
                const tempRow = document.createElement('tr');
                const tableRow = scoresTables[listIndex].appendChild(tempRow);
                let headerElm = 'td';
                let rateDataElm = 'td class="normal-single-rate"';

                if (index < targetsLength[listIndex]) {
                    headerElm = 'th scope="row" class="text-chromatic"';
                    rateDataElm = 'td class="top-single-rate"';
                    tableRow.classList.add('table-primary');
                    varSingleRateLowers[listIndex] = Number(chart[6]);
                    varSummedRateCurrents[listIndex] += Number(chart[6]);
                }

                switch (chart[1]) {
                    case 'normal':
                        tableRow.classList.add('difficulty-normal');
                        break;

                    case 'hard':
                        tableRow.classList.add('difficulty-hard');
                        break;

                    case 'expert':
                        tableRow.classList.add('difficulty-expert');
                        break;

                    case 'inferno':
                        tableRow.classList.add('difficulty-inferno');
                        break;
                
                    default:
                        break;
                }

                const increases = targetMultipliers.map(multiplier => {
                    if ((chart[5] < multiplier) && ((chart[4] * multiplier) > varSingleRateLowers[listIndex])) {
                        return `<a class="badge rate-increase rounded-0 box-shadow-black m-1" href="#" onclick="startMultiSelectMode(this, '${targetsName[listIndex]}'); return false;" data-rating="${(chart[4] * multiplier).toFixed(3)}" data-now="${chart[6]}">+${((chart[4] * multiplier) - varSingleRateLowers[listIndex]).toFixed(3)}</a>`;
                    } else {
                        return '-';
                    }
                });

                const increasesForFileRow = increases.map(data => {
                    if (data != '-'){
                        return data.match(/\+[0-9]{1,2}\.[0-9]{3}/);
                    } else {
                        return '-';
                    }
                });

                if (increases.filter(e => e == '-').length == increases.length) {
                    tableRow.classList.add('all-clear');
                } else {
                    tableRow.classList.add('table-custom-magenta');
                }

                if (tableRow.classList.contains('table-primary') || tableRow.classList.contains('table-custom-magenta')) {
                    if (chart[5] < 3.00) {
                        stats[0] += 1
                    }

                    if (chart[5] == 3.00) {
                        stats[1] += 1
                    }
                        
                    if (chart[5] == 3.25) {
                        stats[2] += 1
                    }

                    if (chart[5] == 3.50) {
                        stats[3] += 1
                    }

                    if (chart[5] == 3.75) {
                        stats[4] += 1
                    }

                    if (chart[5] == 4.00) {
                        stats[5] += 1
                    }
                }

                tableRow.classList.add('border-3', 'border-top-0', 'border-end-0', 'border-start-0');

                const genreColClass = document.querySelector('#column-genre-toggle').checked ? 'genre-column' : 'genre-column d-none';
                const altTitleClass = document.querySelector('#alt-title-toggle').checked ? 'd-flex alt-title' : 'd-flex alt-title d-none';

                const code = `
                    <${headerElm}>${index + 1}</td>
                    <td class="${genreColClass}"><div class="badge border ${getGenreClass(getGenre(chart[0]))} text-shadow-black w-100"><span>${getGenreElement(getGenre(chart[0]))}</span></div></td>
                    <td class="sticky-column">
                        <div class="d-flex">
                            <div class="vstack my-1 me-1">
                                <div class="badge border ${getGenreClass(getGenre(chart[0]))} m-0 p-0 w-hrem h-hrem"><span></span></div>
                                <div class="badge border ${chart[1]} m-0 p-0 w-hrem h-hrem"><span></span></div>
                            </div>
                            <div class="w-100">${chart[0]}</div>
                        </div>
                        <div class="${altTitleClass}">
                            <div class="vstack my-1 me-1">
                                <div class="m-0 p-0 w-hrem h-hrem"><span></span></div>
                                <div class="m-0 p-0 w-hrem h-hrem"><span></span></div>
                            </div>
                            <div class="text-gray-500 small w-100">${getEnglishTitle(chart[0])}</div>
                        </div>
                    </td>
                    <td><div class="badge border difficulty ${chart[1]}">${chart[2]}</div></td>
                    <td>${chart[3]}</td>
                    <td>
                        <div class="d-flex justify-content-between">
                            <div>${chart[4]}</div>
                            <div class="ms-1 text-gray-500">&times;</div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex justify-content-between">
                            <div>${chart[5].toFixed(2)}</div>
                            <div class="ms-1 text-gray-500">=</div>
                        </div>
                    </td>
                    <${rateDataElm}>${chart[6]}</td>
                    <td>${chart[7]}</td>
                    <td>${increases[0]}</td>
                    <td>${increases[1]}</td>
                    <td>${increases[2]}</td>
                    <td>${increases[3]}</td>
                    <td>${increases[4]}</td>`
                .replaceAll(/(^ {20}|^\n)/gm, '');

                tableRow.innerHTML = code;
                tableRow.setAttribute('data-index', index + 1);
                tableRow.setAttribute('data-const', chart[4]);
                tableRow.setAttribute('data-rate', chart[6]);

                const chartType = (listIndex == 0) ? 'New' : 'Old';
                const maxRate = Number(4 * chart[4]).toFixed(3);
                const fileRow = `"${chartType}","${index + 1}","${chart[0]}","${chart[2]}","${chart[3]}","${chart[4]}","${chart[5].toFixed(2)}","${chart[6]}","${maxRate}","${increasesForFileRow[0]}","${increasesForFileRow[1]}","${increasesForFileRow[2]}","${increasesForFileRow[3]}","${increasesForFileRow[4]}"`;

                tableRow.setAttribute('data-file-row', fileRow);
            });

            summedRateCurrents[listIndex].innerHTML = varSummedRateCurrents[listIndex].toFixed(3);
            summedRateUppers[listIndex].innerHTML = `MAX ${varSummedRateUppers[listIndex].toFixed(3)}`;

            document.querySelector(`#${summarySubtotals[listIndex]}`).innerHTML = varSummedRateCurrents[listIndex].toFixed(3);
            document.querySelector(`#${summarySubtotals[listIndex]}-ratio`).innerHTML = `${Number(varSummedRateCurrents[listIndex] / varSummedRateUppers[listIndex] * 100).toFixed(1)}%`;

            const chartsCount =  stats.reduce((sum, e) => sum + e, 0);
            
            statsGraphs[listIndex].querySelectorAll('.graph-bar-stats').forEach((div, index) => {
                const style = `width: ${ stats[index] / chartsCount * 100}%;`;
                div.setAttribute('style', style);
                div.setAttribute('aria-valuenow',  stats[index]);
                div.setAttribute('aria-valuemax', chartsCount);
            });

            statsGraphs[listIndex].querySelectorAll('.graph-ratio-stats').forEach((div, index) => {
                div.innerHTML = stats[index];
            });
        });
        
        const totalRateUpper = varSummedRateUppers.reduce((sum, e) => sum + e, 0).toFixed(3);
        const totalRateCurrent = varSummedRateCurrents.reduce((sum, e) => sum + e, 0).toFixed(3);

        const scaleDotsVolume = Math.floor(totalRateUpper / 100);
        const extraRate = totalRateUpper - (scaleDotsVolume * 100);
        const equalRange = (100 - (extraRate / totalRateUpper * 100)) / scaleDotsVolume;

        const scaleDotCode = `
            <div class="scale-dot position-absolute translate-middle text-white" style="left: 0%!important; top: 45%!important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dot" viewBox="0 0 16 16">
                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                </svg>
            </div>`
        .replaceAll(/(^ {12}|^\n)/gm, '');

        varClassRanges[(varClassRanges.length - 1)] = (totalRateUpper - 2500);

        document.querySelector('#total-rate-current').innerHTML = totalRateCurrent;
        document.querySelector('#total-rate-upper').innerHTML = `MAX ${totalRateUpper}`;        
        document.querySelector('#summary-total').innerHTML = totalRateCurrent;
        document.querySelector('#summary-total-ratio').innerHTML = `${Number(totalRateCurrent / totalRateUpper * 100).toFixed(1)}%`;
        
        const targetDiv = document.querySelector('#total-rate-class');
        const classColors = ['bg-plain', 'bg-navy', 'bg-yellow', 'bg-red', 'bg-purple', 'bg-blue', 'bg-silver', 'bg-gold', 'bg-rainbow'];
        const classBorders = [0, 300, 600, 1000, 1300, 1600, 1900, 2200, 2500];

        classColors.forEach(color => {
            if (targetDiv.classList.contains(color)) {
                targetDiv.classList.remove(color);
            }
        });

        checkColor:
        for (let index = classBorders.length - 1; index > 0; index--) {
            if (totalRateCurrent >= classBorders[index]) {
                targetDiv.classList.add(classColors[index]);
                break checkColor;
            }
        }

        document.querySelectorAll('.scale-dot').forEach(div => div.remove());

        for (let index = 0; index < scaleDotsVolume; index++) {
            const dotLocation = (index + 1) * equalRange;
            const insertCode = scaleDotCode.replaceAll('left: 0%', `left: ${dotLocation}%`);
            document.querySelector('div.rate-graph div.graph-bar').insertAdjacentHTML('beforeend', insertCode);
        }

        document.querySelectorAll('.current-loc').forEach(div => {
            const styleTextBefore = div.getAttribute('style');
            const findPattern = /left: [0-9.]+?%!important;/;
            const replaceText = `left: ${totalRateCurrent / totalRateUpper * 100}%!important;`;
            const styleTextAfter = styleTextBefore.replace(findPattern, replaceText);
            div.setAttribute('style', styleTextAfter);
        });

        rateGraph.querySelectorAll('.graph-bar-rate').forEach((div, index) => {
            const borderValue = varClassRanges[index];
            const style = `width: ${borderValue / totalRateUpper * 100}%;`;
            div.setAttribute('style', style);
            div.setAttribute('aria-valuenow', borderValue);
            div.setAttribute('aria-valuemax', totalRateUpper);
        });

        rateGraph.querySelectorAll('.graph-bar-rate-2').forEach((div, index) => {
            const borderValue = index ? varSummedRateCurrents[0] : varSummedRateCurrents[1];
            const style = `width: ${borderValue / totalRateUpper * 100}%;`;
            div.setAttribute('style', style);
            div.setAttribute('aria-valuenow', borderValue);
            div.setAttribute('aria-valuemax', totalRateUpper);
        });

        document.querySelectorAll('input[disabled]').forEach(e => e.disabled = false);

        playdata.classList.add('is-valid');

        const isTableSticky = (document.querySelector('#column-sticky-toggle').checked == true);
        toggleColumnFixed(isTableSticky);

        if (localStorage.getItem('rating-analyzer-prev') != playdata.value) {
            const date = new Date();
            const formattedDate = [
                date.getFullYear(),
                '-',
                ('0' + (date.getMonth() + 1)).slice(-2),
                '-',
                ('0' + date.getDate()).slice(-2),
                ' ',
                ('0' + date.getHours()).slice(-2),
                ':',
                ('0' + date.getMinutes()).slice(-2),
            ].join('');
            
            localStorage.setItem('rating-analyzer-prev', playdata.value);
            localStorage.setItem('rating-analyzer-prev-date', formattedDate);
        }

        updateChartVisibilityByType();
        updateChartVisibilityByDifficulty();
        refreshChartVisibility();

        switch (localStorage.getItem('rating-analyzer-lang')) {
            case 'japanese':
                switchToJapanese();
                break;

            case 'english':
                switchToEnglish();
                break;
        
            default:
                switchToJapanese();
                break;
        }

        const pasteBtn = document.querySelector('#btn-paste');
        const analyzeBtn = document.querySelector('#btn-analyze');
        pasteBtn.disabled = true;
        analyzeBtn.disabled = true;

        const helpBtn = document.querySelector('#btn-does-not-work-modal');
        helpBtn.classList.add('d-none');
    }
}

// Set filters based on changes in type options.
function toggleChartVisibilityByType(type, checked) {
    const types = ['targets', 'candidates', 'others'];
    if (types.includes(type) === false) {
        return false;
    }

    const checkboxes = document.querySelectorAll(`.rating-${type}-toggle`);
    checkboxes.forEach(input => input.checked = checked);
    localStorage.setItem(`rating-analyzer-filter-type-${type}`, checked);

    const selectors = [
        'tr[data-index].table-primary',
        'tr[data-index].table-custom-magenta',
        'tr[data-index]:not(.table-primary):not(.table-custom-magenta)'
    ];

    const targetRows = document.querySelectorAll(selectors[types.indexOf(type)]);
    targetRows.forEach(row => {
        if (checked) {
            row.classList.remove('type-hidden');
        } else {
            row.classList.add('type-hidden');
        }
    });

    refreshChartVisibility();
}

// Set filters based on the current type options.
function updateChartVisibilityByType() {
    const types = ['targets', 'candidates', 'others'];
    const selectors = [
            'tr[data-index].table-primary',
            'tr[data-index].table-custom-magenta',
            'tr[data-index]:not(.table-primary):not(.table-custom-magenta)'
        ];

    types.forEach(type => {
        const checkboxes = document.querySelectorAll(`.rating-${type}-toggle`);
        const checked = checkboxes[0].checked;
        const targetRows = document.querySelectorAll(selectors[types.indexOf(type)]);

        targetRows.forEach(row => {
            if (checked) {
                row.classList.remove('type-hidden');
            } else {
                row.classList.add('type-hidden');
            }
        });
    })
}

// Set filters based on changes in difficulty options.
function toggleChartVisibilityByDifficulty(difficulty, checked) {
    const difficulties = ['normal', 'hard', 'expert', 'inferno'];

    if (difficulties.includes(difficulty) === false) {
        return false;
    }

    const checkboxes = document.querySelectorAll(`.difficulty-${difficulty}-toggle`);

    checkboxes.forEach(input => input.checked = checked);
    localStorage.setItem(`rating-analyzer-filter-difficulty-${difficulty}`, checked);

    const targetRows = document.querySelectorAll(`.difficulty-${difficulty}`);
    targetRows.forEach(row => {
        if (checked) {
            row.classList.remove('difficulty-hidden');
        } else {
            row.classList.add('difficulty-hidden');
        }
    });

    refreshChartVisibility();
}

// Set filters based on the current difficulty options.
function updateChartVisibilityByDifficulty() {
    const difficulties = ['normal', 'hard', 'expert', 'inferno'];
    
    difficulties.forEach(difficulty => {
        const checkboxes = document.querySelectorAll(`.difficulty-${difficulty}-toggle`);
        const checked = checkboxes[0].checked;
        const targetRows = document.querySelectorAll(`.difficulty-${difficulty}`);

        targetRows.forEach(row => {
            if (checked) {
                row.classList.remove('difficulty-hidden');
            } else {
                row.classList.add('difficulty-hidden');
            }
        });
    })
}

// Apply a filter to the table.
function refreshChartVisibility() {
    const rows = document.querySelectorAll('tr[data-index]');
    rows.forEach(row => {
        if (row.classList.contains('type-hidden') || row.classList.contains('difficulty-hidden')) {
            row.classList.add('d-none');
        } else {
            row.classList.remove('d-none');
        }
    });
}

// Toggle the display status of any column.
function toggleColumnVisibility(columnName, checked) {
    const checkboxes = document.querySelectorAll(`#column-${columnName}-toggle`);
    checkboxes.forEach(input => input.checked = checked);
    localStorage.setItem(`rating-analyzer-column-${columnName}`, checked);

    const stickyData = document.querySelectorAll(`.${columnName}-column`);
    stickyData.forEach(data => {
        if (checked) {
            data.classList.remove('d-none');
        } else {
            data.classList.add('d-none');
        }
    });
}

// Toggle fixed view of columns.
function toggleColumnFixed(checked) {
    const checkboxes = document.querySelectorAll('#column-sticky-toggle');
    checkboxes.forEach(input => input.checked = checked);
    localStorage.setItem('rating-analyzer-table-fixed', checked);

    const stickyData = document.querySelectorAll('.sticky-column');
    stickyData.forEach(data => {
        if (checked) {
            data.classList.remove('sticky-disabled');
        } else {
            data.classList.add('sticky-disabled');
        }
    });
}

// Toggle display state of any elements.
function toggleDisplayState(className, checked) {
    const checkboxes = document.querySelectorAll(`#${className}-toggle`);
    checkboxes.forEach(input => input.checked = checked);
    localStorage.setItem(`rating-analyzer-${className}`, checked);

    const targets = document.querySelectorAll(`.${className}`);
    targets.forEach(data => {
        if (checked) {
            data.classList.remove('d-none');
        } else {
            data.classList.add('d-none');
        }
    });
}

// Clear the text area.
function clearPlaydata() {
    document.querySelectorAll('#playdata')[0].value = '';
    location.reload();
}

// Enable data analyze mode.
function activateAnalyzeMode() {
    const playdata = document.querySelector('#playdata');

    localStorage.setItem('rating-analyzer-temp', playdata.value);
    localStorage.setItem('rating-analyzer-analyze-mode', 'true');
    playdata.value = '';

    location.reload();
}

// Run the analyze.
function startAnalyze() {
    const temp = localStorage.getItem('rating-analyzer-temp');
    const playdata = document.querySelector('#playdata');

    localStorage.setItem('rating-analyzer-analyze-mode', 'false');
    playdata.value = temp;
    localStorage.removeItem('rating-analyzer-temp');

    analyze();
}

// Enable data restore mode.
function activateRestoreMode() {
    const prevData = localStorage.getItem('rating-analyzer-prev');
    const textarea = document.querySelector('#playdata');

    if (prevData === null) {
        document.querySelector('#btn-restore-fail-modal').click();
        return false;
    }

    localStorage.setItem('rating-analyzer-restore-mode', 'true');
    textarea.value = '';
    location.reload();
}

// Restore the previous data.
function restorePrevData() {
    const prevData = localStorage.getItem('rating-analyzer-prev');
    const prevDataDate = localStorage.getItem('rating-analyzer-prev-date');
    const textarea = document.querySelector('#playdata');

    localStorage.setItem('rating-analyzer-restore-mode', 'false');
    textarea.value = prevData;

    analyze();

    document.querySelector('#last-update').innerHTML = prevDataDate;
    document.querySelector('#btn-restored-modal').click();
}

// Change the display scale.
function changeDisplayScale() {
    const root = document.querySelector('html');
    const scale = document.querySelector('#select-disp-scale');
    const scaleList = ['fs-100', 'fs-95', 'fs-90', 'fs-85', 'fs-80', 'fs-75', 'fs-70', 'fs-65', 'fs-60', 'fs-55', 'fs-50'];

    scaleList.forEach(e => {
        if (root.classList.contains(e)) {
            root.classList.remove(e);
        }
    });

    root.classList.add(`fs-${scale.value}`);
    localStorage.setItem('rating-analyzer-display-scale', scale.value);
}

// Copy the bookmarklet.
function copyBookmarklet() {
    const copyTarget = document.getElementById("copyTarget");
    const writeString = copyTarget.value;

    if (navigator.clipboard == undefined) {
        window.clipboardData.setData('Text', writeString);
    } else {
        navigator.clipboard.writeText(writeString);
    };

    alert("コピーしました！\nCopied!");
};

// Get score and modifier mapping table.
function getMultiplierTable() {
    return [
        [990000, 4],
        [980000, 3.75],
        [970000, 3.5],
        [960000, 3.25],
        [950000, 3],
        [940000, 2.75],
        [920000, 2.5],
        [900000, 2],
        [850000, 1],
        [800000, 0.8],
        [700000, 0.7],
        [600000, 0.6],
        [500000, 0.5],
        [400000, 0.4],
        [300000, 0.3],
        [200000, 0.2],
        [100000, 0.1],
        [0, 0]
    ];
}

// Get chart constants.
function getChartConstants(songTitle, diffValue) {
    const songs = getChartTable();
    const indexes = {
        'title'             : songs[0].indexOf('@song-title'),
        'genre'             : songs[0].indexOf('@genre-name'),
        'normal-level'      : songs[0].indexOf('@normal-level'),
        'normal-constant'   : songs[0].indexOf('@normal-constant'),
        'normal-newer'      : songs[0].indexOf('@normal-newer'),
        'hard-level'        : songs[0].indexOf('@hard-level'),
        'hard-constant'     : songs[0].indexOf('@hard-constant'),
        'hard-newer'        : songs[0].indexOf('@hard-newer'),
        'expert-level'      : songs[0].indexOf('@expert-level'),
        'expert-constant'   : songs[0].indexOf('@expert-constant'),
        'expert-newer'      : songs[0].indexOf('@expert-newer'),
        'inferno-level'     : songs[0].indexOf('@inferno-level'),
        'inferno-constant'  : songs[0].indexOf('@inferno-constant'),
        'inferno-newer'     : songs[0].indexOf('@inferno-newer')
    };
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return Number(song[indexes['normal-constant']]).toFixed(1);
            }

            if (song[indexes['hard-level']] == diffValue) {
                return Number(song[indexes['hard-constant']]).toFixed(1);
            }

            if (song[indexes['expert-level']] == diffValue) {
                return Number(song[indexes['expert-constant']]).toFixed(1);
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return Number(song[indexes['inferno-constant']]).toFixed(1);
            }
        }
    }
}

// Check if the chart is a newer.
function isThisChartNewer(songTitle, diffValue) {
    const songs = getChartTable();
    const indexes = {
        'title'             : songs[0].indexOf('@song-title'),
        'genre'             : songs[0].indexOf('@genre-name'),
        'normal-level'      : songs[0].indexOf('@normal-level'),
        'normal-constant'   : songs[0].indexOf('@normal-constant'),
        'normal-newer'      : songs[0].indexOf('@normal-newer'),
        'hard-level'        : songs[0].indexOf('@hard-level'),
        'hard-constant'     : songs[0].indexOf('@hard-constant'),
        'hard-newer'        : songs[0].indexOf('@hard-newer'),
        'expert-level'      : songs[0].indexOf('@expert-level'),
        'expert-constant'   : songs[0].indexOf('@expert-constant'),
        'expert-newer'      : songs[0].indexOf('@expert-newer'),
        'inferno-level'     : songs[0].indexOf('@inferno-level'),
        'inferno-constant'  : songs[0].indexOf('@inferno-constant'),
        'inferno-newer'     : songs[0].indexOf('@inferno-newer')
    };
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return song[indexes['normal-newer']];
            }

            if (song[indexes['hard-level']] == diffValue) {
                return song[indexes['hard-newer']];
            }

            if (song[indexes['expert-level']] == diffValue) {
                return song[indexes['expert-newer']];
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return song[indexes['inferno-newer']];
            }
        }
    }
}

// Get chart constants.
function getChartConstants(songTitle, diffValue) {
    const songs = getChartTable();
    const indexes = {
        'title'             : songs[0].indexOf('@song-title'),
        'genre'             : songs[0].indexOf('@genre-name'),
        'normal-level'      : songs[0].indexOf('@normal-level'),
        'normal-constant'   : songs[0].indexOf('@normal-constant'),
        'normal-newer'      : songs[0].indexOf('@normal-newer'),
        'hard-level'        : songs[0].indexOf('@hard-level'),
        'hard-constant'     : songs[0].indexOf('@hard-constant'),
        'hard-newer'        : songs[0].indexOf('@hard-newer'),
        'expert-level'      : songs[0].indexOf('@expert-level'),
        'expert-constant'   : songs[0].indexOf('@expert-constant'),
        'expert-newer'      : songs[0].indexOf('@expert-newer'),
        'inferno-level'     : songs[0].indexOf('@inferno-level'),
        'inferno-constant'  : songs[0].indexOf('@inferno-constant'),
        'inferno-newer'     : songs[0].indexOf('@inferno-newer')
    };
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return Number(song[indexes['normal-constant']]).toFixed(1);
            }

            if (song[indexes['hard-level']] == diffValue) {
                return Number(song[indexes['hard-constant']]).toFixed(1);
            }

            if (song[indexes['expert-level']] == diffValue) {
                return Number(song[indexes['expert-constant']]).toFixed(1);
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return Number(song[indexes['inferno-constant']]).toFixed(1);
            }
        }
    }
}

// Get the genre from the song title.
function getGenre(songTitle) {
    const songs = getChartTable();
    const indexes = {
        'title' : songs[0].indexOf('@song-title'),
        'genre' : songs[0].indexOf('@genre-name')
    };
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        if (song[indexes['title']] == songTitle) {
            return song[indexes['genre']];
        }
    }
}

// Get the song title in English from the original song title.
function getEnglishTitle(songTitle) {
    const songs = getChartTable();
    const indexes = {
        'title' : songs[0].indexOf('@song-title'),
        'title-english' : songs[0].indexOf('@song-title-english')
    };
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        if (song[indexes['title']] == songTitle) {
            return song[indexes['title-english']];
        }
    }
}

// Get the class based on the genre.
function getGenreClass(genre) {
    const classes = {
        'ANIME/POP'         : 'bg-anime',
        'VOCALOID'          : 'bg-vocaloid',
        'TOUHOU ARRANGE'    : 'bg-touhou',
        'ANIME MUSICAL'     : 'bg-musical',
        'VARIETY'           : 'bg-variety',
        'ORIGINAL'          : 'bg-original',
        'HARDCORE TANO*C'   : 'bg-tanoc'
    };

    return classes[genre];
}

// Get the element based on the genre.
function getGenreElement(genre) {
    const classes = {
        'ANIME/POP'         : '<span class="lang-jpn">アニメ/POP</span><span class="lang-eng d-none">ANIME/POP</span>',
        'VOCALOID'          : '<span class="lang-jpn">ボーカロイド</span><span class="lang-eng d-none">VOCALOID</span>',
        'TOUHOU ARRANGE'    : '<span class="lang-jpn">東方アレンジ</span><span class="lang-eng d-none">TOUHOU ARRANGE</span>',
        'ANIME MUSICAL'     : '<span class="lang-jpn">2.5次元</span><span class="lang-eng d-none">ANIME MUSICAL</span>',
        'VARIETY'           : '<span class="lang-jpn">バラエティ</span><span class="lang-eng d-none">VARIETY</span>',
        'ORIGINAL'          : '<span class="lang-jpn">オリジナル</span><span class="lang-eng d-none">ORIGINAL</span>',
        'HARDCORE TANO*C'   : '<span class="lang-jpn">HARDCORE TANO*C</span><span class="lang-eng d-none">HARDCORE TANO*C</span>'
    };

    return classes[genre];
}

// Quit the Multi Select Mode.
function quitMultiSelectMode(listtype) {
    if (listtype.match(/new|old/) == null) {
        return false;
    }

    const tables = document.querySelectorAll('.scoresTable');
    const tableIndex = listtype == 'new' ? 0 : 1;

    document.querySelector(`#multi-rate-alert-${listtype}`).classList.add('d-none');
    tables[tableIndex].querySelectorAll('.multi-rate-selected').forEach(td => td.classList.remove('multi-rate-selected'));
    tables[tableIndex].querySelectorAll('.table-custom-dethrone').forEach(td => td.classList.remove('table-custom-dethrone'));
}

// Start the Multi Select Mode.
function startMultiSelectMode(element, listtype) {
    if (element.tagName != 'A') {
        return false;
    }

    if (listtype.match(/new|old/) == null) {
        return false;
    }

    const rateAlert = document.querySelector(`#multi-rate-alert-${listtype}`);
    rateAlert.classList.remove('d-none');

    element.classList.toggle('multi-rate-selected');

    const tables = document.querySelectorAll('.scoresTable');
    const tableIndex = listtype == 'new' ? 0 : 1;

    const topSingleRates = tables[tableIndex].querySelectorAll('td.top-single-rate');
    let topSinleRatesArr = Array.from(topSingleRates).map(td => Number(td.innerHTML)).sort((a, b) => b - a);

    const selectedRates = tables[tableIndex].querySelectorAll('a.multi-rate-selected');
    const selectedRatesArr = Array.from(selectedRates).map(td => Number(td.dataset.rating)).sort((a, b) => b - a);

    const replaceRatesArr = Array.from(selectedRates).map(td => Number(td.dataset.now)).sort((a, b) => b - a);
    const oldListTotal = topSinleRatesArr.reduce((a, b) => a + b, 0);

    replaceRatesArr.forEach(value => {
        const arrIndex = topSinleRatesArr.indexOf(value);

        if (arrIndex != -1) {
            topSinleRatesArr.splice(arrIndex, 1);
        }
    });

    const newList = [...topSinleRatesArr, ...selectedRatesArr].sort((a, b) => b - a).splice(0, topSingleRates.length);
    const newListTotal = newList.reduce((a, b) => a + b, 0);
    const rateIncsease = newListTotal - oldListTotal;
    const alreadyListed = tables[tableIndex].querySelectorAll('.table-primary .multi-rate-selected');

    rateAlert.querySelector('.before').innerHTML = oldListTotal.toFixed(3);
    rateAlert.querySelector('.after').innerHTML = newListTotal.toFixed(3);
    rateAlert.querySelector('.increase').innerHTML = rateIncsease.toFixed(3);

    tables[tableIndex].querySelectorAll('.table-custom-dethrone').forEach(td => td.classList.remove('table-custom-dethrone'));

    selectedRatesArr.forEach((_value, index) => {
        const fixedIndex = topSingleRates.length + alreadyListed.length - index - 1;
        const checkRow = tables[tableIndex].querySelectorAll('tr')[fixedIndex];
        
        if ((checkRow.querySelectorAll('.multi-rate-selected').length == 0) && (fixedIndex <= topSingleRates.length - 1)) {
            checkRow.classList.add('table-custom-dethrone');
        }
    });
}

// Generate a dataset table.
function generateDatasetTable() {
    const trueIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>`.replaceAll(/(^ {8}|^\n)/gm, '');
    const falseIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
        </svg>`.replaceAll(/(^ {8}|^\n)/gm, '');

    const tbody = document.querySelector('#chart-dataset');
    tbody.innerHTML = '';

    const songs = getChartTable();
    const indexes = {
        'title'             : songs[0].indexOf('@song-title'),
        'title-english'     : songs[0].indexOf('@song-title-english'),
        'genre'             : songs[0].indexOf('@genre-name'),
        'normal-level'      : songs[0].indexOf('@normal-level'),
        'normal-constant'   : songs[0].indexOf('@normal-constant'),
        'normal-newer'      : songs[0].indexOf('@normal-newer'),
        'hard-level'        : songs[0].indexOf('@hard-level'),
        'hard-constant'     : songs[0].indexOf('@hard-constant'),
        'hard-newer'        : songs[0].indexOf('@hard-newer'),
        'expert-level'      : songs[0].indexOf('@expert-level'),
        'expert-constant'   : songs[0].indexOf('@expert-constant'),
        'expert-newer'      : songs[0].indexOf('@expert-newer'),
        'inferno-level'     : songs[0].indexOf('@inferno-level'),
        'inferno-constant'  : songs[0].indexOf('@inferno-constant'),
        'inferno-newer'     : songs[0].indexOf('@inferno-newer')
    };
    const difficulties = ['normal', 'hard', 'expert', 'inferno'];

    let rowIndex = 0;
    const tableContent = songs.map((song, index) => {
        if (index === 0) {
            return '';
        }

        return difficulties.filter(difficulty => {
            if (song[indexes[`${difficulty}-level`]].match(/[0-9+]+/g) === '0') {
                return false
            }

            if (Number(song[indexes[`${difficulty}-constant`]]).toFixed(1) === 0.0) {
                return false
            }

            if (song[indexes[`${difficulty}-newer`]] === undefined) {
                return false
            }

            return true;
        })
        .map(difficulty => {
            rowIndex++;

            return `
                <tr 
                    class="text-nowrap" 
                    data-fulltext="${song[indexes['title']].toLowerCase()} ${song[indexes['title-english']].toLowerCase()} 
                    difficulty:${difficulty} 
                    difficulty:${difficulty[0]} 
                    level:${song[indexes[`${difficulty}-level`]].match(/[0-9+]+/g)} 
                    constant:${Number(song[indexes[`${difficulty}-constant`]]).toFixed(1)} 
                    newer:${song[indexes[`${difficulty}-newer`]]} 
                    newer:${String(song[indexes[`${difficulty}-newer`]])[0]} "
                >
                    <td>${rowIndex}</td>
                    <td class="text-wrap">${song[indexes['title']]}</td>
                    <td><div class="badge border ${difficulty} w-100">${song[indexes[`${difficulty}-level`]]}</div></td>
                    <td>${Number(song[indexes[`${difficulty}-constant`]]).toFixed(1)}</td>
                    <td>${song[indexes[`${difficulty}-newer`]] ? trueIcon : falseIcon}</td>
                </tr>`
        })
        .join('\n')
        .replaceAll(/(^ {16}|^\n)/gm, '');
    }).join('\n');

    tbody.innerHTML = tableContent;
}

// Apply a filter to the dataset table.
function filterDatasetTable(value) {
    document.querySelectorAll('.filter-option-tooltip').forEach(e => e.classList.add('d-none'));

    const searchValue = String(value).replaceAll('　',' ').toLowerCase();
    const trows = document.querySelectorAll('#chart-dataset > tr');
    trows.forEach(row => {
        if (row.classList.contains('d-none')) {
            row.classList.remove('d-none');
        }
    });

    if (searchValue === '') {
        return false;
    }

    trows.forEach(row => {
        searchValue.split(' ').forEach(key => {
            if (key.indexOf(':') === -1) {
                if (row.dataset.fulltext.indexOf(key) === -1) {
                    row.classList.add('d-none');
                }
            } else {
                if (row.dataset.fulltext.indexOf(`${key} `) === -1) {
                    row.classList.add('d-none');
                }
            }
        })
    });
}

function addFilterOption(option) {
    const input = document.querySelector('#dataset-filter-input');
    input.value = `${input.value} ${option}`;
    document.querySelectorAll('.filter-option-tooltip').forEach(e => e.classList.add('d-none'));
    document.querySelector(`#filter-option-tooltip-${option.match(/[a-z]+/g)[0]}`).classList.remove('d-none');
    input.focus();
}

function clearFilterInput() {
    const input = document.querySelector('#dataset-filter-input');
    input.value = '';
    input.focus();
    filterDatasetTable(input.value);
}

// Save analysis results as CSV.
function saveTableData() {
    const dataTableRow = document.querySelectorAll('tr[data-index]');
    const headerTextJpn = '"種別","#","曲名","レベル","スコア","定数","補正","現在","上限","950k","960k","970k","980k","990k"\n';
    const headerTextEng = '"Type","#","Song Title","Level","Score","Constant","Modifier","Now","Max","950k","960k","970k","980k","990k"\n';
    let dataTableText = (document.querySelectorAll('.lang-jpn.d-none').length == 0) ? headerTextJpn : headerTextEng;

    dataTableRow.forEach((tr, index) => {
        if (index > 0) dataTableText += '\n';
        dataTableText += tr.dataset.fileRow;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, dataTableText], {'type' : 'text/csv'});
    const date = new Date();
    const filename = [
        'wacca-',
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2),
        '-',
        ('0' + date.getHours()).slice(-2),
        ('0' + date.getMinutes()).slice(-2),
        ('0' + date.getSeconds()).slice(-2),
    ].join('');

    let downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.dataset.downloadurl = ['text/plain', downloadLink.download, downloadLink.href].join(':');
    downloadLink.click();
}

// Change the display language to Japanese.
function switchToJapanese() {
    document.querySelectorAll('.lang-eng').forEach(e => {
        if (!e.classList.contains('d-none')){
            e.classList.add('d-none');
        }
    });

    document.querySelectorAll('.lang-jpn').forEach(e => {
        if (e.classList.contains('d-none')){
            e.classList.remove('d-none');
        }
    });

    document.querySelectorAll('.opt-lang-jpn').forEach(e => {
        e.checked = true;
    });

    localStorage.setItem('rating-analyzer-lang', 'japanese');
}

// Change the display language to English.
function switchToEnglish() {
    document.querySelectorAll('.lang-jpn').forEach(e => {
        if (!e.classList.contains('d-none')){
            e.classList.add('d-none');
        }
    });

    document.querySelectorAll('.lang-eng').forEach(e => {
        if (e.classList.contains('d-none')){
            e.classList.remove('d-none');
        }
    });

    document.querySelectorAll('.opt-lang-eng').forEach(e => {
        e.checked = true;
    });

    localStorage.setItem('rating-analyzer-lang', 'english');
}

// Export the contents of LocalStorage.
function showLocalStorageContent() {
    const output = document.querySelector('#output-localstorage');
    const storage = localStorage;
    output.innerHTML = '';

    for (let index = 0; index < storage.length; index++) {
        const row = document.createElement('tr');
        const key = storage.key(index);
        const value = storage.getItem(key).replaceAll(/\n/gm, '<br>');

        if (key !== 'rating-analyzer-prev') {
            row.innerHTML = `
                <td>${index}</td>
                <td>${key}</td>
                <td>${value}</td>`
            .replaceAll(/(^ {12}|^\n)/gm, '');
        } else {
            row.innerHTML = `
                <td>${index}</td>
                <td>${key}</td>
                <td>
                    <div class="table-responsive border m-1 p-1" style="max-height: 50vh;">
                        ${value}
                    </div>
                </td>`
            .replaceAll(/(^ {12}|^\n)/gm, '');
        }
        
        output.appendChild(row);
    }
}

// Delete the contents of LocalStorage.
function clearLocalStorageContent() {
    localStorage.clear();
    document.querySelector('#btn-modal-data-erase-done').click();
}


// Switch Loading View.
function switchLoadingView(isEnabled = true) {
    const loadingContainer = document.querySelector('#container-loading');
    const mainContainer = document.querySelector('#container-main');

    if (isEnabled) {
        loadingContainer.classList.remove('d-none');
        mainContainer.classList.add('d-none');
    } else {
        loadingContainer.classList.add('d-none');
        mainContainer.classList.remove('d-none');
    }
}

// Set news as read.
function markAsRead() {
    localStorage.setItem('rating-analyzer-last-visited', getLastUpdate());
    document.querySelector('#news').classList.add('border-start-0');
    document.querySelector('#news-badge').classList.add('d-none');
}