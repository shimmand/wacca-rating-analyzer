/**
 * Initialize with user settings
 * @returns 
 */
function initialize() {
    try {
        const datasetParam = document.querySelector('html').dataset.dataset
        const xhr = new XMLHttpRequest()

        xhr.open('get', `https://shimmand.github.io/wacca-rating-analyzer/assets/dataset.csv?date=${datasetParam}`, true)
        xhr.send(null)

        xhr.onload = () => {
            const response = xhr.responseText
            const datasetArr = response.replaceAll(/([^,])""([^,])/gm, '$1\\\"$2').split('\n').filter(line => line.length > 0).map(line => `[${line}]`)
            const scriptCode = `
                function getChartTable() {
                    return [
                        ${datasetArr.join(',\n')}
                    ]
                }`.replaceAll(/(^ {16}|^\n)/gm, '')
            const newScriptElm = document.createElement('script')

            newScriptElm.innerHTML = scriptCode
            document.body.appendChild(newScriptElm)

            // Generate a dataset table
            generateDatasetTable()

            document.querySelector('.input-player-name').value = localStorage.getItem('rating-analyzer-player-name')

            {
                const badge = document.querySelector('.dataset-version-value')
                badge.innerHTML = datasetParam.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g)[0]
            }

            // Restore the language settings
            switch (localStorage.getItem('rating-analyzer-lang')) {
                case 'japanese':
                    setLanguage('japanese')
                    break

                case 'english':
                    setLanguage('english')
                    break

                default:
                    setLanguage('japanese')
                    break
            }

            {
                const toggles = document.querySelectorAll('#large-table-toggle')

                switch (localStorage.getItem('rating-analyzer-large-table')) {
                    case 'true':
                        toggles.forEach(input => input.checked = true)
                        switchLargeTable(true)
                        break

                    case 'false':
                        toggles.forEach(input => input.checked = false)
                        switchLargeTable(false)
                        break

                    default:
                        break
                }
            }

            // Restore the display state of English song titles
            {
                const toggles = document.querySelectorAll('#alt-title-toggle')

                switch (localStorage.getItem('rating-analyzer-alt-title')) {
                    case 'true':
                        toggles.forEach(input => input.checked = true)
                        toggleDisplayState('alt-title', true)
                        break

                    case 'false':
                        toggles.forEach(input => input.checked = false)
                        toggleDisplayState('alt-title', false)
                        break

                    default:
                        break
                }
            }

            // Restore the selected state of the type filter
            {
                const types = ['targets', 'candidates', 'others']

                types.forEach(type => {
                    const toggles = document.querySelectorAll(`.rating-${type}-toggle`)

                    switch (localStorage.getItem(`rating-analyzer-filter-type-${type}`)) {
                        case 'true':
                            toggles.forEach(input => input.checked = true)
                            break

                        case 'false':
                            toggles.forEach(input => input.checked = false)
                            break

                        default:
                            break
                    }
                })
            }

            // Restore the selected state of the difficulty filter
            {
                const difficulties = ['normal', 'hard', 'expert', 'inferno']

                difficulties.forEach(difficulty => {
                    const toggles = document.querySelectorAll(`.difficulty-${difficulty}-toggle`)

                    switch (localStorage.getItem(`rating-analyzer-filter-difficulty-${difficulty}`)) {
                        case 'true':
                            toggles.forEach(input => input.checked = true)
                            break

                        case 'false':
                            toggles.forEach(input => input.checked = false)
                            break

                        default:
                            break
                    }
                })
            }

            // Restore the page display scale
            {
                const scale = document.querySelector('#select-disp-scale')
                scale.value = localStorage.getItem('rating-analyzer-display-scale') || '100'
                changeDisplayScale()
            }

            // Restore the selected state of charts entry
            {
                switch (localStorage.getItem('rating-analyzer-charts-entry')) {
                    case 'newer':
                        switchChartsEntry('newer')
                        break

                    case 'older':
                        switchChartsEntry('older')
                        break

                    default:
                        switchChartsEntry('newer')
                        break
                }
            }

            // Remove the badge if the latest news has been read
            switch (localStorage.getItem('rating-analyzer-last-visited')) {
                case getLastUpdate():
                    break

                default:
                    document.querySelector('#news').classList.remove('border-start-0')
                    setDisplayNone('#news-badge', false)
                    break
            }

            // Run the analyze function if the program is in restore mode.
            switch (localStorage.getItem('rating-analyzer-analyze-mode')) {
                case 'true':
                    startAnalyze()
                    break

                case 'false':
                    restorePrevData()
                    break
            
                default:
                    findMissingItems()
                    analyze()
                    document.querySelector('[data-bs-target="#modal-introduction"]').click()
                    break
            }

            /* // Run the restore function if the program is in restore mode.
            switch (localStorage.getItem('rating-analyzer-restore-mode')) {
                case 'true':
                    restorePrevData()
                    break

                case 'false':
                    break

                default:
                    break
            } */

            if (document.querySelector('tr.chart-list--item')) {
                restoreCheckList()
                applyCheckList()
            }

            switch (localStorage.getItem('rating-analyzer-check-list-visible')) {
                case 'true':
                    toggleCheckListVisibility(true)
                    break

                case 'false':
                    toggleCheckListVisibility(false)
                    break

                default:
                    toggleCheckListVisibility(false)
                    break
            }

            switchLoadingView(false)
        }

    } catch (error) {
        switchLoadingView(false)
        return
    }
}


function getLastUpdate() {
    return document.querySelector('html').dataset.update
}

/**
 * Paste the clipboard contents into the textarea
 */
function paste() {
    const playdata = document.querySelector('#playdata')
    playdata.classList.remove('is-invalid')
    setDisplayNone('.error-feedback-1', true)
    playdata.focus()

    {
        const promise = navigator.clipboard.readText()

        promise.then(clipText => {
            playdata.value = clipText
            activateAnalyzeMode()
        }, _reason => {
            playdata.value = ''
            document.querySelector('#btn-analyze').disabled = false
            showDeniedWarning()
        })
    }
}

/**
 * Display a message when access to the clipboard is denied
 */
function showDeniedWarning() {
    document.querySelector('#playdata').classList.add('is-invalid')
    setDisplayNone('.error-feedback-1, .valid-feedback', true)
    setDisplayNone('#warning-denied', false)
}

/**
 * Analyze play results based on text in the text area.
 * @returns 
 */
