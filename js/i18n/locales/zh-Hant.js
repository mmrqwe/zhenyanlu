const zhHant = {
  code: 'zh-Hant',
  htmlLang: 'zh-Hant',
  nativeName: '繁體中文',
  pageTitle: '毛主席語錄 · 抽卡',
  heroTitle: '毛 澤 東 語 錄',
  heroSubtitle: '迷惘時，抽一張卡片汲取力量',
  languageLabel: '語言',
  drawAgain: '再抽一張',
  drawOne: '抽 卡',
  drawFive: '連抽五張',
  deckName: '毛澤東',
  deckSeries: '語錄',
  footerLoading: '卡片資料載入中…',
  quoteCount: ({ count }) => `共 ${count} 張卡片 · 含原文語錄與主題摘述`,
  explainTitle: '釋義',
  tapHint: '點擊卡片查看釋義',
  sourceLabel: '出處',
  portraitAlt: '人物照片',
  silhouetteAlt: '人物剪影',
  defaultExplanation:
    '這句語錄凝聚了毛澤東同志在長期革命實踐中的深刻思考。它鼓勵人們在困境中不氣餒、不退縮，堅信光明的前途，憑藉堅忍不拔的意志和實事求是的態度，一步步克服困難，實現目標。',
  cardAriaLabel: ({ quote }) => `查看釋義：${quote}`,
  historyLabel: '最近抽到的語錄',
  historyItemLabel: ({ quote }) => `歷史記錄：${quote}`,
  closeLabel: '關閉',
};

export default zhHant;