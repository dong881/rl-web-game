/**
 * 強化學習代理 - 使用 Q-Learning 演算法
 * @class RLAgent
 */
class RLAgent {
    /**
     * @param {Object} [config] - 可選的配置參數
     * @param {number} [config.learningRate=0.1] - 學習率
     * @param {number} [config.discountFactor=0.9] - 折扣因子
     * @param {number} [config.explorationRate=1.0] - 初始探索率
     * @param {number} [config.explorationDecay=0.999] - 探索率衰減
     * @param {number} [config.minExplorationRate=0.1] - 最小探索率
     * @param {number} [config.actionCount=4] - 可執行的動作數量
     */
    constructor(config = {}) {
        this.qTable = {};
        this.learningRate = config.learningRate || 0.1;
        this.discountFactor = config.discountFactor || 0.9;
        this.explorationRate = config.explorationRate || 1.0;
        this.explorationDecay = config.explorationDecay || 0.999;
        this.minExplorationRate = config.minExplorationRate || 0.1;
        this.actionCount = config.actionCount || 4;
        this.episodeCount = 0;
        this.totalSteps = 0;
    }

    /**
     * 初始化指定狀態的 Q 值
     * @param {string} state - 狀態字串
     * @returns {number[]} Q 值陣列
     */
    _initState(state) {
        if (!this.qTable[state]) {
            this.qTable[state] = new Array(this.actionCount).fill(0);
        }
        return this.qTable[state];
    }

    /**
     * 根據 epsilon-greedy 策略選擇動作
     * @param {string} state - 當前狀態
     * @returns {number} 動作索引
     */
    getAction(state) {
        if (Math.random() < this.explorationRate) {
            return Math.floor(Math.random() * this.actionCount);
        }
        return this.getBestAction(state);
    }

    /**
     * 取得最佳動作（最高 Q 值）
     * @param {string} state - 當前狀態
     * @returns {number} 最佳動作索引
     */
    getBestAction(state) {
        const qValues = this._initState(state);
        let bestIndex = 0;
        let bestValue = qValues[0];
        for (let i = 1; i < qValues.length; i++) {
            if (qValues[i] > bestValue) {
                bestValue = qValues[i];
                bestIndex = i;
            }
        }
        return bestIndex;
    }

    /**
     * 更新 Q 值（Q-Learning 更新規則）
     * @param {string} state - 當前狀態
     * @param {number} action - 執行的動作
     * @param {number} reward - 獲得的獎勵
     * @param {string} nextState - 下一個狀態
     */
    updateQValue(state, action, reward, nextState) {
        const qValues = this._initState(state);
        const nextQValues = this._initState(nextState);

        let nextMax = nextQValues[0];
        for (let i = 1; i < nextQValues.length; i++) {
            if (nextQValues[i] > nextMax) {
                nextMax = nextQValues[i];
            }
        }

        qValues[action] += this.learningRate * (reward + this.discountFactor * nextMax - qValues[action]);
        this.totalSteps++;

        this.explorationRate = Math.max(
            this.minExplorationRate,
            this.explorationRate * this.explorationDecay
        );
    }

    /** 增加回合計數 */
    incrementEpisode() {
        this.episodeCount++;
    }

    /** 重置探索率（用於重新訓練） */
    resetExploration() {
        this.explorationRate = 1.0;
        this.episodeCount = 0;
        this.totalSteps = 0;
    }

    /**
     * 取得 Q 表的狀態數量
     * @returns {number} 已知狀態數量
     */
    getStateCount() {
        return Object.keys(this.qTable).length;
    }

    /**
     * 保存 Q 表為 JSON 文件
     */
    saveQTable() {
        const exportData = {
            qTable: this.qTable,
            metadata: {
                episodeCount: this.episodeCount,
                totalSteps: this.totalSteps,
                explorationRate: this.explorationRate,
                stateCount: this.getStateCount(),
                savedAt: new Date().toISOString()
            }
        };
        const dataStr = JSON.stringify(exportData);
        const currentTime = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = 'qtable_' + currentTime + '.json';
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        // 釋放 Object URL 避免記憶體洩漏
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    /**
     * 從 JSON 字串載入 Q 表
     * @param {string} jsonData - JSON 格式的 Q 表資料
     * @returns {boolean} 是否載入成功
     */
    loadQTable(jsonData) {
        try {
            var parsed = JSON.parse(jsonData);
        } catch (e) {
            console.error('Q 表資料解析失敗:', e.message);
            return false;
        }

        // 支援新格式（含 metadata）與舊格式（純 qTable）
        if (parsed && typeof parsed === 'object') {
            if (parsed.qTable && typeof parsed.qTable === 'object') {
                this.qTable = parsed.qTable;
                if (parsed.metadata) {
                    this.episodeCount = parsed.metadata.episodeCount || 0;
                    this.totalSteps = parsed.metadata.totalSteps || 0;
                    this.explorationRate = parsed.metadata.explorationRate || this.minExplorationRate;
                }
            } else {
                // 舊格式：直接是 qTable 物件
                this.qTable = parsed;
            }
            return true;
        }

        console.error('Q 表資料格式無效');
        return false;
    }

    /**
     * 清除 Q 表
     */
    clearQTable() {
        this.qTable = {};
        this.episodeCount = 0;
        this.totalSteps = 0;
        this.explorationRate = 1.0;
    }
}