function analyze(){
    const playdata = document.querySelector('#playdata')
    let charts = playdata.value.split('\n')

    if (playdata.value.length === 0) {
        playdata.classList.add('is-invalid')
        setDisplayNone('.error-feedback-1', true)
        setDisplayNone('#warning-empty', false)
        return

    } else {
        const searchPattern = /[^,]+,(NORMAL|HARD|EXPERT|INFERNO) [0-9]{1,2}\+?,[0-9]{1,7}/g
        const testResult = charts.map(chart => chart.match(searchPattern) == chart)
        
        if (!testResult.indexOf(false)) {
            playdata.classList.add('is-invalid')
            setDisplayNone('.error-feedback-1', true)
            setDisplayNone('#warning-invalid', false)
            return
        }
    }

    const scoresTables = document.querySelectorAll('.scoresTable')

    scoresTables.forEach(table => table.innerHTML = '')
    playdata.classList.remove('is-invalid')

    findMissingItems()
    charts = playdata.value.split('\n')

    let chartsListNew = []
    let chartsListOld = []

    charts.forEach(chart => {

        // [0: song-title, 1: chart-level, 2: score]
        const data = chart.split(',')

        // Restore escaped commas here when getting scores.
        const title = data[0].replace('__', ',')

        const level = data[1]
        const score = data[2]

        const rating = getChartConstants(title, level)

        if ((level !== 'INFERNO 0') && (rating !== null)) {
            const pattern = /(NORMAL|HARD|EXPERT|INFERNO)/g

            if (!level.match(pattern)[0]) {
                return
            }

            const difficulty = level.match(pattern)[0].toLowerCase()
            const multipliers = getMultiplierTable()

            let multiplier = 0

            for (let i = 0; i < multipliers.length; i++) {
                if (multiplier === 0) {
                    if (multipliers[i][0] <= Number(score)) {
                        multiplier = multipliers[i][1]
                    }
                }
            }

            const maxBadgeCode = '<div class="badge badge-max border bg-secondary">MAX</div>'
            const adjustedRating = (multiplier * rating).toFixed(3)
            const upperRating = (multiplier < 4 ? (4 * rating).toFixed(3) : maxBadgeCode)
            const chartData = [title, difficulty, level, score, rating, multiplier, adjustedRating, upperRating]

            if (isThisChartNewer(title, level)) {
                chartsListNew.push(chartData)
            } else {
                chartsListOld.push(chartData)
            }
        }
    })

    chartsListNew.sort(function (a, b) { return (b[6] - a[6])} )
    chartsListOld.sort(function (a, b) { return (b[6] - a[6])} )

    const chartsLists = [chartsListNew, chartsListOld]

    let varSingleRateLowers = [0, 0]
    let varSummedRateCurrents = [0, 0]
    let varSummedRateUppers = [0, 0]

    // Border by class
    // [(*)0: plain, (*)1: navy, (*)2: yellow, (*)3: red, (*)4: purple, (*)5: blue, (*)6: silver, (*)7: gold, 8: rainbow]
    let varClassRanges = [300, 300, 400, 300, 300, 300, 300, 300, 0]

    chartsLists.forEach((chartsList, listIndex) => {
        const targetsLength = [15, 35]

        // Modifier values based on score
        // [0: 950k, 1: 960k, 2: 970k, 3: 980k, 4: 990k]
        const targetMultipliers = [3.00, 3.25, 3.50, 3.75, 4.00]
        const scoreBorders = [950000, 960000, 970000, 980000, 990000]

        // Calculate the maximum rating
        // slice: Duplicate the chart list
        // sort: Sort in descending order by chart constant
        // slice: Filter by number of rating targets
        // reduce: Total the chart constants multiplied by 4
        varSummedRateUppers[listIndex] =
        chartsList
            .slice()
            .sort(function(a, b){return (b[4] - a[4])})
            .slice(0, targetsLength[listIndex])
            .reduce((sum, e) => sum + Number(e[4]), 0) * 4

        // Array for graphs
        // [0: <950k, 1: 950k, 2: 960k, 3: 970k, 4: 980k, 5: 990k]
        let stats = [0, 0, 0, 0, 0, 0]

        chartsList.forEach((chart, index) => {
            const tempRow = document.createElement('tr')
            const tableRow = scoresTables[listIndex].appendChild(tempRow)
            
            tableRow.classList.add('chart-list--item')

            if (index < targetsLength[listIndex]) {
                tableRow.classList.add('table-targets', 'top-single-rate')
                varSingleRateLowers[listIndex] = Number(chart[6])
                varSummedRateCurrents[listIndex] += Number(chart[6])
            }

            tableRow.classList.add(`difficulty-${chart[1]}`)

            const increases = targetMultipliers.map((multiplier, buttonIndex) => {
                const targetsName = ['new', 'old']

                if ((chart[5] < multiplier) && ((chart[4] * multiplier) > varSingleRateLowers[listIndex])) {
                    return `
                        <a class="badge rate-increase rounded-0 box-shadow-black" 
                        href="#" onclick="modifyCheckListItem(this); return false;" 
                        data-rating="${(chart[4] * multiplier).toFixed(3)}" data-now="${chart[6]}" 
                        data-query="${chart[0].replaceAll(/\'|\"|\(|\)/g, '_')} ${chart[1]} ${buttonIndex}" 
                        data-query-class="${chart[0].replaceAll(/\'|\"|\(|\)/g, '_')} ${chart[1]}"
                        data-list-index="${listIndex}" data-index="${index + 1}" data-button-index="${buttonIndex}">
                        <span class="rate-counter">+${((chart[4] * multiplier) - varSingleRateLowers[listIndex]).toFixed(3)}</span>
                        </a>
                        `.replaceAll(/(^ {24}|^\n)/gm, '').replaceAll('\n', '')
                } else {
                    return '-'
                }
            })

            const increasesForFileRow = increases.map(data => {
                if (data != '-'){
                    return data.match(/\+[0-9]{1,2}\.[0-9]{3}/)
                } else {
                    return '-'
                }
            })

            if (increases.filter(e => (e === '-')).length === increases.length) {
                tableRow.classList.add('all-clear')
            } else {
                tableRow.classList.add('table-candidates')
            }

            if (tableRow.classList.contains('table-targets') || tableRow.classList.contains('table-candidates')) {
                const multipliers = [targetMultipliers[0], ...targetMultipliers]

                multipliers.forEach((multiplier, index) => {
                    if (index === 0) {
                        if (chart[5] < multiplier) {
                            stats[index]++
                        }
                    } else {
                        if (chart[5] === multiplier) {
                            stats[index]++
                        }
                    }
                })
            }

            tableRow.classList.add('border-3', 'border-top-0', 'border-end-0', 'border-start-0')

            const code = `
            <td>
                <div class="list-item--small row d-xl-none d-xxl-none">
                    <div class="list-item--index-wrapper col-2 d-flex">
                        <div class="list-item--index fs-3 lh-sm">${index + 1}</div>
                    </div>
                    <div class="list-item--content-wrapper col-10">
                        <div class="list-item--top-wrapper p-0">
                            <div class="list-item--song-wrapper">
                                <div class="list-item--title-wrapper">
                                    <div class="list-item--alt-title text-dimmed small">${getEnglishTitle(chart[0])}</div>
                                    <div class="list-item--title fw-bold mb-1">${chart[0]}</div>
                                </div>
                            </div>
                            <div class="list-item--badge-wrapper">
                                <div class="list-item--badge-stack d-flex">
                                    <div class="list-item--badge-difficulty badge border m-0 ${chart[1]} ${chart[2] === 'INFERNO 15' ? 'inferno-15' : ''}">${chart[2]}</div>
                                    <div class="list-item--badge-genre border-start ms-2 ps-2 small text-nowrap text-truncate">${getGenreElement(getGenre(chart[0]))}</div>
                                </div>
                            </div>
                        </div>
                        <div class="list-item--middle-wrapper d-flex row m-0 mt-1">
                            <div class="list-item--score-wrapper hover-trans-opacity cursor-pointer col p-0" data-list-index="${listIndex}" data-index="${index + 1}" onclick="modifyScoreModalLauncher(this); return false;">
                                <div class="list-item--score-label d-flex align-items-center text-dimmed small">
                                    <div class="d-flex ms-0">
                                        <span class="lang lang-japanese">スコア</span>
                                        <span class="lang lang-english d-none">Score</span>
                                    </div>
                                    <div class="d-flex ms-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil-fill bi-badge" viewBox="0 0 16 16">
                                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="list-item--score">${chart[3]}</div>
                            </div>
                            <div class="list-item--constant-wrapper col p-0">
                                <div class="list-item--score-label text-dimmed small">
                                    <span class="lang lang-japanese">定数</span>
                                    <span class="lang lang-english d-none">Constant</span>
                                </div>
                                <div class="list-item--constant">${chart[4]}</div>
                            </div>
                            <div class="list-item--modifier-wrapper col p-0">
                                <div class="list-item--score-label text-dimmed small">
                                    <span class="lang lang-japanese">係数</span>
                                    <span class="lang lang-english d-none">Modifier</span>
                                </div>
                                <div class="list-item--modifier">${chart[5].toFixed(2)}</div>
                            </div>
                            <div class="list-item--rating-now-wrapper col p-0">
                                <div class="list-item--score-label text-dimmed small">
                                    <span class="lang lang-japanese">レート</span>
                                    <span class="lang lang-english d-none">Rating</span>
                                </div>
                                <div class="list-item--rating-now">${chart[6]}</div>
                            </div>
                            <div class="list-item--rating-max-wrapper col p-0 d-xxs-none d-xs-none">
                                <div class="list-item--score-label text-dimmed small">
                                    <span class="lang lang-japanese">上限</span>
                                    <span class="lang lang-english d-none">Max</span>
                                </div>
                                <div class="list-item--rating-max">${chart[7]}</div>
                            </div>
                        </div>
                        <div class="list-item--graph-wrapper m-0 mt-1 px-1">
                            <div class="progress rounded-0" style="height: 0.25rem;">
                                <div class="progress-bar bg-lt-950${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 940000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="940000" aria-valuemax="950000"></div>
                                <div class="progress-bar bg-is-950${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 950000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="950000" aria-valuemax="960000"></div>
                                <div class="progress-bar bg-is-960${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 960000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="960000" aria-valuemax="970000"></div>
                                <div class="progress-bar bg-is-970${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 970000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="970000" aria-valuemax="980000"></div>
                                <div class="progress-bar bg-is-980${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 980000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="980000" aria-valuemax="990000"></div>
                            </div>
                        </div>
                        <div class="list-item--bottom-wrapper row bg-black bg-opacity-25 m-0 mt-1 px-1">
                            <div class="col p-0">
                                <div class="list-item--increase-label text-dimmed small">950k</div>
                                <div class="list-item--increase" data-parent="list-item--small" data-index="${index + 1}">${increases[0]}</div>
                                <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[0] - chart[3]}">${(increases[0] !== '-') ? scoreBorders[0] - chart[3] : ''}</div>
                            </div>
                            <div class="col p-0">
                                <div class="list-item--increase-label text-dimmed small">960k</div>
                                <div class="list-item--increase" data-parent="list-item--small" data-index="${index + 1}">${increases[1]}</div>
                                <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[1] - chart[3]}">${(increases[1] !== '-') ? scoreBorders[1] - chart[3] : ''}</div>
                            </div>
                            <div class="col p-0">
                                <div class="list-item--increase-label text-dimmed small">970k</div>
                                <div class="list-item--increase" data-parent="list-item--small" data-index="${index + 1}">${increases[2]}</div>
                                <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[2] - chart[3]}">${(increases[2] !== '-') ? scoreBorders[2] - chart[3] : ''}</div>
                            </div>
                            <div class="col p-0">
                                <div class="list-item--increase-label text-dimmed small">980k</div>
                                <div class="list-item--increase" data-parent="list-item--small" data-index="${index + 1}">${increases[3]}</div>
                                <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[3] - chart[3]}">${(increases[3] !== '-') ? scoreBorders[3] - chart[3] : ''}</div>
                            </div>
                            <div class="col p-0">
                                <div class="list-item--increase-label text-dimmed small">990k</div>
                                <div class="list-item--increase" data-parent="list-item--small" data-index="${index + 1}">${increases[4]}</div>
                                <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[4] - chart[3]}">${(increases[4] !== '-') ? scoreBorders[4] - chart[3] : ''}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="list-item--large row d-none d-xl-flex d-xxl-flex${(index < targetsLength[listIndex]) ? ' bg-target-striped' : ''}">
                    <div class="list-item--index-wrapper col-1 d-flex">
                        <div class="list-item--index fs-3 lh-sm">${index + 1}</div>
                    </div>
                    <div class="list-item--content-wrapper col-11 row mb-1">
                        <div class="list-item--heading-wrapper col row sticky-column">
                            <div class="list-item--song-wrapper p-0">
                                <div class="list-item--title-wrapper">
                                    <div class="list-item--alt-title text-dimmed small">${getEnglishTitle(chart[0])}</div>
                                    <div class="list-item--title fw-bold mb-1">${chart[0]}</div>
                                </div>
                                <div class="list-item--badge-wrapper d-flex">
                                    <div class="list-item--badge-difficulty badge border m-0 ${chart[1]} ${chart[2] === 'INFERNO 15' ? 'inferno-15' : ''}">${chart[2]}</div>
                                    <div class="list-item--badge-genre border-start ms-2 ps-2 small text-nowrap text-truncate">${getGenreElement(getGenre(chart[0]))}</div>
                                </div>
                            </div>
                        </div>
                        <div class="list-item--main-wrapper col">
                            <div class="list-item--result-wrapper row m-0">
                                <div class="list-item--score-wrapper hover-trans-opacity cursor-pointer col px-0" data-list-index="${listIndex}" data-index="${index + 1}" onclick="modifyScoreModalLauncher(this); return false;">
                                    <div class="list-item--score">${chart[3]}</div>
                                    <div class="d-flex align-items-center text-dimmed small">
                                        <div class="d-flex ms-0">
                                            <span class="lang lang-japanese">編集</span>
                                            <span class="lang lang-english d-none">Edit</span>
                                        </div>
                                        <div class="d-flex ms-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil-fill bi-badge" viewBox="0 0 16 16">
                                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="list-item--constant-wrapper col d-flex justify-content-between px-0">
                                    <div class="list-item--constant">${chart[4]}</div>
                                    <div class="list-item--constant-label text-dimmed w-100 text-center mx-2">&times;</div>
                                </div>
                                <div class="list-item--modifier-wrapper col d-flex justify-content-between px-0">
                                    <div class="list-item--modifier">${chart[5].toFixed(2)}</div>
                                    <div class="list-item--modifier-label text-dimmed w-100 text-center mx-2">=</div>
                                </div>
                                <div class="list-item--rating-wrapper col d-flex justify-content-between px-0">
                                    <div class="list-item--rating-now">${chart[6]}</div>
                                    <div class="list-item--rating-max-label text-dimmed w-100 text-center mx-2">/</div>
                                </div>
                                <div class="list-item--rating-max-wrapper col d-flex px-0">
                                    <div class="list-item--rating-max text-dimmed">${chart[7]}</div>
                                </div>
                            </div>
                        </div>
                        <div class="list-item--sub-wrapper col">
                            <div class="list-item--increase-wrapper row">
                                <div class="col px-0">
                                    <div class="list-item--increase" data-parent="list-item--large" data-index="${index + 1}">${increases[0]}</div>
                                    <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[0] - chart[3]}">${(increases[0] !== '-') ? scoreBorders[0] - chart[3] : ''}</div>
                                </div>
                                <div class="col px-0">
                                    <div class="list-item--increase" data-parent="list-item--large" data-index="${index + 1}">${increases[1]}</div>
                                    <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[1] - chart[3]}">${(increases[1] !== '-') ? scoreBorders[1] - chart[3] : ''}</div>
                                </div>
                                <div class="col px-0">
                                    <div class="list-item--increase" data-parent="list-item--large" data-index="${index + 1}">${increases[2]}</div>
                                    <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[2] - chart[3]}">${(increases[2] !== '-') ? scoreBorders[2] - chart[3] : ''}</div>
                                </div>
                                <div class="col px-0">
                                    <div class="list-item--increase" data-parent="list-item--large" data-index="${index + 1}">${increases[3]}</div>
                                    <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[3] - chart[3]}">${(increases[3] !== '-') ? scoreBorders[3] - chart[3] : ''}</div>
                                </div>
                                <div class="col px-0">
                                    <div class="list-item--increase" data-parent="list-item--large" data-index="${index + 1}">${increases[4]}</div>
                                    <div class="list-item--remaining-score text-dimmed small" data-remaining="${scoreBorders[4] - chart[3]}">${(increases[4] !== '-') ? scoreBorders[4] - chart[3] : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>`
            .replaceAll(/(^ {12}|^\n)/gm, '')

            tableRow.innerHTML = code
            tableRow.setAttribute('data-list-index', listIndex)
            tableRow.setAttribute('data-index', index + 1)
            tableRow.setAttribute('data-const', chart[4])
            tableRow.setAttribute('data-rate', chart[6])
            tableRow.setAttribute('data-remaining-min', '')

            const chartType = (listIndex == 0) ? 'Newer' : 'Older'
            const maxRate = Number(4 * chart[4]).toFixed(3)
            const fileRow = `
                    "${chartType}","${index + 1}","${chart[0]}","${chart[2]}","${chart[3]}",
                    "${chart[4]}","${chart[5].toFixed(2)}","${chart[6]}","${maxRate}",
                    "${increasesForFileRow[0]}","${increasesForFileRow[1]}",
                    "${increasesForFileRow[2]}","${increasesForFileRow[3]}",
                    "${increasesForFileRow[4]}"`
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '')

            tableRow.setAttribute('data-file-row', fileRow)

            {
                const imageData = `
                    ${listIndex},${String(chart[0]).replaceAll(',', '__')},${String(chart[2]).toUpperCase()},${chart[3]},
                    ${chart[4]},${chart[5].toFixed(2)},${chart[6]}`
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '')

                tableRow.setAttribute('data-image-data', imageData)
            }

            {
                const searchText = `
                    ${String(chart[0]).toLowerCase()} 
                    ${String(getEnglishTitle(chart[0])).toLowerCase()} 
                    difficulty:${chart[1]} difficulty:${String(chart[1])[0]} 
                    level:${String(chart[2]).match(/[0-9+]+/g)[0]} 
                    score:${chart[3]} 
                    constant:${chart[4]} 
                    rating:${chart[6]} `
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '')
                
                tableRow.setAttribute('data-search-text', searchText)
            }

            {
                const date = new Date()
                const dateValue = [
                    date.getFullYear(),
                    '-',
                    ('0' + (date.getMonth() + 1)).slice(-2),
                    '-',
                    ('0' + date.getDate()).slice(-2)
                ].join('')

                localStorage.setItem('rating-analyzer-image-data-date', dateValue)
            }

            {
                const tempRow = document.createElement('tr')
                const tableRow = scoresTables[listIndex].appendChild(tempRow)
                const alert = `
                <td>
                    <div class="list-item--alert d-flex justify-content-start align-items-center">
                        <div class="svg-wrapper d-flex mx-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle svg-fs-3" viewBox="0 0 16 16">
                                <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                                <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                            </svg>
                        </div>
                        <div class="d-flex vstack mx-1">
                            <div class="d-flex small">
                                <span class="lang lang-japanese">表示できる譜面がありません。</span>
                                <span class="lang lang-english d-none">There are no charts to display.</span>
                            </div>
                            <div class="d-flex small">
                                <span class="lang lang-japanese">フィルターの選択内容を変更してください。</span>
                                <span class="lang lang-english d-none">Please change the filter selections.</span>
                            </div>
                        </div>
                    </div>
                </td>`
                .replaceAll(/(^ {16}|^\n)/gm, '')

                tableRow.innerHTML = alert
                tableRow.classList.add('chart-list--alert', 'chart-list--alert-filter', 'd-none')
            }

            {
                const tempRow = document.createElement('tr')
                const tableRow = scoresTables[listIndex].appendChild(tempRow)
                const alert = `
                <td>
                    <div class="list-item--alert d-flex justify-content-start align-items-center">
                        <div class="svg-wrapper d-flex mx-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle svg-fs-3" viewBox="0 0 16 16">
                                <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                                <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                            </svg>
                        </div>
                        <div class="d-flex vstack mx-1">
                            <div class="d-flex small">
                                <span class="lang lang-japanese">チェックリストが空です。</span>
                                <span class="lang lang-english d-none">No items added to checklist.</span>
                            </div>
                        </div>
                    </div>
                </td>`
                .replaceAll(/(^ {16}|^\n)/gm, '')

                tableRow.innerHTML = alert
                tableRow.classList.add('chart-list--alert', 'chart-list--alert-check', 'd-none')
            }
        })

        {
            const remainingScores = document.querySelectorAll('.list-item--remaining-score')

            remainingScores.forEach(div => {
                if (div.innerText.trim() === '') {
                    div.remove()
                }
            })
        }

        {
            const targetRows = document.querySelectorAll('.scoresTable > tr')

            targetRows.forEach(row => {
                const remainingScores = row.querySelectorAll('.list-item--remaining-score')

                if (remainingScores.length > 0) {
                    remainingScores.forEach(div => {
                        if (row.dataset.remainingMin === '') {
                            row.dataset.remainingMin = div.dataset.remaining
                        } else {
                            if (Number(div.dataset.remaining) < Number(row.dataset.remainingMin)) {
                                row.dataset.remainingMin = div.dataset.remaining
                            }
                        }
                    })
                }
            })
        }

        {
            switch (localStorage.getItem('rating-analyzer-large-table')) {
                case 'true':
                    switchLargeTable(true)
                    break

                case 'false':
                    switchLargeTable(false)
                    break

                default:
                    break
            }
        }

        if (localStorage.getItem('rating-analyzer-alt-title') !== 'true') {
            setDisplayNone('.list-item--alt-title', true)
        }

        {
            const summedRateCurrents = document.querySelectorAll('.summedRateCurrent')
            summedRateCurrents[listIndex].innerHTML = varSummedRateCurrents[listIndex].toFixed(3)
        }

        {
            const summedRateUppers = document.querySelectorAll('.summedRateUpper')
            summedRateUppers[listIndex].innerHTML = varSummedRateUppers[listIndex].toFixed(3)
        }

        {
            const summarySubtotals = ['summary-subtotal-newer', 'summary-subtotal-older']
            document.querySelector(`#${summarySubtotals[listIndex]}`).innerHTML = varSummedRateCurrents[listIndex].toFixed(3)
            document.querySelector(`#${summarySubtotals[listIndex]}-ratio`).innerHTML = `${Number(varSummedRateCurrents[listIndex] / varSummedRateUppers[listIndex] * 100).toFixed(1)}%`
        }

        {
            const chartsCount =  stats.reduce((sum, e) => sum + e, 0)
            const statsGraphs = document.querySelectorAll('.stats-graph')
            
            {
                const graphBarStatses = statsGraphs[listIndex].querySelectorAll('.graph-bar-stats')

                graphBarStatses.forEach((div, index) => {
                    const style = `width: ${ stats[index] / chartsCount * 100}%;`
                    div.setAttribute('style', style)
                    div.setAttribute('aria-valuenow',  stats[index])
                    div.setAttribute('aria-valuemax', chartsCount)
                })
            }

            {
                const graphRatioStatses = statsGraphs[listIndex].querySelectorAll('.graph-ratio-stats')

                graphRatioStatses.forEach((div, index) => {
                    div.innerHTML = stats[index]
                })
            }
        }
    })

    {
        const totalRateUpper = varSummedRateUppers.reduce((sum, e) => sum + e, 0).toFixed(3)
        const totalRateCurrent = varSummedRateCurrents.reduce((sum, e) => sum + e, 0).toFixed(3)

        const scaleDotsVolume = Math.floor(totalRateUpper / 100)
        const extraRate = totalRateUpper - (scaleDotsVolume * 100)
        const equalRange = (100 - (extraRate / totalRateUpper * 100)) / scaleDotsVolume

        const scaleDotCode = `
            <div class="scale-dot position-absolute translate-middle text-white" style="left: 0%!important; top: 45%!important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dot" viewBox="0 0 16 16">
                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                </svg>
            </div>`
        .replaceAll(/(^ {8}|^\n)/gm, '')

        varClassRanges[(varClassRanges.length - 1)] = (totalRateUpper - 2500)

        document.querySelectorAll(['.check-list--rating-total-before', '#total-rate-current']).forEach(target => target.innerHTML = totalRateCurrent)
        document.querySelector('#total-rate-upper').innerHTML = `${totalRateUpper}`
        document.querySelector('#summary-total').innerHTML = totalRateCurrent
        document.querySelector('#summary-total-ratio').innerHTML = `${Number(totalRateCurrent / totalRateUpper * 100).toFixed(1)}%`

        localStorage.setItem('rating-analyzer-current-rating', totalRateCurrent)

        {
            const targetDiv = document.querySelectorAll(['.check-list--rating-total-before', '#total-rate-current'])
            const classColors = ['bg-plain', 'bg-navy', 'bg-yellow', 'bg-red', 'bg-purple', 'bg-blue', 'bg-silver', 'bg-gold', 'bg-rainbow']
            const classBorders = [0, 300, 600, 1000, 1300, 1600, 1900, 2200, 2500]

            targetDiv.forEach(target => target.classList.remove('bg-white'))

            classColors.forEach(color => {
                targetDiv.forEach(target => target.classList.remove(color))
            })

            if (totalRateCurrent < classBorders[1]) {
                targetDiv.forEach(target => target.classList.add(classColors[0])) 
            } else {
                checkColor:
                for (let index = classBorders.length - 1; index > 0; index--) {
                    if (totalRateCurrent >= classBorders[index]) {
                        targetDiv.forEach(target => target.classList.add(classColors[index])) 
                        break checkColor
                    }
                }
            }
        }

        {
            const scaleDots = document.querySelectorAll('.scale-dot')

            scaleDots.forEach(div => {
                div.remove()
            })
        }

        for (let index = 0; index < scaleDotsVolume; index++) {
            const dotLocation = (index + 1) * equalRange
            const insertCode = scaleDotCode.replaceAll('left: 0%', `left: ${dotLocation}%`)
            document.querySelector('div.rate-graph div.graph-bar').insertAdjacentHTML('beforeend', insertCode)
        }

        {
            const currentLocs = document.querySelectorAll('.current-loc')

            currentLocs.forEach(div => {
                const styleTextBefore = div.getAttribute('style')
                const pattern = /left: [0-9.]+?%!important;/
                const replaceText = `left: ${totalRateCurrent / totalRateUpper * 100}%!important;`
                const styleTextAfter = styleTextBefore.replace(pattern, replaceText)
                div.setAttribute('style', styleTextAfter)
            })
        }

        {
            const rateGraph = document.querySelector('.rate-graph')
            const graphBarRates = rateGraph.querySelectorAll('.graph-bar-rate')

            graphBarRates.forEach((div, index) => {
                const borderValue = varClassRanges[index]
                const style = `width: ${borderValue / totalRateUpper * 100}%;`
                div.setAttribute('style', style)
                div.setAttribute('aria-valuenow', borderValue)
                div.setAttribute('aria-valuemax', totalRateUpper)
            })

            rateGraph.querySelectorAll('.graph-bar-rate-2').forEach((div, index) => {
                const borderValue = index ? varSummedRateCurrents[0] : varSummedRateCurrents[1]
                const style = `width: ${borderValue / totalRateUpper * 100}%;`
                div.setAttribute('style', style)
                div.setAttribute('aria-valuenow', borderValue)
                div.setAttribute('aria-valuemax', totalRateUpper)
            })
        }
    }

    {
        const disabledInputs = document.querySelectorAll('input[disabled]')
        disabledInputs.forEach(input => input.disabled = false)
    }

    playdata.classList.add('is-valid')

    if (localStorage.getItem('rating-analyzer-prev') != playdata.value) {
        const date = new Date()
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
        ].join('')
    
        localStorage.setItem('rating-analyzer-prev', playdata.value)
        localStorage.setItem('rating-analyzer-prev-date', formattedDate)
    }

    updateChartVisibilityByType()
    updateChartVisibilityByDifficulty()
    refreshChartVisibility()

    switch (localStorage.getItem('rating-analyzer-lang')) {
        case 'japanese':
            setLanguage('japanese')
            break

        case 'english':
            setLanguage('english')
            break
    
        default:
            setLanguage('japanese')
            break
    }

    {
        const buttons = document.querySelectorAll(['#btn-export'])
        buttons.forEach(button => button.disabled = false)
    }
}

