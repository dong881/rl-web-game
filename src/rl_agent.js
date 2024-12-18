function RLAgent() {
    this.qTable = {};
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.explorationRate = 1.0;
    this.explorationDecay = 0.999; // 調整探索率衰減
    this.minExplorationRate = 0.1; // 增大最小探索率

    this.getAction = function(state) {
        if (Math.random() < this.explorationRate) {
            return Math.floor(Math.random() * 4); // 隨機選擇行動
        } else {
            return this.getBestAction(state);
        }
    };

    this.getBestAction = function(state) {
        if (!this.qTable[state]) {
            this.qTable[state] = [0, 0, 0, 0]; // 初始化 Q 值
        }
        return this.qTable[state].indexOf(Math.max(...this.qTable[state]));
    };

    this.updateQValue = function(state, action, reward, nextState) {
        if (!this.qTable[state]) {
            this.qTable[state] = [0, 0, 0, 0];
        }
        if (!this.qTable[nextState]) {
            this.qTable[nextState] = [0, 0, 0, 0];
        }
        const oldValue = this.qTable[state][action];
        const nextMax = Math.max(...this.qTable[nextState]);
        const newValue = oldValue + this.learningRate * (reward + this.discountFactor * nextMax - oldValue);
        this.qTable[state][action] = newValue;
        // 更新探索率
        this.explorationRate = Math.max(this.minExplorationRate, this.explorationRate * this.explorationDecay);
    };

    // 保存 Q 表為 JSON 文件
    this.saveQTable = function() {
        const dataStr = JSON.stringify(this.qTable);
        const currentTime = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `qtable_${currentTime}.json`;
        const blob = new Blob([dataStr], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    };

    // 從 JSON 文件加載 Q 表
    this.loadQTable = function(jsonData) {
        this.qTable = JSON.parse(jsonData);
    };
}