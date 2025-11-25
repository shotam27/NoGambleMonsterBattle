# バトルアニメーション修正ガイド

## 現在の問題点

1. **複数のwatch処理が競合**
   - playerActiveIndexとopponentActiveIndexの監視が複雑
   - ログ処理中/非処理中の判定が不安定

2. **パーティ状態の同期問題**
   - ひんし状態が正しく保持されない
   - アクティブインデックスの更新タイミングがずれる

3. **HP表示の不整合**
   - displayedHpが実際のHPと同期しない場合がある

## 推奨される修正アプローチ

### 方法1: シンプルな実装（推奨）
ログ処理のみで演出を制御し、watchによる自動同期を最小限にする

```javascript
// 必要最小限のwatch
watch(() => props.playerParty, (newParty) => {
  if (newParty && !isProcessingLogs.value) {
    // ログ処理中でない時のみ同期
    displayedPlayerParty.value = JSON.parse(JSON.stringify(newParty));
    displayedPlayerActiveIndex.value = props.playerActiveIndex;
    displayedPlayerHp.value = newParty[props.playerActiveIndex]?.currentHp || 0;
  }
}, { immediate: true, deep: true });

// ログ処理で全ての演出を制御
const processLogAnimation = async (log) => {
  // 1. 攻撃アニメーション
  // 2. ダメージアニメーション  
  // 3. ひんし処理
  // 4. 交代処理
  // すべて順序通りに実行
};
```

### 方法2: 完全リセット
演出機能を一旦無効化して、基本機能を確認してから段階的に追加

## 次のステップ

どちらの方法で進めますか？
1. シンプルな実装で書き直す（推奨）
2. 現在のコードを段階的にデバッグ
3. 演出機能を一旦無効化して基本機能を確認