// Set filters based on changes in type options
function toggleChartVisibilityByType(type, checked) {
    const types = ['targets', 'candidates', 'others']

    if (types.includes(type) === false) {
        return false
    }

    {
        const toggles = document.querySelectorAll(`.rating-${type}-toggle`)
        toggles.forEach(input => input.checked = checked)
    }

    localStorage.setItem(`rating-analyzer-filter-type-${type}`, checked)
    updateChartVisibilityByType()
    refreshChartVisibility()
}

// Set filters based on the current type options
function updateChartVisibilityByType() {
    const rows = document.querySelectorAll('tr.chart-list--item')
    rows.forEach(row => {
        row.classList.remove('type-hidden')
        {
            const key = 'rating-analyzer-filter-type-targets'
            if (
                (localStorage.getItem(key) === 'false') &&
                (row.classList.contains('table-targets')) &&
                (row.classList.contains('table-candidates') === false)
            ) {
                row.classList.add('type-hidden')
            }
        }
        {
            const key = 'rating-analyzer-filter-type-candidates'
            if (
                (localStorage.getItem(key) === 'false') &&
                (row.classList.contains('table-candidates'))
            ) {
                row.classList.add('type-hidden')
            }
        }
        {
            const key1 = 'rating-analyzer-filter-type-targets'
            const key2 = 'rating-analyzer-filter-type-candidates'
            if (
                (localStorage.getItem(key1) !== 'false') &&
                (localStorage.getItem(key2) === 'false') &&
                (row.classList.contains('table-targets'))
            ) {
                row.classList.remove('type-hidden')
            }
        }
        {
            const key = 'rating-analyzer-filter-type-others'
            if (
                (localStorage.getItem(key) === 'false') &&
                (row.classList.contains('table-targets') === false) &&
                (row.classList.contains('table-candidates') === false)
            ) {
                row.classList.add('type-hidden')
            }
        }
    })
}

