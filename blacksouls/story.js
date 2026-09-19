/**
 * BLACK SOULS 手表版 —— 网页还原版剧本数据
 *
 * 内容照 D:\Blacksouls\wearbs\my-application-13\src\game\story.js 原样搬过来，
 * 结构不变，方便以后直接贴新剧本：只要 scenes 里的字段写法一致，逻辑不用改。
 *
 * step 类型：
 *   { say: ['说话人', '台词'] }                  一句台词（打字机，{name} 会替换成玩家取的名字）
 *   { bg: 'scene_room' }                        换背景（目前只有一张底板，保留字段兼容）
 *   { bust: 'alice' } / { bust: null }          显示 / 隐藏立绘
 *   { sprite: 'knight' }                        换桌子左边那个"你"的职业小图
 *   { input: 'name' }                           进入取名（整屏逐字选）
 *   { choice: [['文本', 'label'], ...] }        选项（滚动选，点击确定）
 *   { set: { 变量: 值 } } / { goto: 'label' } / { label: 'x' }
 *   { end: true }                               结束（回标题）
 */
window.BS_STORY = {
  start: 'prologue',

  scenes: {
    prologue: [
      { bg: 'scene_room', bust: 'alice' },

      { say: ['爱丽丝', '贵安'] },
      { say: ['爱丽丝', '诶诶、是在跟您说话呢。恭喜您了。您被选作了这个故事的主人公'] },
      { say: ['爱丽丝', '我是爱丽丝。首先请告诉我您的名字'] },

      { input: 'name' },

      { say: ['爱丽丝', '是{name}。对吧？'] },
      {
        choice: [
          ['是', 'name_yes'],
          ['否', 'name_no']
        ]
      },
      { label: 'name_yes' },
      { say: ['爱丽丝', '{name}先生。真是个好的名字。是啊，我觉得是个很好的名字。'] },
      { goto: 'origin' },
      { label: 'name_no' },
      // 截图里没有「否」这条线，这句和手表版一样是暂定的占位台词
      { say: ['爱丽丝', '……这样啊。不过，名字这种事随时都能改。'] },
      { goto: 'origin' },

      { label: 'origin' },
      { say: ['爱丽丝', '那么接下来请选择一下您的出身'] },
      {
        choice: [
          ['骑士', 'job_knight'],
          ['盗贼', 'job_thief'],
          ['魔术师', 'job_mage']
        ]
      },
      { label: 'job_knight' },
      { set: { job: '骑士' } },
      { sprite: 'knight' },
      { goto: 'confirm' },
      { label: 'job_thief' },
      { set: { job: '盗贼' } },
      { sprite: 'thief' },
      { goto: 'confirm' },
      { label: 'job_mage' },
      { set: { job: '魔术师' } },
      { sprite: 'mage' },
      { goto: 'confirm' },

      { label: 'confirm' },
      { say: ['爱丽丝', '呼姆。您感觉如何？虽然只是暂时的形态，不过也足够凑合用了。如果您喜欢的话就这样可以吗'] },
      {
        choice: [
          ['很中意', 'done'],
          ['不要这个', 'origin']
        ]
      },

      { label: 'done' },
      { say: ['爱丽丝', '那么，{name}。'] },
      { say: ['爱丽丝', '故事，要开始了——'] },
      { end: true }
    ]
  }
}
