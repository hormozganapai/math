// js/levels.js

const LevelManager = {
    renderLevel(levelData, game) {
        const content = document.getElementById('level-content');
        content.innerHTML = '';
        const submitBtn = document.getElementById('btn-submit');
        const hintBtn = document.getElementById('btn-hint');

        // Setup hint button
        hintBtn.onclick = () => {
            if (levelData.hints && levelData.hints.length > game.hintsUsed) {
                UI.showToast(`راهنمایی: ${levelData.hints[game.hintsUsed]}`, 'warning');
                game.hintsUsed++;
            } else {
                UI.showToast('راهنمایی دیگری وجود ندارد!', 'error');
            }
        };

        // Render based on type
        switch (levelData.type) {
            case 'count':
                this.renderCountLevel(levelData, content, submitBtn, game);
                break;
            case 'input_sequence':
                this.renderInputSequence(levelData, content, submitBtn, game);
                break;
            case 'sort':
                this.renderSortLevel(levelData, content, submitBtn, game);
                break;
            case 'table_frequency':
                this.renderTableLevel(levelData, content, submitBtn, game);
                break;
            case 'bar_chart_builder':
                this.renderChartBuilderLevel(levelData, content, submitBtn, game);
                break;
            case 'calculate_mean':
                this.renderMeanLevel(levelData, content, submitBtn, game);
                break;
            case 'find_median':
                this.renderMedianLevel(levelData, content, submitBtn, game);
                break;
            case 'find_mode':
                this.renderModeLevel(levelData, content, submitBtn, game);
                break;
            case 'chart_analysis':
                this.renderAnalysisLevel(levelData, content, submitBtn, game);
                break;
        }
    },

    // 1. Count
    renderCountLevel(levelData, container, submitBtn, game) {
        const cardsDiv = document.createElement('div');
        levelData.data.forEach(item => {
            const span = document.createElement('span');
            span.className = 'data-card';
            span.textContent = item;
            cardsDiv.appendChild(span);
        });

        const inputDiv = document.createElement('div');
        inputDiv.style.marginTop = '20px';
        inputDiv.innerHTML = `<label>چند بار رنگ "${levelData.target}" تکرار شده است؟ </label><input type="number" id="level-input" class="lab-controls">`;

        container.appendChild(cardsDiv);
        container.appendChild(inputDiv);

        submitBtn.onclick = () => {
            const val = parseInt(document.getElementById('level-input').value);
            if (val === levelData.correctAnswer) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer(`دوباره با دقت بشمار. تعداد "${levelData.target}" چند تاست؟`);
            }
        };
    },

    // 2. Input Sequence
    renderInputSequence(levelData, container, submitBtn, game) {
        const collectedData = [];
        container.innerHTML = `
            <div class="lab-controls">
                <input type="number" id="seq-input" placeholder="عدد...">
                <button id="btn-seq-add" class="btn primary">➕ افزودن داده</button>
            </div>
            <div id="seq-list" class="drop-zone" style="margin-top:20px;"></div>
        `;

        document.getElementById('btn-seq-add').onclick = () => {
            const val = parseInt(document.getElementById('seq-input').value);
            if (!isNaN(val)) {
                collectedData.push(val);
                const span = document.createElement('span');
                span.className = 'data-card';
                span.textContent = val;
                document.getElementById('seq-list').appendChild(span);
                document.getElementById('seq-input').value = '';
            }
        };

        submitBtn.onclick = () => {
            if (JSON.stringify(collectedData) === JSON.stringify(levelData.targetData)) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("داده‌ها دقیقاً مطابق الگو وارد نشده‌اند. با دقت اعداد را به ترتیب وارد کن.");
            }
        };
    },

    // 3. Sort (Drag & Drop)
    renderSortLevel(levelData, container, submitBtn, game) {
        const sourceZone = document.createElement('div');
        sourceZone.className = 'drop-zone';
        sourceZone.id = 'sort-source';
        sourceZone.innerHTML = '<h3>داده‌های نامرتب</h3>';

        const targetZone = document.createElement('div');
        targetZone.className = 'drop-zone';
        targetZone.id = 'sort-target';
        targetZone.innerHTML = '<h3>اینجا از کوچک به بزرگ مرتب کن</h3>';
        targetZone.style.minHeight = '80px';
        targetZone.style.borderColor = 'var(--primary-color)';

        // Shuffle
        const shuffled = Utils.shuffleArray(levelData.data);

        shuffled.forEach(val => {
            const el = document.createElement('div');
            el.className = 'data-card';
            el.textContent = val;
            el.draggable = true;

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', val);
                el.classList.add('dragging');
                setTimeout(() => el.style.display = 'none', 0);
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                el.style.display = 'inline-block';
            });

            sourceZone.appendChild(el);
        });

        const setupDropZone = (zone) => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                if (dragging) {
                    zone.appendChild(dragging);
                }
            });
        };

        setupDropZone(sourceZone);
        setupDropZone(targetZone);

        container.appendChild(sourceZone);
        container.appendChild(targetZone);

        submitBtn.onclick = () => {
            const cards = targetZone.querySelectorAll('.data-card');
            const userArr = Array.from(cards).map(c => parseInt(c.textContent));
            const sortedArr = Utils.sortAscending(levelData.data);

            if (userArr.length === levelData.data.length && JSON.stringify(userArr) === JSON.stringify(sortedArr)) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("داده‌ها به درستی از کوچک به بزرگ مرتب نشده‌اند.");
            }
        };
    },

    // 4. Table Frequency
    renderTableLevel(levelData, container, submitBtn, game) {
        const rawDataBox = document.createElement('div');
        rawDataBox.className = 'tutorial-box';
        rawDataBox.innerHTML = `<strong>داده‌های خام:</strong> ${levelData.data.join(' ، ')}`;
        container.appendChild(rawDataBox);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.marginTop = '20px';
        table.style.borderCollapse = 'collapse';

        let html = `<tr><th style="border:1px solid #ccc; padding:10px;">دسته</th><th style="border:1px solid #ccc; padding:10px;">فراوانی (تعداد)</th></tr>`;

        levelData.targets.forEach((t, i) => {
            html += `<tr>
                <td style="border:1px solid #ccc; padding:10px; text-align:center;">${t}</td>
                <td style="border:1px solid #ccc; padding:10px; text-align:center;">
                    <input type="number" id="freq-${i}" style="width:60px; padding:5px;">
                </td>
            </tr>`;
        });

        table.innerHTML = html;
        container.appendChild(table);

        submitBtn.onclick = () => {
            let correct = true;
            levelData.correctAnswers.forEach((ans, i) => {
                const val = parseInt(document.getElementById(`freq-${i}`).value);
                if (val !== ans) correct = false;
            });

            if (correct) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("تعداد فراوانی‌ها با هم همخوانی ندارند. با دقت بشمار.");
            }
        };
    },

    // 5. Chart Builder
    renderChartBuilderLevel(levelData, container, submitBtn, game) {
        const info = document.createElement('div');
        info.innerHTML = `<h3>اطلاعات جدول:</h3>`;
        for(let key in levelData.data) {
            info.innerHTML += `<span>${key}: ${levelData.data[key]} | </span>`;
        }
        container.appendChild(info);

        const chartArea = document.createElement('div');
        chartArea.style.display = 'flex';
        chartArea.style.justifyContent = 'space-around';
        chartArea.style.alignItems = 'flex-end';
        chartArea.style.height = '250px';
        chartArea.style.borderBottom = '2px solid #333';
        chartArea.style.borderLeft = '2px solid #333';
        chartArea.style.marginTop = '30px';
        chartArea.style.padding = '10px';

        const inputs = {};

        Object.keys(levelData.data).forEach(key => {
            const colWrap = document.createElement('div');
            colWrap.style.display = 'flex';
            colWrap.style.flexDirection = 'column';
            colWrap.style.alignItems = 'center';
            colWrap.style.width = '30%';

            const bar = document.createElement('div');
            bar.style.width = '100%';
            bar.style.backgroundColor = 'var(--primary-color)';
            bar.style.height = '0px';
            bar.style.transition = 'height 0.3s';

            const controls = document.createElement('div');
            controls.innerHTML = `
                <button class="btn small" onclick="changeHeight('${key}', 1)">+</button>
                <span id="val-${key}">0</span>
                <button class="btn small" onclick="changeHeight('${key}', -1)">-</button>
                <div>${key}</div>
            `;

            inputs[key] = 0;

            window.changeHeight = (k, diff) => {
                inputs[k] = Math.max(0, inputs[k] + diff);
                document.getElementById(`val-${k}`).textContent = inputs[k];
                // Assuming max value is around 10 for scaling
                document.getElementById(`bar-${k}`).style.height = `${inputs[k] * 20}px`;
            };

            bar.id = `bar-${key}`;
            colWrap.appendChild(bar);
            colWrap.appendChild(controls);
            chartArea.appendChild(colWrap);
        });

        container.appendChild(chartArea);

        submitBtn.onclick = () => {
            let correct = true;
            for(let key in levelData.data) {
                if (inputs[key] !== levelData.data[key]) correct = false;
            }

            if (correct) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("ارتفاع ستون‌ها با مقادیر جدول برابر نیست.");
            }
            // Cleanup global func
            delete window.changeHeight;
        };
    },

    // 6. Mean Center
    renderMeanLevel(levelData, container, submitBtn, game) {
        const box = document.createElement('div');
        box.innerHTML = `<p>اعداد: ${levelData.data.join(' ، ')}</p>
                         <p>مجموع اعداد: <input type="number" id="mean-sum" class="lab-controls" style="width:60px"></p>
                         <p>تعداد اعداد: <input type="number" id="mean-count" class="lab-controls" style="width:60px"></p>
                         <p>میانگین: <input type="number" id="mean-ans" class="lab-controls" style="width:60px"></p>`;
        container.appendChild(box);

        submitBtn.onclick = () => {
            const sum = parseInt(document.getElementById('mean-sum').value);
            const count = parseInt(document.getElementById('mean-count').value);
            const ans = parseInt(document.getElementById('mean-ans').value);

            const actualSum = Utils.getSum(levelData.data);
            const actualCount = levelData.data.length;
            const actualMean = levelData.correctAnswer;

            if (sum === actualSum && count === actualCount && ans === actualMean) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("ابتدا مجموع را درست حساب کن، سپس بر تعداد تقسیم کن.");
            }
        };
    },

    // 7. Median Square
    renderMedianLevel(levelData, container, submitBtn, game) {
        const box = document.createElement('div');
        box.innerHTML = `<p>داده‌های نامرتب: ${levelData.data.join(' ، ')}</p>
                         <p>۱. داده‌ها را مرتب کن (با کاما جدا کن): <input type="text" id="med-sort" class="lab-controls"></p>
                         <p>۲. میانه (عدد وسط) کدام است؟ <input type="number" id="med-ans" class="lab-controls" style="width:60px"></p>`;
        container.appendChild(box);

        submitBtn.onclick = () => {
            const sortedInput = document.getElementById('med-sort').value.split(',').map(s => parseInt(s.trim()));
            const ans = parseInt(document.getElementById('med-ans').value);

            const actualSorted = Utils.sortAscending(levelData.data);
            const isSortedCorrect = JSON.stringify(sortedInput) === JSON.stringify(actualSorted);

            if (isSortedCorrect && ans === levelData.correctAnswer) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("مطمئن شو داده‌ها را درست مرتب کرده‌ای و دقیقاً عدد وسط را انتخاب کرده‌ای.");
            }
        };
    },

    // 8. Mode Square
    renderModeLevel(levelData, container, submitBtn, game) {
        const box = document.createElement('div');
        box.innerHTML = `<p>داده‌ها: ${levelData.data.join(' ، ')}</p>
                         <p>نما (پرتکرارترین داده) کدام است؟ <input type="number" id="mode-ans" class="lab-controls" style="width:60px"></p>`;
        container.appendChild(box);

        submitBtn.onclick = () => {
            const ans = parseInt(document.getElementById('mode-ans').value);
            if (ans === levelData.correctAnswer) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("کدام عدد بیشتر از همه تکرار شده است؟ با دقت نگاه کن.");
            }
        };
    },

    // 9. Analysis Center
    renderAnalysisLevel(levelData, container, submitBtn, game) {
        const canvas = document.createElement('canvas');
        canvas.id = 'analysis-chart';
        canvas.width = 400;
        canvas.height = 200;
        container.appendChild(canvas);

        // Need to draw chart after it's in DOM
        setTimeout(() => Utils.drawBarChart('analysis-chart', levelData.labels, levelData.data), 100);

        const qBox = document.createElement('div');
        qBox.style.marginTop = '20px';
        qBox.innerHTML = `<h3>${levelData.question}</h3>`;

        const select = document.createElement('select');
        select.id = 'analysis-ans';
        select.className = 'lab-controls';
        select.style.padding = '10px';
        levelData.options.forEach(opt => {
            select.innerHTML += `<option value="${opt}">${opt}</option>`;
        });

        qBox.appendChild(select);
        container.appendChild(qBox);

        submitBtn.onclick = () => {
            const ans = document.getElementById('analysis-ans').value;
            if (ans === levelData.correctAnswer) {
                game.handleCorrectAnswer();
            } else {
                game.handleWrongAnswer("به نمودار دقت کن، ستون‌ها نشان‌دهنده مقدار فروش در هر روز هستند.");
            }
        };
    },

    // 10. Boss Battle
    startBossBattle(game) {
        const container = document.getElementById('boss-question-container');
        const hpBar = document.getElementById('boss-hp');
        const missionsLabel = document.getElementById('boss-missions');

        // Shuffle questions
        const questions = Utils.shuffleArray(GameData.bossQuestions).slice(0, 10);
        let currentQIndex = 0;

        const renderQuestion = () => {
            if (currentQIndex >= 10) {
                // Victory
                game.state.unlockedLevels = 11; // ensure unlocked logic is fine
                game.showVictory();
                return;
            }

            const q = questions[currentQIndex];
            container.innerHTML = `
                <div class="tutorial-box" style="margin-top:20px;">
                    <h3>مأموریت ${currentQIndex + 1} از 10</h3>
                    <p style="font-size:18px;">${q.q}</p>
                    <input type="text" id="boss-ans" class="lab-controls" style="margin-top:10px;">
                    <br><br>
                    <button id="btn-boss-submit" class="btn primary">حمله! 🗡️</button>
                </div>
            `;

            document.getElementById('btn-boss-submit').onclick = () => {
                const ans = document.getElementById('boss-ans').value.trim();
                if (ans === q.a) {
                    game.playSound('success');
                    UI.showToast('پاسخ صحیح! رئیس ضعیف شد.', 'success');
                    game.score += 15;
                    game.totalCorrect++;
                    currentQIndex++;
                    hpBar.value = 100 - (currentQIndex * 10);
                    missionsLabel.textContent = `${currentQIndex}/10`;
                    renderQuestion();
                } else {
                    game.handleWrongAnswer("اشتباه بود! رئیس مقاومت کرد. دوباره تلاش کن.");
                }
            };
        };

        hpBar.value = 100;
        missionsLabel.textContent = '0/10';
        renderQuestion();
    }
};