// Set filters based on changes in difficulty options
function toggleChartVisibilityByDifficulty(difficulty, checked) {
    const difficulties = ['normal', 'hard', 'expert', 'inferno']

    if (difficulties.includes(difficulty) === false) {
        return false
    }

    {
        const toggles = document.querySelectorAll(`.difficulty-${difficulty}-toggle`)
        toggles.forEach(input => input.checked = checked)
    }

    localStorage.setItem(`rating-analyzer-filter-difficulty-${difficulty}`, checked)

    {
        const targetRows = document.querySelectorAll(`.difficulty-${difficulty}`)

        targetRows.forEach(row => {
            if (checked) {
                row.classList.remove('difficulty-hidden')
            } else {
                row.classList.add('difficulty-hidden')
            }
        })
    }

    refreshChartVisibility()
}

// Set filters based on the current difficulty options
function updateChartVisibilityByDifficulty() {
    const difficulties = ['normal', 'hard', 'expert', 'inferno']

    difficulties.forEach(difficulty => {
        const checkboxes = document.querySelectorAll(`.difficulty-${difficulty}-toggle`)
        const checked = checkboxes[0].checked
        const targetRows = document.querySelectorAll(`.difficulty-${difficulty}`)

        targetRows.forEach(row => {
            if (checked) {
                row.classList.remove('difficulty-hidden')
            } else {
                row.classList.add('difficulty-hidden')
            }
        })
    })
}

function filterByRemainingScore(difference, checked) {
    if (String(difference).match(/[0-9]+/g)[0] !== String(difference)) {
        return false
    }

    {
        const selects = document.querySelectorAll('.remaining-score-filter-select')
        selects.forEach(div => div.value = difference)
    }

    {
        const targetRows = document.querySelectorAll('.scoresTable > tr')

        targetRows.forEach(row => {
            if (checked) {
                if (row.dataset.remainingMin !== '' && Number(row.dataset.remainingMin) <= Number(difference)) {
                    row.classList.remove('remaining-hidden')
                } else {
                    row.classList.add('remaining-hidden')
                }
            } else {
                row.classList.remove('remaining-hidden')
            }
        })
    }

    refreshChartVisibility()
}

