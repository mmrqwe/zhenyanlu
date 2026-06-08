const zhHans = {
  code: 'zh-Hans',
  htmlLang: 'zh-Hans',
  nativeName: '简体中文',
  pageTitle: '毛主席语录 · 抽卡',
  heroTitle: '毛 泽 东 语 录',
  heroSubtitle: '迷茫时，抽一张卡片汲取力量',
  languageLabel: '语言',
  drawAgain: '再抽一张',
  drawOne: '抽 卡',
  drawFive: '连抽五张',
  deckName: '毛泽东',
  deckSeries: '语录',
  footerLoading: '卡片数据加载中…',
  quoteCount: ({ count }) => `共 ${count} 张卡片 · 含原文语录与主题摘述`,
  explainTitle: '释义',
  tapHint: '点击卡片查看释义',
  sourceLabel: '出处',
  portraitAlt: '人物照片',
  silhouetteAlt: '人物剪影',
  defaultExplanation:
    '这句语录凝聚了毛泽东同志在长期革命实践中的深刻思考。它鼓励人们在困境中不气馁、不退缩，坚信光明的前途，凭借坚忍不拔的意志和实事求是的态度，一步步克服困难，实现目标。',
  cardAriaLabel: ({ quote }) => `查看释义：${quote}`,
  historyLabel: '最近抽到的语录',
  historyItemLabel: ({ quote }) => `历史记录：${quote}`,
  closeLabel: '关闭',
};

export default zhHans;