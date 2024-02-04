const MYSingers = new Set([
    '- 民谣',
    '宋冬野',
    '赵雷',
    '万晓利',
    '好妹妹',
    '房东的猫',
    '朴树',
    '老狼',
    '李志',
    '李健',
    '毛不易',
    '陈粒',
    '陈琦贞',
    '张悬',
    '水木年华',
]);

const YGSingers = new Set([
    '- 摇滚',
    '五条人',
    '痛仰',
    '新裤子',
    '崔健',
    '万能青年旅店',
    'Beyond',
    '刺猬乐队',
    '左小诅咒',
    '张楚',
    '汪峰',
    '许巍',
    '郑钧',
    '逃跑计划',
    '伍佰',
]);

const ChinaSingers = new Set([
    '- 内地',
    '那英',
    '小沈阳',
    '凤凰传奇',
    '筷子兄弟',
    '羽泉',
    '陈楚生',
    '韩红',
]);

const HKTWSingers = new Set([
    '- 港台',
    '孙燕姿',
    '周杰伦',
    '五月天',
    '任贤齐',
    '刘若英',
    '周传雄',
    '周华健',
    '小虎队',
    '张信哲',
    '张惠妹',
    '张雨生',
    '张震岳',
    '张韶涵',
    '戴佩妮',
    '李宗盛',
    '梁咏琪',
    '江美琪',
    '光良',
    '王力宏',
    '王心凌',
    '王菲',
    '田馥甄',
    '罗大佑',
    '苏打绿',
    '莫文蔚',
    '蔡依林',
    '邓丽君',
    '邓紫棋',
    '陈奕迅',
    '陶喆',
    'SHE',
    '梁静茹',
]);

const AlwaysOnTop = new Set(['- 儿歌', '- 曲谱', '- 英文']);

function getRank(name, topSet) {
    if(topSet.has(name)) return 0;
    if(AlwaysOnTop.has(name)) return 1;
    if(MYSingers.has(name)) return 2;
    if(YGSingers.has(name)) return 3;
    if(HKTWSingers.has(name)) return 4;
    if(ChinaSingers.has(name)) return 5;

    return 6;
}

module.exports = {
    getRank
}