function toggleRemainingScoreFilter(checked) {
    document.querySelector('#btn-remaining-score-filter').click()
    setDisplayNone('.icon-remaining-score-filter', !checked)

    if (checked === false) {
        toggleDisplayState('remaining-score-filter', false)
        const select = document.querySelector('#remaining-score-filter-select-1')
        filterByRemainingScore(select.value, false)
    }
}

// Apply a filter to the table
function refreshChartVisibility() {
    const rows = document.querySelectorAll('tr.chart-list--item')

    if (rows.length === 0) {
        return
    }

    rows.forEach(row => {
        if (
            row.classList.contains('type-hidden') ||
            row.classList.contains('difficulty-hidden') ||
            row.classList.contains('remaining-hidden')
        ) {
            row.classList.add('d-none')
        } else {
            row.classList.remove('d-none')
        }
    })

    setDisplayNone('.chart-list-control--check-list-active', true)

    {
        const entries = document.querySelectorAll('.box-entry')
        entries.forEach(entry => {
            entry.querySelectorAll('.scoresTable tr.chart-list--alert').forEach(alert => alert.classList.add('d-none'))
            const rows = entry.querySelectorAll('.scoresTable tr.chart-list--item:not(.d-none)')
            const alert = entry.querySelector('.scoresTable tr.chart-list--alert-filter')
            if (rows.length === 0) {
                alert.classList.remove('d-none')
                entry.querySelector('.chart-list').scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                })
            } else {
                alert.classList.add('d-none')
            }
        })
    }

    {
        const lists = document.querySelectorAll('.chart-list')
        lists.forEach(list => {
            list.classList.remove('opacity-trans-100')
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    list.classList.add('opacity-trans-100')
                })
            })
        })
    }
}

// Show only charts that have been added to the checklist
function activateChecklistViewer() {
    const rows = document.querySelectorAll('tr.chart-list--item')

    if (rows.length === 0) {
        return
    }

    rows.forEach(row => {
        if (row.querySelectorAll('.list-item--small a.multi-rate-selected').length === 0) {
            row.classList.add('d-none')
        } else {
            row.classList.remove('d-none')
        }
    })

    {
        const entries = document.querySelectorAll('.box-entry')
        entries.forEach(entry => {
            entry.querySelectorAll('.scoresTable tr.chart-list--alert').forEach(alert => alert.classList.add('d-none'))
            const rows = entry.querySelectorAll('.scoresTable tr.chart-list--item:not(.d-none)')
            const alert = entry.querySelector('.scoresTable tr.chart-list--alert-check')
            if (rows.length === 0) {
                alert.classList.remove('d-none')
                entry.querySelector('.chart-list').scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                })
            } else {
                alert.classList.add('d-none')
            }
        })
    }

    {
        const lists = document.querySelectorAll('.chart-list')
        lists.forEach(list => {
            list.classList.remove('opacity-trans-100')
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    list.classList.add('opacity-trans-100')
                })
            })
        })
    }

    setDisplayNone('.chart-list-control--check-list-active', false)
}

// Toggle the display status of any column
function toggleColumnVisibility(columnName, checked) {
    {
        const toggles = document.querySelectorAll(`#column-${columnName}-toggle`)
        toggles.forEach(input => input.checked = checked)
    }

    localStorage.setItem(`rating-analyzer-column-${columnName}`, checked)

    {
        const tableDatas = document.querySelectorAll(`.${columnName}-column`)

        tableDatas.forEach(data => {
            if (checked) {
                data.classList.remove('d-none')
            } else {
                data.classList.add('d-none')
            }
        })
    }
}

// Toggle display state of any elements
function toggleDisplayState(className, checked) {
    {
        const toggles = document.querySelectorAll(`#${className}-toggle`)
        toggles.forEach(input => input.checked = checked)
    }

    localStorage.setItem(`rating-analyzer-${className}`, checked)

    {
        const targets = document.querySelectorAll(`.list-item--${className}`)

        targets.forEach(data => {
            if (checked) {
                data.classList.remove('d-none')
            } else {
                data.classList.add('d-none')
            }
        })
    }

    {
        const lists = document.querySelectorAll('.chart-list')
        lists.forEach(list => {
            list.classList.remove('opacity-trans-100')
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    list.classList.add('opacity-trans-100')
                })
            })
        })
    }
}

// Clear the text area
function clearPlaydata() {
    document.querySelector('#playdata').value = ''
}

// Enable data analyze mode
function activateAnalyzeMode() {
    const playdata = document.querySelector('#playdata')

    localStorage.setItem('rating-analyzer-temp', playdata.value)
    localStorage.setItem('rating-analyzer-analyze-mode', 'true')
    playdata.value = ''
    location.href = 'https://bit.ly/3tiGGDb'
}

// Run the analyze
function startAnalyze() {
    const temp = localStorage.getItem('rating-analyzer-temp')
    const playdata = document.querySelector('#playdata')

    localStorage.setItem('rating-analyzer-analyze-mode', 'false')
    playdata.value = temp
    localStorage.removeItem('rating-analyzer-temp')

    analyze()

    {
        const visibleFeedbacks = document.querySelectorAll('.invalid-feedback:not(.d-none)')

        if (visibleFeedbacks.length !== 0) {
            return
        }

        document.querySelector('#btn-analyzed-modal').click()
    }
}

// Enable data restore mode
function activateRestoreMode() {
    {
        const prevData = localStorage.getItem('rating-analyzer-prev')

        if (prevData === null) {
            document.querySelector('#btn-restore-fail-modal').click()
            return false
        }
    }

    {
        const textarea = document.querySelector('#playdata')
        textarea.value = ''
    }

    localStorage.setItem('rating-analyzer-restore-mode', 'true')
    location.reload()
}

// Restore the previous data
function restorePrevData() {
    {
        const prevData = localStorage.getItem('rating-analyzer-prev')
        const textarea = document.querySelector('#playdata')
        
        localStorage.setItem('rating-analyzer-restore-mode', 'false')
        textarea.value = prevData
    }

    analyze()

    {
        const missingItems = document.querySelectorAll('.missing-items-list > div')
        if (missingItems.length !== 0) {
            document.querySelector('#btn-restored-modal').click()
        }
}
}

// Change the display scale
function changeDisplayScale() {
    const root = document.querySelector('html')

    {
        const scaleList = ['fs-100', 'fs-95', 'fs-90', 'fs-85', 'fs-80', 'fs-75', 'fs-70', 'fs-65', 'fs-60', 'fs-55', 'fs-50']
        scaleList.forEach(e => root.classList.remove(e))
    }

    {
        const scale = document.querySelector('#select-disp-scale')
        root.classList.add(`fs-${scale.value}`)
        localStorage.setItem('rating-analyzer-display-scale', scale.value)
    }
}

// Copy the bookmarklet
function copyBookmarklet() {
    const copyTarget = document.querySelector('#copyTarget')
    const writeString = copyTarget.value

    if (navigator.clipboard == undefined) {
        window.clipboardData.setData('Text', writeString)
    } else {
        navigator.clipboard.writeText(writeString)
    }

    switch (localStorage.getItem('rating-analyzer-lang')) {
        case 'japanese':
            alert('コピーしました！')
            break

        case 'english':
            alert('Copied!')
            break

        default:
            alert('Copied!')
            break
    }
}

// Get score and modifier mapping table
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
        [850000, 1.5],
        [800000, 1],
        [700000, 0.8],
        [600000, 0.7],
        [500000, 0.6],
        [400000, 0.5],
        [300000, 0.4],
        [200000, 0.3],
        [100000, 0.2],
        [1, 0.1],
        [0, 0]
    ]
}

function getDatasetIndex() {
    const songs = getChartTable()

    return {
        'title'             : songs[0].indexOf('@song-title'),
        'title-english'     : songs[0].indexOf('@song-title-english'),
        'genre'             : songs[0].indexOf('@genre'),
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
    }
}

// Get chart constants
function getChartConstants(songTitle, diffValue) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return Number(song[indexes['normal-constant']]).toFixed(1)
            }

            if (song[indexes['hard-level']] == diffValue) {
                return Number(song[indexes['hard-constant']]).toFixed(1)
            }

            if (song[indexes['expert-level']] == diffValue) {
                return Number(song[indexes['expert-constant']]).toFixed(1)
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return Number(song[indexes['inferno-constant']]).toFixed(1)
            }
        }
    }
}

// Check if the chart is a newer
function isThisChartNewer(songTitle, diffValue) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return song[indexes['normal-newer']]
            }

            if (song[indexes['hard-level']] == diffValue) {
                return song[indexes['hard-newer']]
            }

            if (song[indexes['expert-level']] == diffValue) {
                return song[indexes['expert-newer']]
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return song[indexes['inferno-newer']]
            }
        }
    }
}

// Get chart constants
function getChartConstants(songTitle, diffValue) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            if (song[indexes['normal-level']] == diffValue) {
                return Number(song[indexes['normal-constant']]).toFixed(1)
            }

            if (song[indexes['hard-level']] == diffValue) {
                return Number(song[indexes['hard-constant']]).toFixed(1)
            }

            if (song[indexes['expert-level']] == diffValue) {
                return Number(song[indexes['expert-constant']]).toFixed(1)
            }

            if (song[indexes['inferno-level']] == diffValue) {
                return Number(song[indexes['inferno-constant']]).toFixed(1)
            }
        }
    }
}

