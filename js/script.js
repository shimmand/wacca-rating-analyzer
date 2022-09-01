/**
 * Initialize with user settings
 * @returns 
 */
function initialize() {
    try {
        const datasetParam = document.querySelector('html').dataset.dataset
        const xhr = new XMLHttpRequest()

        // [DEBUG] FOR DEBUGGING USE ONLY
        // xhr.open('get', `https://shimmand.github.io/labs/dataset.csv?date=${datasetParam}`, true)

        xhr.open('get', `https://shimmand.github.io/wacca-rating-analyzer/assets/dataset-beta.csv?date=${datasetParam}`, true)
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
                const toggles = document.querySelectorAll('.alt-title-toggle')

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

            // Restore the display state of English song titles
            {
                const toggles = document.querySelectorAll('.artist-name-toggle')

                switch (localStorage.getItem('rating-analyzer-artist-name')) {
                    case 'true':
                        toggles.forEach(input => input.checked = true)
                        toggleDisplayState('artist-name', true)
                        break

                    case 'false':
                        toggles.forEach(input => input.checked = false)
                        toggleDisplayState('artist-name', false)
                        break

                    default:
                        toggles.forEach(input => input.checked = true)
                        toggleDisplayState('artist-name', true)
                        break
                }
            }

            // Restore the selected state of the type filter
            {
                const types = ['targets', 'candidates', 'others']

                if (localStorage.getItem('rating-analyzer-type-filter') === null) {
                    types.forEach(type => {
                        const toggles = document.querySelectorAll(`.type-filter-toggle-${type}`)

                        switch (localStorage.getItem(`rating-analyzer-filter-type-${type}`)) {
                            case 'true':
                                toggles.forEach(toggle => toggle.checked = true)
                                break

                            case 'false':
                                toggles.forEach(toggle => toggle.checked = false)
                                break

                            default:
                                break
                        }
                    })
                } else {
                    const favorites = localStorage.getItem('rating-analyzer-type-filter').split(',')

                    types.forEach(type => {
                        const toggles = document.querySelectorAll(`.type-filter-toggle-${type}`)

                        if (favorites.indexOf(type) === -1) {
                            toggles.forEach(toggle => toggle.checked = false)
                        }
                    })
                    
                }
            }

            // Restore the selected state of the difficulty filter
            {
                const difficulties = ['normal', 'hard', 'expert', 'inferno']

                if (localStorage.getItem('rating-analyzer-difficulty-filter') === null) {
                    difficulties.forEach(difficulty => {
                        const toggles = document.querySelectorAll(`.type-filter-toggle-${difficulty}`)

                        switch (localStorage.getItem(`rating-analyzer-filter-type-${difficulty}`)) {
                            case 'true':
                                toggles.forEach(toggle => toggle.checked = true)
                                break

                            case 'false':
                                toggles.forEach(toggle => toggle.checked = false)
                                break

                            default:
                                break
                        }
                    })
                } else {
                    const favorites = localStorage.getItem('rating-analyzer-difficulty-filter').split(',')

                    difficulties.forEach(difficulty => {
                        const toggles = document.querySelectorAll(`.difficulty-filter-toggle-${difficulty}`)

                        if (favorites.indexOf(difficulty) === -1) {
                            toggles.forEach(toggle => toggle.checked = false)
                        }
                    })
                    
                }
            }

            // Restore the selected state of the level filter
            {
                const levels = ['15', '14', '13+', '13', '12+', '12', '11+', '11', '10+', '10', 'lower']

                if (localStorage.getItem('rating-analyzer-level-filter') === null) {
                    localStorage.setItem('rating-analyzer-level-filter', levels.join(','))
                } else {
                    const favorites = localStorage.getItem('rating-analyzer-level-filter').split(',')

                    levels.forEach(level => {
                        const toggles = document.querySelectorAll(`.level-filter-toggle-${String(level).replace('+', 'plus')}`)

                        if (favorites.indexOf(level) === -1) {
                            toggles.forEach(toggle => toggle.checked = false)
                        }
                    })
                    
                }
            }

            {
                if (localStorage.getItem('rating-analyzer-score-filter') === null) {
                    localStorage.setItem('rating-analyzer-score-filter', 'false,0,false,0,false,0')
                } else {
                    const favorites = localStorage.getItem('rating-analyzer-score-filter').split(',')

                    const minScoreToggle = document.querySelectorAll('.score-filter-min-toggle')
                    minScoreToggle.forEach(toggle => toggle.checked = (favorites[0] === 'true'))

                    const minScoreSelect = document.querySelectorAll('.score-filter-min-select')
                    minScoreSelect.forEach(toggle => toggle.value = favorites[1])

                    const maxScoreToggle = document.querySelectorAll('.score-filter-max-toggle')
                    maxScoreToggle.forEach(toggle => toggle.checked = (favorites[2] === 'true'))

                    const maxScoreSelect = document.querySelectorAll('.score-filter-max-select')
                    maxScoreSelect.forEach(toggle => toggle.value = favorites[3])

                    const remainingScoreToggle = document.querySelectorAll('.remaining-score-filter-toggle')
                    remainingScoreToggle.forEach(toggle => toggle.checked = (favorites[4] === 'true'))

                    const remainingScoreSelect = document.querySelectorAll('.remaining-score-filter-select')
                    remainingScoreSelect.forEach(toggle => toggle.value = favorites[5])
                }
            }

            {
                const ables = ['yes', 'no']

                if (localStorage.getItem('rating-analyzer-offline-filter') === null) {
                    localStorage.setItem('rating-analyzer-offline-filter', ables.join(','))
                } else {
                    const favorites = localStorage.getItem('rating-analyzer-offline-filter').split(',')

                    ables.forEach(able => {
                        const toggles = document.querySelectorAll(`.offline-filter-toggle-${able}`)

                        if (favorites.indexOf(able) === -1) {
                            toggles.forEach(toggle => toggle.checked = false)
                        }
                    })
                }
            }

            saveFilterOptions(0)

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
                        switchChartsEntry(0)
                        break

                    case 'older':
                        switchChartsEntry(1)
                        break

                    default:
                        switchChartsEntry(0)
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
                    document.querySelector('.complete-message-analysis').classList.remove('d-none')
                    document.querySelector('.complete-message-analysis').classList.add('text-blink')
                    break

                case 'false':
                    restorePrevData()
                    document.querySelector('.complete-message-restoration').classList.remove('d-none')
                    document.querySelector('.complete-message-restoration').classList.add('text-blink')
                    break
            
                default:
                    findMissingItems()
                    analyze()
                    document.querySelector('.complete-message-initialization').classList.remove('d-none')
                    document.querySelector('.complete-message-initialization').classList.add('text-blink')
                    {
                        if (screen.width <= 375) {
                            document.querySelector('#select-disp-scale').value = '85'
                            changeDisplayScale()
                        }
                    }
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

            quitKeywordSearch()

            {
                const images = document.querySelectorAll('.image-delayed-loading')
                images.forEach(image => {
                    image.setAttribute('src', image.dataset.src)
                })
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

            if ((index < targetsLength[listIndex]) && (Number(chart[3]) > 0)) {
                tableRow.classList.add('table-targets', 'top-single-rate')
                varSingleRateLowers[listIndex] = Number(chart[6])
                varSummedRateCurrents[listIndex] += Number(chart[6])
            }

            tableRow.classList.add(`difficulty-${chart[1]}`)

            const increases = targetMultipliers.map((multiplier, buttonIndex) => {
                if (isAvailableOnOffline(chart[0])) {
                    if ((chart[5] < multiplier) && ((chart[4] * multiplier) > varSingleRateLowers[listIndex])) {
                        return `
                            <a class="badge rate-increase box-shadow-black" 
                            href="#" onclick="modifyCheckListItem(this); return false;" 
                            data-rating="${(chart[4] * multiplier).toFixed(3)}" data-now="${chart[6]}" 
                            data-query="${chart[0].replaceAll(/\'|\"|\(|\)/g, '_')} ${chart[1]} ${buttonIndex}" 
                            data-query-class="${chart[0].replaceAll(/\'|\"|\(|\)/g, '_')} ${chart[1]}"
                            data-list-index="${listIndex}" data-index="${index + 1}" data-button-index="${buttonIndex}">
                            <span class="rate-counter">+${((chart[4] * multiplier) - varSingleRateLowers[listIndex]).toFixed(3)}</span>
                            </a>
                            `.replaceAll(/(^ {28}|^\n)/gm, '').replaceAll('\n', '')
                    } else {
                        return '-'
                    }
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

            let code = `
            <td>
                <div class="list-item--small row d-xl-none d-xxl-none">
                    <div class="list-item--index-wrapper col-2">
                        <div class="list-item--index fs-4 lh-sm d-flex align-items-center">
                            <div class="list-item--index-number">${index + 1}</div>
                            <!-- rating target indicator -->
                        </div>
                    </div>
                    <div class="list-item--content-wrapper col-10">
                        <div class="list-item--top-wrapper p-0">
                            <div class="list-item--song-wrapper">
                                <div class="list-item--title-wrapper">
                                    <div class="list-item--alt-title text-dimmed small">${getEnglishTitle(chart[0])}</div>
                                    <div class="list-item--title fw-bold" data-title="${replaceHTMLCharEntities(chart[0])}">
                                        ${chart[0]}
                                        <!-- not available message -->
                                    </div>
                                </div>
                            </div>
                            <div class="list-item--artist-wrapper d-flex">
                                <div class="list-item--artist-name d-inline-flex gap-1 align-items-center small hover-trans-opacity cursor-pointer" data-artist="${replaceHTMLCharEntities(getArtistName(chart[0]))}" onclick="fillKeywordSearchInput(this.dataset.artist, ${listIndex}, false); activateKeywordSearch(this.dataset.artist, ${listIndex}, true); return false;">
                                    <div class="d-inline-flex">
                                        ${getArtistName(chart[0])}
                                    </div>
                                    <div class="d-inline-flex text-dimmed">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search small" viewBox="0 0 16 16">
                                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div class="list-item--badge-wrapper d-flex gap-1 mt-1">
                                <div class="list-item--badge-difficulty badge border ${chart[1]} ${chart[2] === 'INFERNO 15' ? 'inferno-15' : ''}" data-difficulty="${replaceHTMLCharEntities(chart[2])}">${chart[2]}</div>
                                <div class="list-item--genre badge border text-truncate">${getGenreElement(getGenre(chart[0]))}</div>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil-fill small" viewBox="0 0 16 16">
                                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="list-item--score" data-score="${chart[3]}">${chart[3]}</div>
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
                            <div class="progress" style="height: 0.25rem;">
                                <div class="progress-bar bg-lt-950${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 940000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="940000" aria-valuemax="950000"></div>
                                <div class="progress-bar bg-is-950${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 950000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="950000" aria-valuemax="960000"></div>
                                <div class="progress-bar bg-is-960${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 960000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="960000" aria-valuemax="970000"></div>
                                <div class="progress-bar bg-is-970${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 970000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="970000" aria-valuemax="980000"></div>
                                <div class="progress-bar bg-is-980${(chart[3] >= 990000) ? 'bg-ge-990' : ''}" role="progressbar" style="width: ${(chart[3] - 980000) / 10000 / 0.05}%; max-width: ${1 / 0.05}%;" aria-valuenow="${chart[3]}" aria-valuemin="980000" aria-valuemax="990000"></div>
                            </div>
                        </div>
                        <div class="list-item--bottom-wrapper row bg-black bg-opacity-25 m-0 mt-1 px-1 rounded">
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
                    <div class="list-item--index-wrapper col-1">
                        <div class="list-item--index fs-4 lh-sm d-flex align-items-center">
                            <div class="list-item--index-number">${index + 1}</div>
                            <!-- rating target indicator -->
                        </div>
                    </div>
                    <div class="list-item--content-wrapper col-11 row mb-1">
                        <div class="list-item--heading-wrapper col row sticky-column">
                            <div class="list-item--song-wrapper p-0">
                                <div class="list-item--title-wrapper">
                                    <div class="list-item--alt-title text-dimmed small">${getEnglishTitle(chart[0])}</div>
                                    <div class="list-item--title fw-bold" data-title="${replaceHTMLCharEntities(chart[0])}">
                                        ${chart[0]}
                                        <!-- not available message -->
                                    </div>
                                </div>
                                <div class="list-item--artist-wrapper d-flex">
                                    <div class="list-item--artist-name d-inline-flex gap-1 align-items-center small hover-trans-opacity cursor-pointer" data-artist="${replaceHTMLCharEntities(getArtistName(chart[0]))}" onclick="fillKeywordSearchInput(this.dataset.artist, ${listIndex}, false); activateKeywordSearch(this.dataset.artist, ${listIndex}, true); return false;">
                                        <div class="d-inline-flex">
                                            ${getArtistName(chart[0])}
                                        </div>
                                        <div class="d-inline-flex text-dimmed">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search small" viewBox="0 0 16 16">
                                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="list-item--badge-wrapper d-flex gap-1 mt-1">
                                    <div class="list-item--badge-difficulty badge border ${chart[1]} ${chart[2] === 'INFERNO 15' ? 'inferno-15' : ''}" data-difficulty="${replaceHTMLCharEntities(chart[2])}">${chart[2]}</div>
                                    <div class="list-item--genre badge border text-truncate">${getGenreElement(getGenre(chart[0]))}</div>
                                </div>
                            </div>
                        </div>
                        <div class="list-item--main-wrapper col">
                            <div class="list-item--result-wrapper row m-0">
                                <div class="list-item--score-wrapper hover-trans-opacity cursor-pointer col px-0" data-list-index="${listIndex}" data-index="${index + 1}" onclick="modifyScoreModalLauncher(this); return false;">
                                    <div class="list-item--score" data-score="${chart[3]}">${chart[3]}</div>
                                    <div class="d-flex align-items-center text-dimmed small">
                                        <div class="d-flex ms-0">
                                            <span class="lang lang-japanese">編集</span>
                                            <span class="lang lang-english d-none">Edit</span>
                                        </div>
                                        <div class="d-flex ms-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil-fill small" viewBox="0 0 16 16">
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

            {
                const target = '<!-- rating target indicator -->'
                const replace = `
                    <div class="filter-targets rounded-pill m-1">
                        <div class="d-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-check-circle fs-6" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                            </svg>
                        </div>
                    </div>`
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '')

                if (tableRow.classList.contains('table-targets')) {
                    code = code.replaceAll(target, replace)
                }
            }

            {
                const diffTime = new Date('2022-09-01T00:00:00+0900') - new Date()
                const message = [
                    {japanese: 'まもなく削除', english: 'Not Available Soon'},
                    {japanese: 'プレイ不可', english: 'Not Available'}
                ][Number(diffTime < 0)]

                const target = '<!-- not available message -->'
                const replace = `
                    <div class="badge pb-1 text-dimmed d-inline-flex gap-1">
                        <div class="d-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path>
                            </svg>
                        </div>
                        <div class="d-flex">
                            <span class="lang lang-japanese">${message.japanese}</span>
                            <span class="lang lang-english d-none">${message.english}</span>
                        </div>
                    </div>`
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '')

                if (isAvailableOnOffline(chart[0]) === false) {
                    code = code.replaceAll(target, replace)
                }
            }

            tableRow.innerHTML = code
            tableRow.setAttribute('data-list-index', listIndex)
            tableRow.setAttribute('data-index', index + 1)
            tableRow.setAttribute('data-is-targets', tableRow.classList.contains('table-targets') ? 'true' : 'false')
            tableRow.setAttribute('data-is-candidates', tableRow.classList.contains('table-candidates') ? 'true' : 'false')
            tableRow.setAttribute('data-title', chart[0])
            tableRow.setAttribute('data-alt-title', getEnglishTitle(chart[0]))
            tableRow.setAttribute('data-difficulty', chart[1])
            tableRow.setAttribute('data-level', String(chart[2]).match(/[0-9+]+/g)[0])
            tableRow.setAttribute('data-score', chart[3])
            tableRow.setAttribute('data-constant', chart[4])
            tableRow.setAttribute('data-rating', chart[6])
            tableRow.setAttribute('data-remaining-min', '')
            tableRow.setAttribute('data-offline', isAvailableOnOffline(chart[0]) ? 'yes' : 'no')

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
                    ${String(katakanaToHiragana(chart[0])).toLowerCase()} 
                    ${String(getEnglishTitle(chart[0])).toLowerCase()} 
                    ${String(katakanaToHiragana(getArtistName(chart[0]))).toLowerCase()} 
                    ${String(getEnglishArtistName(chart[0])).toLowerCase()} `
                .replaceAll(/(^ {20}|^\n)/gm, '').replaceAll('\n', '').replaceAll(/([^\s.])-([^\s.])/g, '$1$2')

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
        })

        {
            const tempRow = document.createElement('tr')
            const tableRow = scoresTables[listIndex].appendChild(tempRow)
            const alert = `
            <td>
                <div class="list-item--alert d-flex justify-content-start align-items-start gap-1 m-1">
                    <div class="svg-wrapper d-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle fs-3" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                        </svg>
                    </div>
                    <div class="d-flex vstack gap-1">
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
                <div class="list-item--alert d-flex justify-content-start align-items-start gap-1 m-1">
                    <div class="svg-wrapper d-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle fs-3" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                        </svg>
                    </div>
                    <div class="d-flex vstack gap-1">
                        <div class="d-flex small">
                            <span class="lang lang-japanese">${['「新曲枠」', '「旧曲枠」'][listIndex]}のチェックリストに項目がありません。</span>
                            <span class="lang lang-english d-none">No items added to ${['"Newer Charts"', '"Older Charts"'][listIndex]} checklist.</span>
                        </div>
                        <div class="d-flex small">
                            <span class="lang lang-japanese">項目を追加するには、挑戦したいスコアボーダーに表示されている<span class="badge bg-white align-bottom text-black mx-1">+0.000</span>を押します。</span>
                            <span class="lang lang-english d-none">To add an item to the checklist, press <span class="badge bg-white align-bottom text-black mx-1">+0.000</span> indicated on any score border you wish to challenge.</span>
                        </div>
                        <div class="d-flex">
                            <button type="button" class="btn btn-sm btn-white me-0" onclick="refreshChartList();">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"></path>
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
                                </svg>
                                <span class="lang lang-japanese d-none">終了</span>
                                <span class="lang lang-english">Exit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </td>`
            .replaceAll(/(^ {16}|^\n)/gm, '')

            tableRow.innerHTML = alert
            tableRow.classList.add('chart-list--alert', 'chart-list--alert-check', 'd-none')
        }

        {
            const tempRow = document.createElement('tr')
            const tableRow = scoresTables[listIndex].appendChild(tempRow)
            const alert = `
            <td>
                <div class="list-item--alert d-flex justify-content-start align-items-start gap-1 m-1">
                    <div class="svg-wrapper d-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle fs-3" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                        </svg>
                    </div>
                    <div class="d-flex vstack gap-1">
                        <div class="d-flex small">
                            <span class="lang lang-japanese">キーワードに一致する曲が見つかりません。</span>
                            <span class="lang lang-english d-none">There are no songs matching the keyword(s).</span>
                        </div>
                        <div class="d-flex small">
                            <span class="lang lang-japanese">他のキーワードを入力するか、枠を切り替えてみてください。</span>
                            <span class="lang lang-english d-none">Please type other keyword(s) or switch chart entries.</span>
                        </div>
                        <div class="d-flex">
                            <button type="button" class="btn btn-sm btn-white me-0" onclick="quitKeywordSearch(${listIndex});">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"></path>
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
                                </svg>
                                <span class="lang lang-japanese d-none">クリア</span>
                                <span class="lang lang-english">Clear</span>
                            </button>
                        </div>
                    </div>
                </div>
            </td>`
            .replaceAll(/(^ {16}|^\n)/gm, '')

            tableRow.innerHTML = alert
            tableRow.classList.add('chart-list--alert', 'chart-list--alert-search', 'd-none')
        }

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

        if (localStorage.getItem('rating-analyzer-artist-name') !== 'true') {
            setDisplayNone('.list-item--artist-name', true)
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

    if (localStorage.getItem('rating-analyzer-prev') !== playdata.value) {
        localStorage.setItem('rating-analyzer-prev', playdata.value)

        if (document.querySelectorAll('.missing-items-list > div').length === 0) {
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
            localStorage.setItem('rating-analyzer-prev-date', formattedDate)
        }
    }

    {
        const timeStamps = document.querySelectorAll('.prev-date-timestamp')
        timeStamps.forEach(stamp => stamp.textContent = localStorage.getItem('rating-analyzer-prev-date'))
    }

    refreshChartList()

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

    {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
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

    setDisplayNone(['.chart-list-control--check-list-active', '.chart-list-control--title-search-active'], false)

    {
        const filters = document.querySelectorAll('.chart-list-control--score-filter')
        filters.forEach(filter => {
            filter.classList.remove('pe-none', 'opacity-25')
        })
    }

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

    {
        setDisplayNone('.check-list-viewer-menu', true)
        setDisplayNone('.check-list-viewer-menu-off', false)
    }
}

// Show only charts that have been added to the checklist
function activateChecklistViewer() {
    const rows = document.querySelectorAll('tr.chart-list--item')

    if (rows.length === 0) {
        return
    }

    if (localStorage.getItem('rating-analyzer-charts-entry') === 'newer') {
        quitKeywordSearch(0, false)
    } else {
        quitKeywordSearch(1, false)
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

    setDisplayNone('.chart-list-control--title-search-active', true)
    setDisplayNone('.chart-list-control--check-list-active', false)

    {
        const filters = document.querySelectorAll('.chart-list-control--score-filter')
        filters.forEach(filter => {
            filter.classList.add('pe-none', 'opacity-25')
        })
    }

    {
        setDisplayNone('.check-list-viewer-menu', true)
        setDisplayNone('.check-list-viewer-menu-on', false)
    }

    scrollToActiveChartList()
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
        const toggles = document.querySelectorAll(`.${className}-toggle`)
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

    // [DEBUG] FOR DEBUGGING USE ONLY
    location.reload()

    // location.href = 'https://bit.ly/3tiGGDb'
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
    const indexes = {
        'title':                songs[0].indexOf('@song-title'),
        'title-english':        songs[0].indexOf('@song-title-english'),
        'artist':               songs[0].indexOf('@artist-name'),
        'artist-english':       songs[0].indexOf('@artist-name-english'),
        'genre':                songs[0].indexOf('@genre'),
        'available-on-offline': songs[0].indexOf('@available-on-offline'),
        'normal-level':         songs[0].indexOf('@normal-level'),
        'normal-constant':      songs[0].indexOf('@normal-constant'),
        'normal-newer':         songs[0].indexOf('@normal-newer'),
        'hard-level':           songs[0].indexOf('@hard-level'),
        'hard-constant':        songs[0].indexOf('@hard-constant'),
        'hard-newer':           songs[0].indexOf('@hard-newer'),
        'expert-level':         songs[0].indexOf('@expert-level'),
        'expert-constant':      songs[0].indexOf('@expert-constant'),
        'expert-newer':         songs[0].indexOf('@expert-newer'),
        'inferno-level':        songs[0].indexOf('@inferno-level'),
        'inferno-constant':     songs[0].indexOf('@inferno-constant'),
        'inferno-newer':        songs[0].indexOf('@inferno-newer')
    }

    if (Object.values(indexes).includes(-1)) {
        window.alert('ERROR: There is missing data in the dataset.')
    }

    return indexes
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

// Get the artist name from the original song title
function getArtistName(songTitle) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            return song[indexes['artist']]
        }
    }
}

// Get the artist name in English from the original song title
function getEnglishArtistName(songTitle) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            return song[indexes['artist-english']]
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

// Check if the chart is available on online
function isAvailableOnOffline(songTitle) {
    const songs = getChartTable()
    const indexes = getDatasetIndex()
    
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]

        if (song[indexes['title']] == songTitle) {
            return song[indexes['available-on-offline']]
        }
    }
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
    refreshChartList()
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

    {
        const inputs = document.querySelectorAll('.placeholder-lang')

        inputs.forEach(input => {
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
    }

    {
        const tooltips = document.querySelectorAll('.tooltip-lang')

        tooltips.forEach(input => {
            const attr = input.getAttribute(`data-tooltip-${language}`)
            if (attr !== null) {
                input.setAttribute('title', attr)
            } else {
                const engAttr = input.getAttribute('data-tooltip-english')
                if (engAttr !== null) {
                    input.setAttribute('title', engAttr)
                }
            }
        })

        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    }

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
 * @param {Number} index 
 * @returns {Boolean}
 */
function switchChartsEntry(index = -1) {
    if (index === -1) {
        return false
    }

    const entries = document.querySelectorAll('.box-entry')
    const entry = entries[index]
    const scrollY = window.scrollY

    entries.forEach(entry => entry.classList.add('d-none'))
    entry.classList.remove('d-none')

    window.scroll(0, scrollY)

    const entryNames = ['newer', 'older']
    localStorage.setItem('rating-analyzer-charts-entry', entryNames[index])

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

    {
        const inputs = document.querySelectorAll('.input-keyword-search')
        inputs[index].value = inputs[Number(!index)].value

        if (String(inputs[index].value).length !== 0) {
            activateKeywordSearch(inputs[index].value, index)
        }
    }
}

function scrollToActiveChartList() {
    const scrollTargets = document.querySelectorAll('.chart-list-control--display-options-wrapper')
    const header = document.querySelectorAll('.charts-entry--header')

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
    const sourceTitle = sourceItem.querySelector('.list-item--title').dataset.title
    const sourceDifficulty = sourceItem.querySelector('.list-item--badge-difficulty').dataset.difficulty
    const sourceScore = sourceItem.querySelector('.list-item--score').dataset.score
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
        alert.click()
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

function activateKeywordSearch(keyword = null, index = null, scroll = false) {
    if ([keyword, index].indexOf(null) !== -1) {
        return false
    }

    const keywords = katakanaToHiragana(String(keyword).replaceAll(/\s/g, ' ').toLowerCase()).split(' ')
    const list = document.querySelectorAll('.chart-list')[index]
    const rows = list.querySelectorAll('tr.chart-list--item')

    if (rows.length === 0) {
        return
    }

    if (String(keyword).length === 0) {
        quitKeywordSearch(index, false)
        return
    }

    refreshChartList()

    rows.forEach(row => {
        row.classList.remove('d-none')
        keywords.forEach(key => {
            if (row.dataset.searchText.indexOf(key) === -1) {
                row.classList.add('d-none')
            }
        })
    })

    setDisplayNone('.chart-list-control--check-list-active', true)
    setDisplayNone('.chart-list-control--title-search-active', false)

    {
        const entry = document.querySelectorAll('.box-entry')[index]
        entry.querySelectorAll('.scoresTable tr.chart-list--alert').forEach(alert => alert.classList.add('d-none'))

        const rows = entry.querySelectorAll('.scoresTable tr.chart-list--item:not(.d-none)')
        const alert = entry.querySelector('.scoresTable tr.chart-list--alert-search')

        if (rows.length === 0) {
            alert.classList.remove('d-none')
        }
    }

    {
        const filters = document.querySelectorAll('.chart-list-control--score-filter')
        filters.forEach(filter => {
            filter.classList.add('pe-none', 'opacity-25')
        })
    }

    if (scroll === true) {
        const wrapper = document.querySelectorAll('.chart-list-control--others-filter')
        wrapper[index].scrollIntoView()
    }
}

function quitKeywordSearch(index = null, focus = true) {
    if (index === null) {
        return false
    }

    const input = document.querySelectorAll('.input-keyword-search')[index]
    input.value = ''

    setDisplayNone('.chart-list-control--title-search-active', true)

    refreshChartList()

    if (focus === true) {
        input.focus()
    }
}

function refreshChartList() {
    const items = document.querySelectorAll('tr.chart-list--item')
    items.forEach(item => {
        item.classList.remove('d-none')
    })

    items.forEach(item => {
        {
            const favorite = String(localStorage.getItem('rating-analyzer-type-filter'))
            const isTargets = String(item.dataset.isTargets)
            const isCandidates = String(item.dataset.isCandidates)

            if ((favorite.includes('targets')) && (favorite.includes('candidates') === false)) {
                if (isTargets === 'false') {
                    item.classList.add('d-none')
                }
            } else {
                if (favorite.includes('targets') === false) {
                    if (isTargets === 'true') {
                        item.classList.add('d-none')
                    }
                }

                if (favorite.includes('candidates') === false) {
                    if (isCandidates === 'true') {
                        item.classList.add('d-none')
                    }
                }
            }

            if (favorite.includes('others') === false) {
                if ((isTargets === 'false') &&
                    (isCandidates === 'false')) {
                    item.classList.add('d-none')
                }
            }
        }

        {
            const favorite = String(localStorage.getItem('rating-analyzer-difficulty-filter'))
            const difficulties = ['normal', 'hard', 'expert', 'inferno']
            
            difficulties.forEach(difficulty => {
                if (favorite.indexOf(difficulty) === -1) {
                    if (String(item.dataset.difficulty).toLowerCase().indexOf(difficulty) !== -1) {
                        item.classList.add('d-none')
                    }
                }
            })
            
        }

        {
            const favorite = String(localStorage.getItem('rating-analyzer-level-filter'))
            const levels = ['15', '14', '13+', '13', '12+', '12', '11+', '11', '10+', '10', 'lower']
            
            levels.forEach(level => {
                if (favorite.split(',').indexOf(level) === -1) {
                    if (level === 'lower') {
                        if (Number(item.dataset.constant) < 10) {
                            item.classList.add('d-none')
                        }
                    } else {
                        if (String(item.dataset.level) === level) {
                            item.classList.add('d-none')
                        }
                    }
                }
            })
        }

        {
            const favoriteOpts = String(localStorage.getItem('rating-analyzer-score-filter')).split(',')
            const minScoreEnabled = favoriteOpts[0]
            const minScore = favoriteOpts[1]
            const maxScoreEnabled = favoriteOpts[2]
            const maxScore = favoriteOpts[3]
            const remainingScoreEnabled = favoriteOpts[4]
            const remainingScore = favoriteOpts[5]

            
            if (minScoreEnabled === 'true') {
                if (Number(item.dataset.score) < Number(minScore)) {
                    item.classList.add('d-none')
                }
            }

            if (maxScoreEnabled === 'true') {
                if (Number(item.dataset.score) > Number(maxScore)) {
                    item.classList.add('d-none')
                }
            }

            if (remainingScoreEnabled === 'true') {
                if (Number(item.dataset.remainingMin) > Number(remainingScore)) {
                    item.classList.add('d-none')
                }
                if (item.dataset.remainingMin === '') {
                    item.classList.add('d-none')
                }
            }
        }

        {
            const favorite = String(localStorage.getItem('rating-analyzer-offline-filter'))
            const ables = ['yes', 'no']
            
            ables.forEach(able => {
                if (favorite.split(',').indexOf(able) === -1) {
                    if (String(item.dataset.offline) === able) {
                        item.classList.add('d-none')
                    }
                }
            })
        }
    })

    setDisplayNone(['.chart-list-control--check-list-active', 'chart-list-control--title-search-active'], true)

    {
        const filters = document.querySelectorAll('.chart-list-control--score-filter')
        filters.forEach(filter => {
            filter.classList.remove('pe-none', 'opacity-25')
        })
    }

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

    {
        setDisplayNone('.check-list-viewer-menu', true)
        setDisplayNone('.check-list-viewer-menu-off', false)
    }
}

function applyFilterOptions(index) {
    saveFilterOptions(index)
    refreshChartList()
}

function switchChildrenToggles(index, parentsSelector, childrenSelector) {
    const parents = document.querySelectorAll(parentsSelector)
    const children = document.querySelectorAll(childrenSelector)

    if (parents[index].checked === true) {
        children.forEach(child => child.checked = true)
    }

    if (parents[index].checked === false) {
        children.forEach(child => child.checked = false)
    }

    applyFilterOptions(index)
}

function saveFilterOptions(index) {
    {
        const types = ['targets', 'candidates', 'others']
        const favorites = types.filter(type => {
            const toggles = document.querySelectorAll(`.type-filter-toggle-${type}`)
            toggles[Number(!index)].checked = toggles[index].checked
            return (toggles[index].checked === true)
        })
        localStorage.setItem('rating-analyzer-type-filter', favorites.join(','))
    }

    {
        const difficulties = ['normal', 'hard', 'expert', 'inferno']
        const favorites = difficulties.filter(difficulty => {
            const toggles = document.querySelectorAll(`.difficulty-filter-toggle-${difficulty}`)
            toggles[Number(!index)].checked = toggles[index].checked
            return (toggles[index].checked === true)
        })
        localStorage.setItem('rating-analyzer-difficulty-filter', favorites.join(','))
    }

    {
        const levels = ['15', '14', '13+', '13', '12+', '12', '11+', '11', '10+', '10', 'lower']
        const favorites = levels.filter(level => {
            const toggles = document.querySelectorAll(`.level-filter-toggle-${String(level).replace('+', 'plus')}`)
            toggles[Number(!index)].checked = toggles[index].checked
            return (toggles[index].checked === true)
        })
        localStorage.setItem('rating-analyzer-level-filter', favorites.join(','))

        const allToggles = document.querySelectorAll('.level-filter-toggle-all')

        if (levels.join(',') === favorites.join(',')) {
            allToggles.forEach(toggle => {
                toggle.indeterminate = false
                toggle.checked = true
            })
        }

        if (levels.join(',') !== favorites.join(',') && favorites.join(',') !== '') {
            allToggles.forEach(toggle => {
                toggle.indeterminate = true
                toggle.checked = true
            })
        }

        if (favorites.join(',') === '') {
            allToggles.forEach(toggle => {
                toggle.indeterminate = false
                toggle.checked = false
            })
        }
    }

    {
        const minScoreToggle = document.querySelectorAll('.score-filter-min-toggle')
        const minScoreSelect = document.querySelectorAll('.score-filter-min-select')
        const maxScoreToggle = document.querySelectorAll('.score-filter-max-toggle')
        const maxScoreSelect = document.querySelectorAll('.score-filter-max-select')
        const remainingScoreToggle = document.querySelectorAll('.remaining-score-filter-toggle')
        const remainingScoreSelect = document.querySelectorAll('.remaining-score-filter-select')

        minScoreToggle[Number(!index)].checked = minScoreToggle[index].checked
        minScoreSelect[Number(!index)].value = minScoreSelect[index].value
        maxScoreToggle[Number(!index)].checked = maxScoreToggle[index].checked
        maxScoreSelect[Number(!index)].value = maxScoreSelect[index].value
        remainingScoreToggle[Number(!index)].checked = remainingScoreToggle[index].checked
        remainingScoreSelect[Number(!index)].value = remainingScoreSelect[index].value

        const favorite = [
            minScoreToggle[index].checked,
            minScoreSelect[index].value,
            maxScoreToggle[index].checked,
            maxScoreSelect[index].value,
            remainingScoreToggle[index].checked,
            remainingScoreSelect[index].value
        ].join(',')

        localStorage.setItem('rating-analyzer-score-filter', favorite)
    }

    {
        const ables = ['yes', 'no']
        const favorites = ables.filter(able => {
            const toggles = document.querySelectorAll(`.offline-filter-toggle-${able}`)
            toggles[Number(!index)].checked = toggles[index].checked
            return (toggles[index].checked === true)
        })

        localStorage.setItem('rating-analyzer-offline-filter', favorites.join(','))
    }
}

function katakanaToHiragana(value) {
    return value.replace(/[\u30a1-\u30f6]/g, match => {
        const char = match.charCodeAt(0) - 0x60
        return String.fromCharCode(char)
    })
}

function fillKeywordSearchInput(keyword = null, index = null, focus = true) {
    if (index === null || keyword === null) {
        return false
    }

    const input = document.querySelectorAll('.input-keyword-search')[index]
    input.value = String(keyword)

    if (focus === true) {
        input.focus()
    }
}

function replaceHTMLCharEntities(value){
    if (typeof value !== 'string') {
        return value
    }

    return value.replace(/[&'`"<>]/g, match => {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&apos;'
        }[match]
    })
}