// Get the genre from the song title
function getGenre(songTitle) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            return song[indexes['genre']]
        }
    }
}

// Get the song title in English from the original song title
function getEnglishTitle(songTitle) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            return song[indexes['title-english']]
        }
    }
}

// Get the class based on the genre
function getGenreClass(genre) {
    const classes = {
        'ANIME/POP'         : 'bg-anime',
        'VOCALOID'          : 'bg-vocaloid',
        'TOUHOU ARRANGE'    : 'bg-touhou',
        'ANIME MUSICAL'     : 'bg-musical',
        'VARIETY'           : 'bg-variety',
        'ORIGINAL'          : 'bg-original',
        'HARDCORE TANO*C'   : 'bg-tanoc'
    }

    return classes[genre]
}

// Get the element based on the genre
function getGenreElement(genre) {
    const classes = {
        'ANIME/POP'         : '<span class="lang lang-japanese">アニメ/POP</span><span class="lang lang-english d-none">ANIME/POP</span>',
        'VOCALOID'          : '<span class="lang lang-japanese">ボーカロイド</span><span class="lang lang-english d-none">VOCALOID</span>',
        'TOUHOU ARRANGE'    : '<span class="lang lang-japanese">東方アレンジ</span><span class="lang lang-english d-none">TOUHOU ARRANGE</span>',
        'ANIME MUSICAL'     : '<span class="lang lang-japanese">2.5次元</span><span class="lang lang-english d-none">ANIME MUSICAL</span>',
        'VARIETY'           : '<span class="lang lang-japanese">バラエティ</span><span class="lang lang-english d-none">VARIETY</span>',
        'ORIGINAL'          : '<span class="lang lang-japanese">オリジナル</span><span class="lang lang-english d-none">ORIGINAL</span>',
        'HARDCORE TANO*C'   : '<span class="lang lang-japanese">HARDCORE TANO*C</span><span class="lang lang-english d-none">HARDCORE TANO*C</span>'
    }

    return classes[genre]
}

// Quit the Multi Select Mode
function quitMultiSelectMode(listtype) {
    if (listtype.match(/new|old/) == null) {
        return false
    }

    {
        const rateAlert = document.querySelector(`#multi-rate-alert-${listtype}`)
        rateAlert.classList.add('d-none')
    }

    {
        const chartList = document.querySelector(`#chart-list-${listtype}`)
        chartList.classList.remove('chart-list-shrink')
    }

    {
        const tables = document.querySelectorAll('.scoresTable')
        const tableIndex = listtype == 'new' ? 0 : 1

        {
            const tableDatas = tables[tableIndex].querySelectorAll('.multi-rate-selected')
            tableDatas.forEach(td => td.classList.remove('multi-rate-selected'))
        }
    }
}

function modifyCheckListItem(element) {
    if (element.tagName !== 'A') {
        return false
    }

    // Toggle only selected button, deactivate all others
    {
        const anchors = document.querySelectorAll(`a[data-query-class="${element.dataset.queryClass}"]`)
        anchors.forEach(anchor => {
            if (anchor.dataset.query === element.dataset.query) {
                anchor.classList.toggle('multi-rate-selected')
            } else {
                anchor.classList.remove('multi-rate-selected')
            }
        })
    }

    // Change to make the state of small list and large list same
    {
        const goals = [950000, 960000, 970000, 980000, 990000]

        const anchors = document.querySelectorAll(`a[data-query="${element.dataset.query}"]`)
        anchors.forEach(anchor => {
            if (element.classList.contains('multi-rate-selected')) {
                anchor.classList.add('multi-rate-selected')

                const selector = `tr[data-list-index="${anchor.dataset.listIndex}"][data-index="${anchor.dataset.index}"]`
                const motherRow = document.querySelector(selector)
                motherRow.dataset.imageDataChecklists = `${goals[Number(anchor.dataset.buttonIndex)]},${anchor.innerText}`
            } else {
                anchor.classList.remove('multi-rate-selected')

                const selector = `tr[data-list-index="${anchor.dataset.listIndex}"][data-index="${anchor.dataset.index}"]`
                const motherRow = document.querySelector(selector)
                motherRow.dataset.imageDataChecklists = ''
            }
        })
    }

    saveCheckList()
    applyCheckList()

    if (document.querySelectorAll('.check-list--control-visible.width-trans-100').length === 0) {
        toggleCheckListVisibility(true)
    }
}

function saveCheckList() {
    const selectedRates = document.querySelectorAll(`.list-item--small a.multi-rate-selected`)
    const checklist = Array.from(selectedRates).map(a => a.dataset.query).join('\n')
    localStorage.setItem('rating-analyzer-check-list', checklist)
}

function restoreCheckList() {
    const goals = [950000, 960000, 970000, 980000, 990000]
    const checklist = localStorage.getItem('rating-analyzer-check-list')
    
    if (!checklist) {
        return false
    }

    checklist.split('\n').forEach(line => {
        const buttons = document.querySelectorAll(`tr.chart-list--item a[data-query="${line}"]`)

        if (buttons.length !== 2) {
            return
        }

        if (buttons) {
            buttons.forEach(button => {
                button.classList.add('multi-rate-selected')
            })

            const selector = `tr[data-list-index="${buttons[0].dataset.listIndex}"][data-index="${buttons[0].dataset.index}"]`
            const motherRow = document.querySelector(selector)
            motherRow.dataset.imageDataChecklists = `${goals[Number(buttons[0].dataset.buttonIndex)]},${buttons[0].innerText}`
        }
    })
}

/**
 * @param {Number} listindex
 */
function clearCheckListLauncher(listindex) {
    const confirms = document.querySelectorAll('.check-list--modal-confirm-text')
    confirms.forEach(div => div.classList.add('d-none'))
    confirms[listindex].classList.remove('d-none')
    document.querySelector('#check-list--clear-target').value = listindex
    document.querySelector('#btn-clear-checklist-modal').click()
}

function clearCheckList() {
    const index = document.querySelector('#check-list--clear-target').value
    if ((index !== '0') && (index !== '1')) {
        return
    }

    if (document.querySelectorAll('tr.chart-list--item').length === 0) {
        return
    }

    const chartLists = document.querySelectorAll('.scoresTable')
    const anchors = chartLists[index].querySelectorAll('a.multi-rate-selected')
    anchors.forEach(anchor => anchor.classList.remove('multi-rate-selected'))
    refreshChartVisibility()
    saveCheckList()
    applyCheckList()
}

function applyCheckList() {
    const chartLists = document.querySelectorAll('.scoresTable')
    chartLists.forEach((chartlist, index) => {
        const topSingleRates = chartlist.querySelectorAll(`.top-single-rate .list-item--small .list-item--rating-now`)
        let topSinleRatesArr =
            Array
            .from(topSingleRates)
            .map(div => Number(div.innerHTML))
            .sort((a, b) => b - a)

        const selectedRates = chartlist.querySelectorAll(`.list-item--small a.multi-rate-selected`)
        const selectedRatesArr =
            Array
            .from(selectedRates)
            .map(div => Number(div.dataset.rating))
            .sort((a, b) => b - a)

        const replaceRatesArr =
            Array
            .from(selectedRates)
            .map(div => Number(div.dataset.now))
            .sort((a, b) => b - a)
        const oldListTotal = topSinleRatesArr.reduce((a, b) => a + b, 0)

        replaceRatesArr.forEach(value => {
            const arrIndex = topSinleRatesArr.indexOf(value)

            if (arrIndex != -1) {
                topSinleRatesArr.splice(arrIndex, 1)
            }
        })

        const newList =
            [...topSinleRatesArr, ...selectedRatesArr]
            .sort((a, b) => b - a)
            .splice(0, topSingleRates.length)
        const newListTotal = newList.reduce((a, b) => a + b, 0)
        const rateIncsease = newListTotal - oldListTotal
        const alreadyListed = chartlist.querySelectorAll(`.table-target .list-item--small .multi-rate-selected`)
        
        {
            const entries = document.querySelectorAll('.box-entry')
            const indicators = entries[index].querySelectorAll('.check-list--indicator-icon .check-list--indicator-icon-active')

            if (selectedRates.length > 0) {
                indicators.forEach(e => e.classList.remove('d-none'))
            } else {
                indicators.forEach(e => e.classList.add('d-none'))
            }

            entries[index].querySelector('.check-list--rating-after').innerHTML = newListTotal.toFixed(3)
            entries[index].querySelector('.check-list--rating-increase').innerHTML = rateIncsease.toFixed(3)
        }
    })

    {
        const currentTotal = document.querySelector('#total-rate-current')
        const afterTotals = document.querySelectorAll('.check-list--rating-total-after')
        const increases = document.querySelectorAll('.check-list--rating-increase')
        const increasesTotal = Array.from(increases).reduce((sum, increase) => sum + Number(increase.innerText), 0)

        const classColors = ['bg-plain', 'bg-navy', 'bg-yellow', 'bg-red', 'bg-purple', 'bg-blue', 'bg-silver', 'bg-gold', 'bg-rainbow']
        const classBorders = [0, 300, 600, 1000, 1300, 1600, 1900, 2200, 2500]

        localStorage.setItem('rating-analyzer-check-list-rating', (Number(currentTotal.innerText) + Number(increasesTotal)).toFixed(3))

        afterTotals.forEach(total => total.innerHTML = (Number(currentTotal.innerText) + Number(increasesTotal)).toFixed(3))
        afterTotals.forEach(total => total.classList.remove('bg-white'))

        classColors.forEach(color => {
            afterTotals.forEach(total => total.classList.remove(color))
        })

        if ((Number(currentTotal.innerText) + Number(increasesTotal)) < classBorders[1]) {
            afterTotals.forEach(total => total.classList.add(classColors[0]))
        } else {
            checkColor:
            for (let index = classBorders.length - 1; index > 0; index--) {
                if ((Number(currentTotal.innerText) + Number(increasesTotal)) >= classBorders[index]) {
                    afterTotals.forEach(total => total.classList.add(classColors[index]))
                    break checkColor
                }
            }
        }
    }
}

/**
 * @param {Boolean} isVisible
 */
function toggleCheckListVisibility(isVisible) {
    {
        const controls = document.querySelectorAll('.check-list--control')
        controls.forEach(control => {
            control.classList.remove('width-trans-100')
        })
    }

    if (isVisible) {
        const controls = document.querySelectorAll('.check-list--control-visible')
        controls.forEach(control => {
            control.classList.remove('width-trans-100')
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    control.classList.add('width-trans-100')
                })
            })
        })
        localStorage.setItem('rating-analyzer-check-list-visible', true)
    } else {
        const controls = document.querySelectorAll('.check-list--control-hidden')
        controls.forEach(control => {
            control.classList.remove('width-trans-100')
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    control.classList.add('width-trans-100')
                })
            })
        })
        toggleDropdownMenu(false)
        localStorage.setItem('rating-analyzer-check-list-visible', false)
    }
}

/**
 * @param {Boolean} isVisible 
 */
function toggleDropdownMenu(isVisible) {
    const menus = document.querySelectorAll('.dropdown-menu')
    menus.forEach(menu => {
        if (isVisible) {
            menu.classList.add('show')
        } else {
            menu.classList.remove('show')
        }
    })
}

// Generate a dataset table
function generateDatasetTable() {
    const trueIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>`.replaceAll(/(^ {8}|^\n)/gm, '')
    const falseIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
        </svg>`.replaceAll(/(^ {8}|^\n)/gm, '')

    const tbody = document.querySelector('#chart-dataset')
    tbody.innerHTML = ''

    const songs = getChartTable()
    const indexes = getDatasetIndex()
    const difficulties = ['normal', 'hard', 'expert', 'inferno']

    let rowIndex = 0
    const tableContent = songs.map((song, index) => {
        if (index === 0) {
            return ''
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

            return true
        })
        .map(difficulty => {
            rowIndex++

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
        .replaceAll(/(^ {16}|^\n)/gm, '')
    }).join('\n')

    tbody.innerHTML = tableContent
}

// Apply a filter to the dataset table
function filterDatasetTable(value) {
    setDisplayNone('.filter-option-tooltip', true)

    const searchValue = String(value).replaceAll('　',' ').toLowerCase()

    const trows = document.querySelectorAll('#chart-dataset > tr')

    trows.forEach(row => {
        row.classList.remove('d-none')
    })
    
    if (searchValue === '') {
        return false
    }

    trows.forEach(row => {
        searchValue.split(' ').forEach(key => {
            if (key.indexOf(':') === -1) {
                if (row.dataset.fulltext.indexOf(key) === -1) {
                    row.classList.add('d-none')
                }
            } else {
                if (row.dataset.fulltext.indexOf(`${key} `) === -1) {
                    row.classList.add('d-none')
                }
            }
        })
    })
}

function addFilterOption(option) {
    const input = document.querySelector('#dataset-filter-input')
    input.value = `${input.value} ${option}`
    setDisplayNone('.filter-option-tooltip', true)
    setDisplayNone(`#filter-option-tooltip-${option.match(/[a-z]+/g)[0]}`, false)
    input.focus()
}

function clearFilterInput() {
    const input = document.querySelector('#dataset-filter-input')
    input.value = ''
    input.focus()
    filterDatasetTable(input.value)
}

// Save analysis results as CSV
function saveTableData() {
    let dataTableText = ''
    
    {
        const headerTextJpn = '"枠","#","曲名","レベル","スコア","定数","補正","現在","上限","950k","960k","970k","980k","990k"\n'
        const headerTextEng = '"List","#","Song Title","Level","Score","Constant","Modifier","Now","Max","950k","960k","970k","980k","990k"\n'
        
        switch (localStorage.getItem('rating-analyzer-lang')) {
            case 'japanese':
                dataTableText = headerTextJpn
                break

            case 'english':
                dataTableText = headerTextEng
                break

            default:
                dataTableText = headerTextEng
                break
        }
    }

    const dataTableRow = document.querySelectorAll('tr.chart-list--item')

    dataTableRow.forEach((tr, index) => {
        if (index > 0) dataTableText += '\n'
        dataTableText += tr.dataset.fileRow
    })

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, dataTableText], {'type' : 'text/csv'})
    const date = new Date()
    const filename = [
        'wacca-',
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2),
        '-',
        ('0' + date.getHours()).slice(-2),
        ('0' + date.getMinutes()).slice(-2),
        ('0' + date.getSeconds()).slice(-2),
    ].join('')

    let downloadLink = document.createElement('a')
    downloadLink.download = filename
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.dataset.downloadurl = ['text/plain', downloadLink.download, downloadLink.href].join(':')
    downloadLink.click()
}

// Set the display language
function setLanguage(language) {
    const langElms = document.querySelectorAll('.lang')

    langElms.forEach(element => {
        element.classList.add('d-none')

        if (element.classList.contains(`lang-${language}`)) {
            element.classList.remove('d-none')
        }
    })

    const langInputs = document.querySelectorAll('.placeholder-lang')

    langInputs.forEach(input => {
        const attr = input.getAttribute(`data-placeholder-${language}`)
        if (attr !== null) {
            input.setAttribute('placeholder', attr)
        } else {
            const engAttr = input.getAttribute('data-placeholder-english')
            if (engAttr !== null) {
                input.setAttribute('placeholder', engAttr)
            }
        }
    })

    const langSelects = document.querySelectorAll(`.select-lang`)

    langSelects.forEach(select => {
        select.value = language
    })

    localStorage.setItem('rating-analyzer-lang', language)
}

// Export the contents of LocalStorage
function showLocalStorageContent() {
    const output = document.querySelector('#output-localstorage')
    const storage = localStorage
    output.innerHTML = ''

    for (let index = 0; index < storage.length; index++) {
        const row = document.createElement('tr')
        const key = storage.key(index)
        const value = storage.getItem(key).replaceAll(/\n/gm, '<br>')
        const multiLinedItems = [
            'rating-analyzer-prev',
            'rating-analyzer-check-list',
            'rating-analyzer-image-data-targets',
            'rating-analyzer-image-data-checklists'
        ]

        if (multiLinedItems.indexOf(key) !== -1) {
            row.innerHTML = `
                <td>${index}</td>
                <td>${key}</td>
                <td>
                    <div class="table-responsive border p-1" style="max-height: 50vh;">
                        ${value}
                    </div>
                </td>`
            .replaceAll(/(^ {12}|^\n)/gm, '')
        } else {
            row.innerHTML = `
            <td>${index}</td>
            <td>${key}</td>
            <td>${value}</td>`
        .replaceAll(/(^ {12}|^\n)/gm, '')
        }

        output.appendChild(row)
    }
}

// Delete the contents of LocalStorage
function clearLocalStorageContent() {
    localStorage.clear()
    document.querySelector('#btn-modal-data-erase-done').click()
}


// Switch Loading View
function switchLoadingView(isEnabled = true) {
    if (isEnabled) {
        setDisplayNone('#container-loading', false)
        setDisplayNone('#container-main', true)
    } else {
        setDisplayNone('#container-loading', true)
        setDisplayNone('#container-main', false)
    }
}

// Set news as read
function markAsRead() {
    localStorage.setItem('rating-analyzer-last-visited', getLastUpdate())
    document.querySelector('#news').classList.add('border-start-0')
    setDisplayNone('#news-badge', true)
}

/**
 * @param {String | String[]} selector 
 * @param {Boolean} isEnabled 
 */
function setDisplayNone(selector, isEnabled = true) {
    const elements = document.querySelectorAll(selector)

    elements.forEach(element => {
        if (isEnabled) {
            element.classList.add('d-none')
        } else {
            element.classList.remove('d-none')
        }
    })
}

/**
 * @param {String} entryName 
 * @returns {Boolean}
 */
function switchChartsEntry(entryName) {
    const entryNames = ['newer', 'older']
    const entryIndex = entryNames.indexOf(entryName)

    if (entryIndex === -1) {
        return false
    }

    const entries = document.querySelectorAll('.box-entry')
    const entry = entries[entryIndex]
    const scrollY = window.scrollY

    entries.forEach(entry => entry.classList.add('d-none'))
    entry.classList.remove('d-none')
    
    window.scroll(0, scrollY)
    localStorage.setItem('rating-analyzer-charts-entry', entryName)

    {
        const symbol = entry.querySelector('.charts-entry--rotate-symbol-wrapper > svg')
        symbol.classList.remove('rotate-turn')
        entry.classList.remove('opacity-trans-100')
        window.requestAnimationFrame(function() {
            window.requestAnimationFrame(function() {
                symbol.classList.add('rotate-turn')
                entry.classList.add('opacity-trans-100')
            })
        })
    }
}

function scrollToActiveChartList() {
    const scrollTargets = document.querySelectorAll('.chart-list-control--display-options-wrapper')

    switch (localStorage.getItem('rating-analyzer-charts-entry')) {
        case 'newer':
            scrollTargets[0].scrollIntoView()
            break

        case 'older':
            scrollTargets[1].scrollIntoView()
            break

        default:
            scrollTargets[0].scrollIntoView()
            break
    }
}

function switchLargeTable(isEnabled) {
    {
        const toggles = document.querySelectorAll('#large-table-toggle')
        toggles.forEach(input => input.checked = isEnabled)
    }

    {
        localStorage.setItem('rating-analyzer-large-table', isEnabled)
    }

    {
        const chartsLists = document.querySelectorAll('.chart-list')

        chartsLists.forEach(list => {
            
            if (isEnabled) {
                list.classList.add('table-responsive')
            } else {
                list.classList.remove('table-responsive')
            }
        })
    }

    {
        const smalls = document.querySelectorAll('.list-item--small')

        smalls.forEach(div => {
            if (isEnabled) {
                div.classList.add('d-none')
            } else {
                div.classList.remove('d-none')
            }
        })
    }

    {
        const larges = document.querySelectorAll('.list-item--large')

        larges.forEach(div => {
            if (isEnabled) {
                div.classList.remove(...div.classList)
                div.classList.add('list-item--large', 'row')
            } else {
                div.classList.add('list-item--large', 'row', 'd-none', 'd-xl-flex', 'd-xxl-flex')
            }
        })
    }

    {
        const lists = document.querySelectorAll('.chart-list')
        lists.forEach(list => {
            list.classList.remove('opacity-trans-100')
        })
        lists.forEach(list => {
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    list.classList.add('opacity-trans-100')
                })
            })
        })
    }
}

function modifyScoreModalLauncher(source) {
    const sourceItem = document.querySelector(`tr[data-list-index="${source.dataset.listIndex}"][data-index="${source.dataset.index}"]`)
    const sourceTitle = sourceItem.querySelector('.list-item--title').innerHTML
    const sourceDifficulty = sourceItem.querySelector('.list-item--badge-difficulty').innerHTML
    const sourceScore = sourceItem.querySelector('.list-item--score').innerHTML
    const control = document.querySelector('.modify-score--main')

    const titleElm = control.querySelector('.modify-score--title')
    titleElm.innerHTML = sourceTitle

    const difficultyElm = control.querySelector('.modify-score--badge-difficulty')
    difficultyElm.innerHTML = sourceDifficulty

    const difficulties = ['normal', 'hard', 'expert', 'inferno', 'inferno-15']
    difficulties.forEach(e => {
        difficultyElm.classList.remove(e)
        if (String(sourceDifficulty).toLowerCase().indexOf(e) !== -1) {
            difficultyElm.classList.add(e)
        }
    })

    if (String(sourceDifficulty).toLowerCase().indexOf('inferno 15') !== -1) {
        difficultyElm.classList.add('inferno-15')
    }

    const scoreElm = control.querySelector('.modify-score--score-current-value')
    scoreElm.innerHTML = sourceScore

    const newScore = control.querySelector('.modify-score--score-new-value')
    newScore.value = ''

    const alertElm = control.querySelector('.modify-score--alert-wrapper')
    alertElm.classList.add('d-none')

    const button = document.querySelector('#btn-modify-score-modal')
    button.click()
}

/**
 * @returns 
 */
function modifyScoreModal(abort = false) {
    const control = document.querySelector('.modify-score--main')
    const title = control.querySelector('.modify-score--title').innerHTML.replace(',', '__')
    const difficulty = control.querySelector('.modify-score--badge-difficulty').innerHTML
    const oldScore = control.querySelector('.modify-score--score-current-value').innerHTML
    const newScore = control.querySelector('.modify-score--score-new-value').value
    const alertElm = control.querySelector('.modify-score--alert-wrapper')
    const button = document.querySelector('#btn-modify-score-modal')

    if (String(newScore) === '') {
        alertElm.classList.remove('d-none')
        return
    }

    if ((String(newScore).match(/[0-9]{1,7}/) == false) && (String(newScore) !== '0')) {
        alertElm.classList.remove('d-none')
        return
    }

    if (String(newScore).match(/[0-9]{1,7}/)[0] !== newScore) {
        alertElm.classList.remove('d-none')
        return
    }

    if ((Number(newScore) < Number(oldScore)) && (abort === false)) {
        const confirm = document.querySelector('.modify-score-confirm--score-new-value')
        confirm.innerHTML = newScore
        const alert = document.querySelector('#btn-modify-score-confirm-modal')
        alert.click();
        return
    }

    const playdata = localStorage.getItem('rating-analyzer-prev').split('\n')
    const newPlaydata = playdata.map(chart => {
        if (chart.indexOf(`${title},${difficulty},`) !== -1) {
            return `${title},${difficulty},${newScore}`
        } else {
            return chart
        }
    })

    const playdataInput = document.querySelector('#playdata')
    playdataInput.value = newPlaydata.join('\n')

    button.click()

    activateAnalyzeMode()
}

function generateImageData() {
    const input = document.querySelector('.input-player-name')
    localStorage.setItem('rating-analyzer-player-name', input.value)

    let data = ''
    const topCharts = document.querySelectorAll('.top-single-rate')

    if (topCharts.length === 0) {
        return
    }

    topCharts.forEach(chart => {
        if (data !== '') {
            data += '\n'
        }
        data += chart.dataset.imageData
    })

    localStorage.setItem('rating-analyzer-image-data-targets', data)
    location.href = 'export/targets.html'
}

function generateChecklistImageData() {
    const input = document.querySelector('.input-player-name')
    localStorage.setItem('rating-analyzer-player-name', input.value)

    let data = ''
    const listitems = document.querySelectorAll('tr[data-image-data-checklists*=","]')

    if (listitems.length === 0) {
        return
    }

    listitems.forEach(chart => {
        if (data !== '') {
            data += '\n'
        }
        data += chart.dataset.imageData
        data += ','
        data += chart.dataset.imageDataChecklists
    })

    const fixedData = Array
        .from(data.split('\n'))
        .sort((a, b) => {
            return Number(b.match(/[0-9]{1}\.[0-9]{3}$/gi)) - Number(a.match(/[0-9]{1}\.[0-9]{3}$/gi))
        })
        .join('\n')

    localStorage.setItem('rating-analyzer-image-data-checklists', fixedData)
    location.href = 'export/checklists.html'
}

/**
 * 
 * @param {String} option 
 */
function applyExportOption(option) {
    const additionalOpts = document.querySelectorAll('.export-image-show')
    if (option.indexOf('image') !== -1) {
        additionalOpts.forEach(div => div.classList.remove('d-none'))
    } else {
        additionalOpts.forEach(div => div.classList.add('d-none'))
    }

    const buttons = document.querySelectorAll('.export-button')
    buttons.forEach(button => button.classList.add('d-none'))

    document.querySelector(option).classList.remove('d-none')
}

/**
 * Find missing items in the play data and add items as needed.
 * @returns {Array}
 */
function findMissingItems() {
    let items = []
    const input = document.querySelector('#playdata')
    let playdata  = input.value
    const songs = getChartTable()
    const indexes = getDatasetIndex()

    for (let i = 0; i < songs.length; i++) {
        if (i === 0) {
            continue
        }

        const song = songs[i]
        const fixedTitle = String(song[indexes['title']]).replace(',', '__')
        
        if (String(playdata).includes(fixedTitle) === false) {
            items.push(song[indexes['title']])
            
            const insertLines = `
                ${fixedTitle},${song[indexes['normal-level']]},0
                ${fixedTitle},${song[indexes['hard-level']]},0
                ${fixedTitle},${song[indexes['expert-level']]},0
                ${fixedTitle},${song[indexes['inferno-level']]},0`
            .replaceAll(/(^ {16}|^\n)/gm, '')

            if (String(input.value).length === 0) {
                if (i === 1) {
                    playdata = `${insertLines}`
                } else {
                    playdata = `${playdata}\n${insertLines}`
                }
            } else {
                if (i === 1) {
                    playdata = `${insertLines}\n${playdata}`
                } else {
                    const prevTitle = songs[i - 1][indexes['title']]
                    const prevTitlePos = String(playdata).lastIndexOf(prevTitle)
                    const prevLineEndPos = String(playdata).indexOf('\n', prevTitlePos)
                    const prevLines = String(playdata).substring(0, prevLineEndPos)
                    const nextLines = String(playdata).substring(prevLineEndPos + 1)
                    playdata = `${prevLines}\n${insertLines}\n${nextLines}`
                }
            }
        }
    }

    if (items.length > 0) {
        const missingItems = document.querySelectorAll('.missing-items')
        missingItems.forEach(e => e.classList.remove('d-none'))

        const missingItemsList = document.querySelector('.missing-items-list')
        items.forEach(item => {
            const insertText = `<div>${item}</div>`
            missingItemsList.insertAdjacentHTML('beforeend', insertText)
        })
    }

    input.value = playdata
    return items
}

function activateKeywordSearch(keyword, index) {
    const keywords = String(keyword).replaceAll('　',' ').toLowerCase().split(' ')
    const list = document.querySelectorAll('.chart-list')[index]
    const rows = list.querySelectorAll('tr.chart-list--item')
    const button = document.querySelectorAll('.button-quit-keyword-search')[index]

    if (rows.length === 0) {
        return
    }

    if (String(keyword).length === 0) {
        refreshChartVisibility()
        button.classList.add('d-none')
        return
    } else {
        button.classList.remove('d-none')
    }

    rows.forEach(row => {
        row.classList.remove('d-none')
        keywords.forEach(key => {
            if (key.indexOf(':') !== -1) {
                if (row.dataset.searchText.indexOf(`${key} `) === -1) {
                    row.classList.add('d-none')
                }
            } else {
                if (row.dataset.searchText.indexOf(key) === -1) {
                    row.classList.add('d-none')
                }
            }
        })
    })
}

function addKeywordSearchOption(option, index) {
    const input = document.querySelectorAll('.input-keyword-search')[index]
    input.value += ` ${option}`

    const button = document.querySelectorAll('.button-quit-keyword-search')[index]
    button.classList.remove('d-none')

    input.focus()
}

function quitKeywordSearch(index) {
    const input = document.querySelectorAll('.input-keyword-search')[index]
    input.value = ''

    const button = document.querySelectorAll('.button-quit-keyword-search')[index]
    button.classList.add('d-none')

    refreshChartVisibility()
    input.focus()
}